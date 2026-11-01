# Change log

Each entry records what was done and why. Newest entries go last.

## portfolio-v1

- **Planning**: Fetched the `feature/reactive-portfolio` branch of devsha256.github.io; the `feature/reactive` branch named in the request does not exist. Wrote the spec, design and plan in `docs/`. Why: phases 1–3 come before any code.
- **U0**: Ran `git init` on branch `feat/portfolio-v1`. Why: per-unit commits need a repo, and work should not happen on the default branch.
- **U0**: Scaffolded Vite 8 + React 19 + TS strict + Tailwind 4 + Vitest (jsdom for UI, node for server) + ESLint 9 (complexity 10, max 40 lines per function, no `as` assertions, jsx-a11y). Why: this is the base every later unit builds on. Verified with a red test (App missing) → green, then lint, typecheck and build.
- **U0 deps**: Removed `arctic` because npm marks it deprecated. GitHub OAuth will use `fetch` instead (approved). Why: avoid an unmaintained auth library.
- **U0 deps**: Pinned ESLint to 9 because `eslint-plugin-jsx-a11y` does not support ESLint 10 yet. Did not use `--force` or `--legacy-peer-deps`.
- **U0 tests**: Set Vitest `pool: 'threads'`. Why: the `forks` pool timed out starting workers on this Windows machine.
- **U0 audit**: `npm audit` reports 2 moderate advisories in dev-only tooling: esbuild 0.18 (via drizzle-kit's `@esbuild-kit`, only affects esbuild's own dev server) and minimatch (via ESLint 9). The only fix npm offers downgrades drizzle-kit and jsx-a11y, so these stay listed as open issues.
- **U1**: Added `api/_lib/env.ts`, which parses env vars with zod and names every missing variable in an `EnvError`. It is called per request with no cached state. Why: env is a boundary, and failing fast with a clear message beats undefined secrets. Verified red (module missing) → 4 green tests. Also added `.gitattributes` (LF line endings) and allowed `_`-prefixed unused variables in lint.
- **U2**: Added the Drizzle schema (`posts`, `projects`, `admin_sessions`), the generated migration `0000_init.sql`, `db/client.ts` (`openDatabase`: PGlite for `pglite://`, Neon HTTP otherwise, with migrate and close), `db/migrate.ts` and `readDatabaseUrl`. Why: data comes first; constraints make illegal states impossible to write. Verified: 4 migration tests red→green (migrate twice; CHECK rejects a published post with no date, an unknown status and a reversed period), and `npm run db:migrate` twice on `.data/dev`. Fixed the script hanging by closing PGlite, and created the missing data folder.
- **U3**: Added the pure domain modules `slug.ts`, `experience.ts` (ported from the Jekyll counter, using UTC), `post.ts` (`applyStatus`: the first publish stamps the date and it is never moved; `readingMinutes`) and `project.ts` (`formatPeriod`, `collectSkills`, `filterBySkill`), plus the zod `contracts.ts` (Post/Project input, patch, DTO, list query, page). The schema now imports `POST_STATUSES` from the contracts. Why: one decision in one place; skill slugs are derived, which fixes the old Salesforce/SAP mislink. Verified: 5 suites red → 37 tests green; drizzle-kit reports no schema drift.
- **U4**: Added `api/_lib/posts-repo.ts`, `projects-repo.ts` and `errors.ts` (`uniquely()` turns SQLSTATE 23505 into `ConflictError`, unwrapping Drizzle's `cause`). Publishing is one atomic `UPDATE … SET published_at = coalesce(published_at, now)`, so I removed the pure `applyStatus` and pinned the rule in the repo tests instead. Why: the DB enforces one writer per row, and Neon HTTP has no transactions. Lists select summary columns without the body, are paginated, and filter tags with `@>`, which uses the GIN index. Verified: 17 repo tests red→green on PGlite, and 62 tests in total. Raised the server test timeout to 20 s because PGlite WASM starts slowly when many tests run in parallel.
- **U5**: Ported the content with a one-off converter. It ran from the scratchpad and is not kept in the repo; it used `yaml` and `sharp`, so neither is a project dependency.
  - Converted 3 posts (Liquid `{% highlight %}` → fenced code blocks) and 7 projects (date ranges → `YYYY-MM-01`, `Munit` → `MUnit`) into `db/seed-data/*.json`.
  - Converted 6 certifications, 15 feedback items and 309 learning entries into `src/content/*.json`. They are validated by `src/content/schema.ts` and sorted newest first.
  - Downscaled 8 images to at most 320 px (304 KB → 84 KB) in `public/img`.
  - Added the `db/seeder.ts` upsert and the `db:seed` script.
  - Why: content goes in before the UI; a seed that can run twice is safe.
  - Verified: red → 7 green tests (seed twice gives 3 published posts and 7 projects, the original date is kept, the JSON parses), and `npm run db:seed` twice. The schema check caught one certification with a null link, so `link` is now optional.
- **Test infra**: `*.test.ts` files run in the node environment and only `*.test.tsx` uses jsdom. Why: the jsdom worker timed out on startup, and pure tests don't need a DOM.
- **U6**: Added the HTTP layer in `api/_lib/http.ts`:
  - `respond()` maps `HttpError`→status, `ConflictError`→409 and anything else→a generic 500 with no leaked message.
  - `parseWith`/`readJson` use zod and return 400 with flattened issues.
  - `cachedJson` sends `s-maxage=300, stale-while-revalidate`.
  - `pathParam` reads the dynamic segment.
  Also added public handlers in `public-api.ts` and `serve()`, which builds the production context and reuses one DB connection per URL. Three Vercel functions now exist: `api/posts/index.ts`, `api/posts/[slug].ts` and `api/projects/index.ts`. Why: handlers only parse, call and respond, and CDN caching keeps Neon asleep on the free tier. Verified: 10 tests red→green (200 shape plus cache header, 400 for a bad limit or slug, 404 for a draft or missing slug, 500 hides details, DB reused).

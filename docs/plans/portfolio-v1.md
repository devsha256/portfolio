# Plan: portfolio-v1


Every unit follows the same loop:
1. Write a failing test and run it.
2. Make the smallest change that passes it.
3. Refactor.
4. Run `npm run lint && npm run typecheck && npm test`.
5. Append to `docs/change-log.md`.
6. Make one conventional commit.

For UI units, step 4 also runs `npm run build`.

| # | Unit | Test written first | Done-check |
|---|---|---|---|
| U0 | `git init` on branch `feat/portfolio-v1`; write the docs from steps 1–3; scaffold Vite+React+TS strict, Tailwind v4, ESLint (complexity 10, max-lines-per-function 40, jsx-a11y), Vitest+RTL, `.env.example`, `.gitignore` | `App` renders a `main` landmark | lint, typecheck, test, build pass |
| U1 | `api/_lib/env.ts` | missing `ADMIN_GITHUB_LOGIN` fails with a named error; valid env parses | test |
| U2 | `/06-db`: schema, first migration, `db/client.ts`, migrate script | migrate twice on PGlite succeeds; the CHECK constraint rejects a published post with no date | `npm run db:migrate` twice |
| U3 | domain: `post.ts`, `project.ts`, `experience.ts`, `contracts.ts` | table-driven tests, e.g. publish keeps an existing date, period text, month arithmetic at year boundaries | test |
| U4 | repos: `posts-repo.ts`, `projects-repo.ts` (PGlite) | list returns published only, in order and paginated; duplicate slug → `Conflict`; delete twice succeeds | test |
| U5 | content port: posts + projects → `db/seed.ts`; credentials → `src/content/*.json` + schema; images → `public/img` | seed twice gives stable counts; every JSON file parses with its schema | `npm run db:seed` twice |
| U6 | `http.ts` + public endpoints (posts, post by slug, projects) | handler(Request): 200 shape, 404 for a draft slug, 400 for bad `limit`, cache header present | test |
| U7 | auth: `session.ts`, `auth.ts`, `api/auth/[action].ts` (GitHub `fetch` mocked) | state mismatch → 400; non-allowlisted login → 403 and no row; allowlisted → cookie and hashed row; expired → 401; logout twice → 204 | test |
| U8 | admin endpoints for posts + projects | no cookie → 401; wrong Origin → 403; CRUD happy path; invalid body → 400; publish/unpublish | test |
| U9 | `feed.ts` + `api/feed/[kind].ts` + `vercel.json` rewrites | RSS has escaped titles and only published items; sitemap lists static routes plus slugs | test |
| U10 | dev API plugin so `npm run dev` serves `/api` | plugin resolves `/api/posts/abc` to `[slug].ts` with a param | test + manual dev check |
| U11 | `/05-ui` foundation: tokens, fonts, `Layout`, `Seo`, theme toggle, router, `useApi` | the toggle persists and sets the `class`; `useApi` reports a zod failure as an error state | build |
| U12 | `/05-ui` Home + About + Contact | renders the computed years and social links with accessible names | build + screenshot |
| U13 | `/05-ui` Projects (timeline, skill filter, GitHub repos with a sessionStorage cache) | `?skill=` filters; a GitHub failure shows the fallback link | build + screenshot |
| U14 | `/05-ui` Blog list + Post (lazy Markdown) + NotFound | only published posts are listed; tag filter; raw `<script>` in Markdown is not rendered | build + screenshot |
| U15 | `/05-ui` Credentials (tabs, search, pagination) | the search narrows learning entries; tabs are keyboard-operable | build + screenshot |
| U16 | `/05-ui` Admin: guard, sign-in, post list/editor with preview, project editor | the guard redirects on 401; the editor shows zod field errors; publish moves the post into the published state | build + manual OAuth check (needs your GitHub OAuth App) |
| U17 | polish: `robots.txt`, favicon, default meta, 404 | none (static files) | build |
| U18 | `/07-test`: coverage, complexity, `jscpd`, Stryker on `src/domain` + `api/_lib`, `knip`; fix root causes | n/a | every gate green; results go in the change log |

The order is schema → domain → API → auth → UI → polish, and each unit can be committed on its own. Nothing is pushed. If a step is destructive, paid or ambiguous, I stop and ask.


##  Files, dependencies, env vars, free-tier risks

**Files added**
- Root: `package.json`, `package-lock.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `vitest.config.ts`, `drizzle.config.ts`, `stryker.config.json`, `knip.json`, `.jscpd.json`, `vercel.json`, `.env.example`, `.gitignore`, `index.html`.
- `docs/`: `specs/`, `design/`, `plans/`, `glossary.md`, `change-log.md`.
- `db/`: `schema.ts`, `client.ts`, `migrate.ts`, `seed.ts`, `seed-data/`, `migrations/`.
- `api/`: the 9 functions above, plus `api/_lib/{env,http,posts-repo,projects-repo,session,auth,feed}.ts` with `*.test.ts` files next to them.
- `dev/api-plugin.ts`.
- `src/`:
  - Entry and app: `main.tsx`, `App.tsx`, `index.css`.
  - Code: `domain/*`, `lib/*`, `hooks/useApi.ts`, `components/*`, `pages/*`, `pages/admin/*`.
  - Content: `content/{certifications,feedbacks,learning}.json` and `content/schema.ts`.
- `public/`: `img/certifications/*`, `img/logos/*`, `favicon.svg`, `robots.txt`.

**Runtime dependencies (all OSS):** `react`, `react-dom`, `react-router`, `react-markdown`, `remark-gfm`, `zod`, `drizzle-orm`, `@neondatabase/serverless`, `arctic`, `@fontsource-variable/bricolage-grotesque`, `@fontsource-variable/source-serif-4`.

**Dev dependencies (all OSS):** `typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, `drizzle-kit`, `@electric-sql/pglite`, `tsx`, `@types/react`, `@types/react-dom`, `@types/node`, `jscpd`, `@stryker-mutator/core`, `@stryker-mutator/vitest-runner`, `knip`.

What I left out, and why:
- No TanStack Query: a 15-line `useApi` covers it.
- No react-helmet: React 19 handles `<title>` and `<meta>` natively.
- No Auth.js: Arctic plus about 60 lines is smaller.
- No permanent YAML parser: the content conversion runs once with `npx`, outside the repo.

**Env vars (`.env.example`)**
- `DATABASE_URL`: `pglite://./.data/dev` locally, Neon later.
- `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
- `ADMIN_GITHUB_LOGIN` (`devsha256`).
- `APP_URL` (`http://localhost:5173`).
- `.env.local` and `.data/` are gitignored.

**Free-tier risks**
- **Vercel Hobby function limit:** at most 12 functions per deployment, and this design uses 9. Adding endpoints later means merging them, not adding new files.
- **Neon free tier:** 0.5 GB storage and limited compute hours. The data is tiny. Public GETs use `s-maxage` CDN caching, so most visits never wake the database. The neon-http driver avoids connection-pool exhaustion.
- **Anonymous GitHub API:** 60 requests per hour per visitor IP. The result is cached in sessionStorage and has a fallback link.
- **SEO of a client-rendered app:** Google renders JS, but some crawlers and link unfurlers only see the default meta in `index.html`. The sitemap and RSS are server-built. Prerendering is out of scope and is logged as an open issue.
- **Vercel Hobby terms:** non-commercial use only, which fits a personal portfolio.
- **Manual step for you:** testing OAuth end to end needs a free GitHub OAuth App, with callback `http://localhost:5173/api/auth/callback`. Until it exists, auth is proven with mocked tests only.



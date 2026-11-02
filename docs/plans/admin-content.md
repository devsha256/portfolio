# Plan: admin-content

Same loop as portfolio-v1 for every unit:
1. Write a failing test.
2. Make the smallest change that passes it.
3. Refactor.
4. Run `npm run lint && npm run typecheck && npm test` (UI units also run `npm run build`).
5. Append to `docs/change-log.md`.
6. Make one conventional commit.

Read `docs/specs/admin-content.md` and `docs/design/admin-content.md` first.

| # | Unit | Run with | Test written first | Done-check |
|---|---|---|---|---|
| A1 | Contracts: `CredentialKind/Input/Patch/Dto`, `SiteProfile`, `DEFAULT_PROFILE` | `/04-build admin-content 1` | `{years}` is required in the summary; image must be under `/img/`; kind enum; patch is partial | test |
| A2 | Schema + migration `0001_admin_content` (`credentials`, `site_profile`) | `/06-db admin-content unit 2` | migrate twice; each CHECK and UNIQUE rejects bad rows by constraint name | `npm run db:migrate` ×2 |
| A3 | Seed: credentials JSON → DB (upsert on natural key), profile from `DEFAULT_PROFILE`; move the JSON to `db/seed-data/credentials/` | `/04-build admin-content 3` | seed twice gives 6/15/309 rows and 1 profile | `npm run db:seed` ×2 |
| A4 | Repos: `credentials-repo.ts`, `profile-repo.ts` | `/04-build admin-content 4` | list by kind is newest first; duplicate → `ConflictError`; `getProfile` falls back when the table is empty; save is an upsert | test |
| A5 | Public `api/content/[kind].ts` (credentials, profile, rss, sitemap, robots) replaces `api/feed`; update the `vercel.json` rewrites | `/04-build admin-content 5` | each kind 200 + cache header; unknown kind 404; bad `?kind` 400; function count ≤ 12 | test |
| A6 | Admin `api/admin/content/[kind].ts` + `api/admin/credentials/[id].ts` (reuse the `collection`/`item` factory; add `singleton`) | `/04-build admin-content 6` | 401/403 on every method; CRUD; PUT profile without `{years}` → 400 | test |
| A7 | Public UI reads the API: `useProfile`, `Summary`, Home tagline, About intro + certifications, `Credentials` page; delete `src/content/*` | `/05-ui public profile and credentials from API` | fallback renders while loading; API text replaces it; credentials tab lists API rows | build + screenshot; Credentials chunk < 10 KB |
| A8 | Admin UI: nav entries, `CredentialsAdmin`, `CredentialEditor` | `/05-ui admin credentials` | tab plus search; contract errors with no request; image select previews; 409 alert; delete with confirm | build + screenshot |
| A9 | Admin UI: `ProfileEditor` with preview and live "years" | `/05-ui admin profile editor` | save → status "Saved"; missing `{years}` shows a field error; years preview updates with the date | build + screenshot |
| A10 | Gates | `/07-test` | n/a | all gates green; knip shows no leftover `src/content` code |

## Free-tier flags
- **A5:** the function count goes from 9 to 11, still at or under 12. Do not add a separate profile function; extend `api/content/[kind]` instead.
- **A3:** about 330 rows is negligible for Neon storage.

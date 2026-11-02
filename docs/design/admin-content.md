# Design: admin-content

## Data (Drizzle, postgres skill)

### `credentials` table
| Column | Type |
|---|---|
| `id` | bigint identity PK |
| `kind` | text, `CHECK (kind IN ('certification','feedback','learning'))` |
| `name` | text not null |
| `authority` | text not null |
| `issued_on` | date not null |
| `credential_id` | text, nullable |
| `image` | text not null, `CHECK (image LIKE '/img/%')` |
| `link` | text, nullable |
| `proof` | text not null |
| `created_at` | timestamptz |
| `updated_at` | timestamptz |

- `UNIQUE (kind, name, issued_on)` is the natural key, so the seed can upsert and duplicates return 409.
- `INDEX (kind, issued_on DESC)` serves the public list path.

### `site_profile` table
A single-row table.

| Column | Type |
|---|---|
| `id` | smallint PK, `CHECK (id = 1)` |
| `tagline` | text not null |
| `career_start` | date not null |
| `summary_md` | text not null |
| `about_md` | text not null default `''` |
| `updated_at` | timestamptz |

Writes are `INSERT … ON CONFLICT (id) DO UPDATE`, so they are idempotent.

### Migration and seed
- One migration: `0001_admin_content` (`/06-db`).
- The seed upserts the 330 entries from `src/content/*.json` and the profile from `SITE` in `src/domain/site.ts`.
- After that, delete `src/content/*.json` and move the files to `db/seed-data/credentials/`. Subtract, don't duplicate.

## Contracts (`src/domain/contracts.ts`)
- `CredentialKind = z.enum(['certification','feedback','learning'])`
- `CredentialInput`:
  - `kind`
  - `name` (min 1, message "Enter a name")
  - `authority` ("Enter the issuer")
  - `issuedOn` (ISO date)
  - `credentialId?`
  - `image` (regex `^/img/`, message "Pick an image under /img")
  - `link?` (URL)
  - `proof` (URL)
- `CredentialPatch` is `CredentialInput.partial()`. `CredentialDto` adds `id`.
- `SiteProfile`:
  - `tagline` (1–120)
  - `careerStart` (ISO date)
  - `summaryMd` (1–4000; must contain `{years}`, message "Keep {years} where the experience should appear")
  - `aboutMd` (0–8000)
- `src/content/schema.ts` is replaced by these contracts. The public `Credential` type becomes `CredentialDto`.

## API (one public function added, the feeds folded in: total 11 of 12)
| Function | Methods | Auth |
|---|---|---|
| `api/content/[kind].ts` replaces `api/feed/[kind].ts` | GET `credentials` (`?kind=`), `profile`, `rss`, `sitemap`, `robots` | public, cached |
| `api/admin/content/[kind].ts` (new) | GET/PUT `profile`; GET/POST `credentials` | `requireAdmin` |
| `api/admin/credentials/[id].ts` (new) | GET, PATCH, DELETE | `requireAdmin` |

- The rewrites `/rss.xml`, `/sitemap.xml` and `/robots.txt` change target to `/api/content/<kind>`.
- `api/_lib/credentials-repo.ts`: `listByKind`, `listAll`, `get`, `create`, `update`, `delete`, using `constrained()` for 409/400.
- `api/_lib/profile-repo.ts`: `getProfile(db)` returns the row or the `SITE` fallback; `saveProfile(db, input, now)`.
- `admin-api.ts` reuses the generic `collection`/`item` factory for credentials. Profile gets a small `singleton` handler (GET/PUT).
- `api/functions.test.ts` keeps the limit check at 12 or fewer.

## UI (frontend-design: same tokens, no new visual language)
- **Admin nav:** Posts, Projects, Credentials, Profile.
- **`/admin/credentials` (`CredentialsAdmin`):**
  - Reuses `Tabs`, `searchCredentials` and `CredentialCard` (with an edit link).
  - A "New credential" button preselects the current tab's kind.
- **`/admin/credentials/:id` (`CredentialEditor`):**
  - Uses `Field`, `useSaveState` and `admin-client`.
  - The image field is a `<select>` of known `/img/**` paths with a live preview of the tile.
  - Kind is a radio group.
- **`/admin/profile` (`ProfileEditor`):**
  - Fields: tagline, career start (`type="date"`), summary and About intro, each a textarea with the existing lazy Markdown preview.
  - A "Years shown today" line computes `experienceSince` live.
- **Public:**
  - `useProfile()` (a `useApi` on `/api/content/profile`) feeds `Summary`, the Home tagline and the About intro. It renders the `SITE` fallback while loading, so there is no layout jump.
  - `Credentials.tsx` and the About certifications use `useApi('/api/content/credentials?kind=…')`. The Credentials route chunk drops from 100 KB to about 5 KB, because the JSON is no longer bundled.
- **Pure logic:** `summaryParagraphs(profile, now)` takes the profile instead of `SITE`. It splits Markdown paragraphs and replaces `{years}`.

## Subtract
- Delete `src/content/*.json`, `src/content/{certifications,feedbacks,learning}.ts` and `schema.ts` once the public pages read from the API.
- `SITE.summary`, `SITE.tagline` and `SITE.careerStart` remain only as `DEFAULT_PROFILE`, the fallback and seed source.

# Design: portfolio-v1


### Data (Drizzle, `db/schema.ts`)
- `post_status` enum: `'draft' | 'published'`.
- `posts` table:
  - Columns:
    - `id uuid pk default gen_random_uuid()`
    - `slug text unique not null`
    - `title text not null`
    - `excerpt text not null`
    - `body_md text not null`
    - `tags text[] not null default '{}'`
    - `status post_status not null default 'draft'`
    - `featured bool not null default false`
    - `published_at timestamptz`
    - `created_at timestamptz`
    - `updated_at timestamptz`
  - `CHECK (status = 'draft' OR published_at IS NOT NULL)`.
  - Partial index `(published_at DESC) WHERE status = 'published'`.
  - GIN index on `tags`.
- `projects` table:
  - Columns:
    - `id uuid pk`
    - `title text not null`
    - `company text not null`
    - `start_month date not null`
    - `end_month date` (null means Present)
    - `description text not null`
    - `skills text[] not null`
    - `created_at timestamptz`
    - `updated_at timestamptz`
  - `CHECK (end_month IS NULL OR end_month >= start_month)`.
  - Index on `(start_month DESC)`.
- `admin_sessions` table:
  - Columns:
    - `id text pk` (SHA-256 hex of the cookie token; the raw token is never stored)
    - `github_login text not null`
    - `expires_at timestamptz not null`
    - `created_at timestamptz`
  - Index on `expires_at`. Expired rows are deleted at login, so no cron is needed.
- Migrations come from `drizzle-kit generate` and are applied by `npm run db:migrate`.
- Seed: `npm run db:seed` upserts with `ON CONFLICT (slug)` / `(id)`, so it is safe to run twice.
- `db/client.ts` picks the driver from `DATABASE_URL`:
  - `pglite:` → `drizzle-orm/pglite` (local dev and tests).
  - Anything else → `drizzle-orm/neon-http`.

### Contracts (zod, `src/domain/contracts.ts`)
- Schemas: `PostInput`, `PostPatch`, `PostDto`, `PostListQuery {page, limit≤20, tag?}`, `ProjectInput`, `ProjectPatch`, `ProjectDto`, `GithubProfile {login, id}` and `Env`.
- All TS types come from `z.infer` or the Drizzle `$inferSelect`. No type is written out by hand.
- The credential JSON schemas live in `src/content/schema.ts` and are checked by a test.

### API (Web-standard `Request → Response` handlers; 9 Vercel functions)
| Function | Methods | Auth |
|---|---|---|
| `api/posts/index.ts` | GET list published (`?page&limit&tag`) | public, `s-maxage=300` |
| `api/posts/[slug].ts` | GET one published | public, cached |
| `api/projects/index.ts` | GET list | public, cached |
| `api/auth/[action].ts` | `login`, `callback`, `logout`, `me` | `me` needs a session |
| `api/admin/posts/index.ts` | GET all (drafts too), POST | `requireAdmin` |
| `api/admin/posts/[id].ts` | GET, PATCH (incl. publish/unpublish), DELETE | `requireAdmin` |
| `api/admin/projects/index.ts` | GET, POST | `requireAdmin` |
| `api/admin/projects/[id].ts` | GET, PATCH, DELETE | `requireAdmin` |
| `api/feed/[kind].ts` | `rss` / `sitemap` XML (rewrites `/rss.xml` and `/sitemap.xml` in `vercel.json`) | public, cached |

**Shared code in `api/_lib`**
- `env.ts` parses env with zod, once per call, with no module-level mutable state.
- `http.ts` has `json()`, `parseBody(schema)` (→ 400 with issues) and an error→status map (404, 409, 401, 403).
- `posts-repo.ts` and `projects-repo.ts` hold the queries.
- `session.ts` handles the token, hashing and the cookie.
  - Cookie: HttpOnly, SameSite=Lax, Path=/, 7 days, and Secure in production.
- `auth.ts` holds `requireAdmin(req)` and the Arctic GitHub client.
  - The OAuth `state` goes in a short-lived cookie and must match on callback.
  - Admin mutations also check that `Origin` equals `APP_URL`, as CSRF protection.
- `feed.ts` builds the RSS and sitemap XML with escaping.
- Handlers only parse, call and respond.

**Local dev:** a small Vite plugin, `dev/api-plugin.ts`, maps `/api/**` to the same handler files. `npm run dev` therefore runs the whole app without `vercel dev` or a Vercel account.

### Pure domain (`src/domain`)
- `post.ts`: `slugify`, `readingMinutes`, `publish(post, now)` (keeps an existing `publishedAt`) and `unpublish`.
- `project.ts`: `formatPeriod`, `sortByStartDesc`, `skillSlug` and `collectSkills`.
- `experience.ts`: `experienceSince(start, now)` → "5 Years 8 Months", ported from the old code.

### UI (`frontend-design`)
**Direction.** The subject is an integration architect, so the site borrows the visual language of integration flow diagrams. Thin connector lines and nodes link the sections. The hero shows the name as the endpoint of a source → transform → target flow drawn in SVG. A single page-load pulse travels along the connector. It is the only ambient motion and it respects `prefers-reduced-motion`. Projects form a real sequence, so they render as a vertical timeline on one connector line.

**Palette.** The light theme uses:
- Fog `#EEF1F4` (background)
- Harbor `#12355B` (text and headings)
- Steel `#5B6B7A` (secondary text)
- Signal amber `#E8A33D` (connectors and focus)
- Pine `#2F7D5B` (published status)

The dark theme inverts to Harbor-deep `#0E2238` with a Fog foreground. The old theme toggle is kept, and the default follows `prefers-color-scheme`.

**Type.** Bricolage Grotesque Variable for display and UI. Source Serif 4 Variable for blog body text, with a line length of 68ch or less and line-height 1.7. Both are self-hosted through @fontsource (OFL).

**Structure**
- Components only render. Hooks fetch: `useApi(path, schema)` validates every response with zod and supports abort. Pure logic stays in `src/lib` and `src/domain`.
- Layout: `Layout` (skip link, header nav, theme toggle, footer) and `Seo` (React 19 native `<title>`/`<meta>`, so no helmet dependency).
- Public pages: `Home`, `Projects`, `Blog`, `Post`, `About`, `Contact`, `Credentials` and `NotFound`.
- Admin pages: `AdminHome`, `PostList`, `PostEditor` and `ProjectEditor`.
  - The post editor uses a textarea with a live preview, and the preview reuses the `Markdown` component.
- `AdminGuard` calls `/api/auth/me` for UX only. The server still enforces access.
- `Markdown` (react-markdown + remark-gfm) and all admin pages are lazy-loaded chunks, to keep the public bundle lean.



# Portfolio Project



Rebuild of https://devsha256.github.io (Jekyll + CDN React) into a full portfolio with blog and admin. Must cost $0 to build and run. Traffic is very low.



## Stack

- Frontend: React + Vite (TypeScript), React Router, Tailwind

- Backend: Node (TypeScript), Vercel serverless functions in `/api`

- DB: Neon Postgres (or Turso). ORM: Drizzle

- Auth: GitHub OAuth (Auth.js or Arctic). Admin = single allowlisted GitHub username via env `ADMIN_GITHUB_LOGIN`

- Blog: Markdown stored in DB, rendered with `react-markdown` + `remark-gfm`

- Hosting: Vercel free tier. Images: Cloudflare R2 or repo `/public`

- Only open-source, free-tier tools. Ask before adding any paid or non-OSS dependency.



## Structure

```

/src          React app (pages, components, hooks, lib)

/api          Serverless endpoints (auth, posts, projects)

/db           Drizzle schema + migrations

/public       Static assets

```



## Commands

- `npm run dev` dev server

- `npm run build` production build

- `npm run lint` / `npm run typecheck`

- `npm run db:migrate` apply migrations



## Rules

- Public routes: `/`, `/projects`, `/blog`, `/blog/:slug`, `/about`, `/contact`

- Admin routes under `/admin/*`; every admin API checks session + allowlist server-side

- Secrets only in env vars (`.env.local`, never committed). Provide `.env.example`

- Validate all API input with zod

- Keep functions small; no unused dependencies; keep bundle lean

- Accessible, responsive, SEO-ready (meta tags, sitemap, RSS)

- Stay within free-tier limits (Vercel functions, Neon storage)



## Workflow

- Small commits, conventional messages (`feat:`, `fix:`)

- Run lint + typecheck + build before finishing a task

- Use the `frontend-design` skill for all UI work, `postgres` skill for schema/queries

- Run `code-review` before merging



## Phases

1. Scaffold Vite + React + Tailwind, port existing content

2. Public pages + blog rendering

3. DB + API + GitHub OAuth

4. Admin dashboard (post/project CRUD, Markdown editor)

5. SEO, RSS, deploy to Vercel




# Portfolio

React + Vite front end, Vercel functions in `/api`, Postgres through Drizzle. See `CLAUDE.md` for the stack and rules.

## Run it from a fresh clone

The database is not in git. Locally it is a PGlite folder under `.data/`, which is ignored. You rebuild it from the
migrations and the seed data in `db/seed-data/`, which hold all the content ported from the old site:
3 posts, 7 projects, 6 certifications, 15 feedback items, 309 learning entries and the home/about profile.

1. Install dependencies (Node 22 or newer):

   ```bash
   npm ci
   ```

2. Create `.env.local` from the example:

   ```bash
   cp .env.example .env.local
   ```

   - Set `APP_URL` to the exact origin you open in the browser. Admin saves from any other origin are refused, and
     GitHub sends you back to this origin after sign-in.
   - Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from a GitHub OAuth App whose callback is
     `<APP_URL>/api/auth/callback`. You need these only for `/admin`.

3. Create the tables and load the content:

   ```bash
   npm run db:setup
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

   The dev script binds to `192.168.1.3`. On a machine without that address, run `npx vite` (localhost) or
   `npx vite --host <your-ip>` instead, and keep `APP_URL` matching.

Sign in at `/admin` with the GitHub login in `ADMIN_GITHUB_LOGIN`. Everything seeded can then be edited there.

## Things to know about the seed

- Running `db:setup` or `db:seed` again is safe: rows are upserted, never duplicated.
- A rerun **overwrites admin edits** to seeded posts, projects and credentials with the values in `db/seed-data/`.
  The profile is only inserted when missing, so its edits survive.
- Content created or edited in the admin lives only in your database. It is not in git, so a new clone or zip
  does not include it.

## CI and deploy

`.github/workflows/main.yml` runs on GitHub Actions:

- **Pull request to `main`/`master`:** lint, typecheck, tests with coverage, build, jscpd, knip, and `npm audit` of
  production dependencies.
- **Push to `main`/`master`:** the same checks, then Neon migrations (`npm run db:migrate`), a production deploy with
  the Vercel CLI, and a smoke test of the live site, starting with `/api/health`. If the smoke test fails, the deploy is rolled back.
- The seed never runs in CI. Seed production once, by hand, before the first deploy.
- Vercel's own Git deploys are off for `main`/`master` (`vercel.json`), so only the workflow ships production.
  Pull requests still get Vercel previews.
- Mutation testing (`npm run quality:mutation`) runs only locally.

Before the first push to `main`, add these to the repo under Settings → Environments → `production`:

- Secrets: `DATABASE_URL` (Neon direct URL), `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. The last two are
  in `.vercel/project.json` after `npx vercel link`.
- Variable: `APP_URL` (for example `https://<project>.vercel.app`).

On a private repo with the free GitHub plan, environment secrets aren't available. Add them as repository secrets
and variables instead, and delete the `environment:` block from the `deploy` job.

`/api/health` returns `{ "status": "ok" }` and never queries the database. Point uptime monitors at it, not at a
page that reads data: a 5-minute check that wakes Neon would use up its free compute hours.

## Checks

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

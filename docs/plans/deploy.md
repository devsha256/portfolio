# Plan: deploy, monitor and manage the portfolio for $0

Status: draft for approval. Nothing here has been run yet.
Free-tier figures were checked on 2026-11-03 against the vendors' own pages (sources at the end). Recheck them on the day you sign up.

## 1. Service picks

| Need | Service | Free allowance that matters here | Why this one |
|---|---|---|---|
| Code, CI, security scans | **GitHub** (public repo) | Unlimited Actions minutes on public repos; Dependabot; CodeQL and secret scanning are free on public repos | Already the source of truth and the OAuth provider |
| Hosting: static site + `/api` functions | **Vercel Hobby** | 100 GB transfer, 1M function invocations, 4 h active CPU, 100 deploys a day, **12 functions per deployment** (we use 11), runtime logs kept 1 h | Named in CLAUDE.md; the code already uses Vercel's function layout and CDN headers |
| Postgres | **Neon Free** | 1 GB storage per project, 100 CU-hours a month, scales to zero after 5 min idle, 10 branches, 6 h restore window, 5 GB egress | Named in CLAUDE.md; `db/client.ts` already has the Neon HTTP driver |
| Admin sign-in | **GitHub OAuth App** | Free, no limits that matter | Already implemented |
| Visitor analytics | **Vercel Web Analytics** | 50,000 events a month, 1 month retention | No cookies; loads from a script tag, so no npm dependency |
| Real-user performance | **Vercel Speed Insights** | 10,000 data points a month, 1 project, 7-day window | Same, a script tag only |
| Uptime and alerts | **UptimeRobot Free** | 50 monitors, 5-minute interval, email alerts; current terms allow any use, including commercial | Independent of Vercel, so it still alerts when Vercel is down |
| Error tracking (optional, your call) | **Sentry Developer** | 5,000 errors a month, 1 user | Vercel Hobby keeps logs only 1 h and has no log drains. The SDK is MIT-licensed, but the service is not open source, so this needs your OK under CLAUDE.md |
| Domain | `*.vercel.app` | Free | A custom domain costs money, so it stays out of scope |
| Images | Repo `/public` | Counts toward the 100 GB transfer | 8 small images; R2 isn't needed |

**$0 guarantee.** None of these needs a payment card on the free plan. Going over a limit pauses the service and never bills you: Vercel pauses the project, Neon suspends compute, and Analytics stops collecting. Don't add a card anywhere, so nothing can switch to a paid plan.

**Usage rule.** Vercel Hobby allows only non-commercial personal use. A personal portfolio and blog fits. Selling services, running ads or taking payment for the site would not.

### Considered and not picked

- **Cloudflare Pages + Workers:** more generous limits, but it would mean reworking the function layout and the CDN headers. Keep it as the fallback host if Vercel's terms change.
- **Netlify:** its free plan is now credit-based, and the functions layout differs.
- **Render free:** web services sleep, so cold starts take tens of seconds.
- **Supabase free:** pauses after a week without activity. Neon only suspends compute and wakes in under a second.
- **Turso:** SQLite, which would mean rewriting the Postgres schema (arrays, GIN index, CHECKs).
- **Better Stack free:** a fine alternative to UptimeRobot. Pick one, not both.

## 2. Budget at low traffic (≈1,000 visits a month)

| Resource | Estimate | Limit | Headroom |
|---|---|---|---|
| Vercel invocations | ~3k visitors + 8.6k uptime pings + 30 daily checks ≈ 12k | 1M | >80× |
| Vercel transfer | ~1,000 × 0.5 MB ≈ 0.5 GB | 100 GB | >100× |
| Neon compute | Public reads are CDN-cached, so Neon wakes rarely: ~300 wakes × 5 min × 0.25 CU ≈ 6 CU-h | 100 CU-h | ~15× |
| Neon storage | <20 MB | 1 GB | 50× |
| Web Analytics | ~3k page views | 50k | 15× |

**Main trap: uptime checks.** A check that touches the database every 5 minutes stops Neon from ever suspending: 0.25 CU × 730 h ≈ 182 CU-h, more than the 100 CU-h limit. So:

- `/api/health` must not touch the database. It is what UptimeRobot pings every 5 minutes.
- Once a day, a GitHub Actions job checks a database-backed route.

## 3. Gaps in the code before deploy

| # | Gap | Fix |
|---|---|---|
| G1 | No `/api/health`, which `/11-deploy` expects | **Done**: a `health` kind in `api/content/[kind].ts` plus a `/api/health` rewrite. It returns `{ "status": "ok" }` with `no-store` and never queries the DB. Function count stays at 11 of 12 |
| G2 | No CI | **Done**: `.github/workflows/main.yml` runs the gates on PRs; on push to `main`/`master` it also migrates Neon, deploys with the Vercel CLI and smoke-tests (rolls back on failure). Stryker stays local |
| G3 | The Neon driver has never run | Dry run against a Neon `preview` branch (D4) before production |
| G4 | Functions run in `iad1` by default, possibly far from the database | Pin `regions` in `vercel.json` to the region next to your Neon project |
| G5 | PGlite (dev-only) may get traced into the function bundles through the dynamic import | Check function sizes in the first preview build. If they're bloated, add `excludeFiles` for `@electric-sql/pglite` |
| G6 | No analytics | Add the two Vercel script tags to `index.html`, enabled per project in the dashboard |
| G7 | Neon's 6 h restore window is the only backup | Weekly Actions job runs `pg_dump --exclude-table-data=admin_sessions` and stores the dump as an artifact for 90 days |
| G8 | Quality gates still open | Finish `/07-test` (Stryker), then `/08-review` and `/09-secure` |

## 4. Units (each one: test first where it applies, log, one commit)

| Unit | What | Done when | Who |
|---|---|---|---|
| D0 | Gates: finish mutation testing, `/08-review`, `/09-secure` | All gates green, results in the change log | me |
| D1 | G1 health endpoint (**done**; also in the workflow smoke test) | Test green; `curl /api/health` works in dev | me |
| D2 | G2 CI and deploy workflow (**done**); `.github/dependabot.yml` still to add | Workflow passes on the first push | me, then you push |
| D3 | G4, G5, G6 in `vercel.json` and `index.html`; `.env.example` notes for production | Build passes locally | me |
| D4 | **Neon setup.** Create the project in your chosen region, with branch `main` (production) and branch `preview`. From your machine, run `npm run db:setup` against `preview` with its direct (non-pooled) URL, twice. Count rows; open `/api/posts` against it locally | 3 / 7 / 330 / 1 rows, unchanged on the second run | you create the project; I run the commands with the URL you paste into `.env.local`, never into chat |
| D5 | **GitHub OAuth Apps.** One for production (callback `https://<project>.vercel.app/api/auth/callback`), one for local dev. Preview deploys don't get admin sign-in: their URLs change, and an OAuth App takes one callback URL | Both apps exist; the IDs and secrets are in Vercel and `.env.local` | you |
| D6 | **GitHub repo.** Create it (public is recommended, see decisions), push `main` and `feat/portfolio-v1`, open a PR. Enable Dependabot alerts, secret scanning with push protection, and CodeQL default setup | CI green on the PR | you push; I prepare the PR text with `/10-ship` |
| D7 | **Vercel project.** Import the repo (preset Vite, output `dist`). Set env vars per environment: Production uses Neon `main`, the production OAuth App and `APP_URL=https://<project>.vercel.app`. Preview uses Neon `preview`, dummy OAuth values and the branch alias as `APP_URL`. Keep Deployment Protection on for previews. Add the GitHub `production` environment secrets (`DATABASE_URL`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) and variable `APP_URL` | The PR gets a preview URL | you, with me guiding |
| D8 | **Preview smoke test** (`/11-deploy preview`): `/`, `/projects`, `/blog`, a post, `/credentials`, `/about`, `/contact`, `/rss.xml`, `/sitemap.xml`, `/robots.txt`, `/api/health`; `/api/admin/posts` gives 401; cache headers match the design; function sizes and cold start are acceptable | Every check passes and the results are logged | me, using the preview URL |
| D9 | **Production.** Run `db:setup` against Neon `main`, merge the PR to `main` (the Action migrates, deploys and smoke-tests), sign in at `/admin`, edit then revert one post, tag `v1.0.0` | Admin round-trip works on production | you merge and sign in; I verify and tag |
| D10 | **Monitoring.** Enable Web Analytics and Speed Insights in Vercel. Add two UptimeRobot monitors: a keyword check on `/` and `/api/health`, with email alerts. Add `.github/workflows/daily-check.yml`: a daily `curl` of `/api/posts?limit=1` that fails the job on a non-200. GitHub emails you on failure | A test alert arrives; the daily job passes once by hand | you create the accounts; I write the workflow |
| D11 | **Backups.** G7 weekly `pg_dump` workflow (`DATABASE_URL` as a GitHub Actions secret; a read-only Neon role is preferred) | One manual run leaves a downloadable artifact | me, after your OK on the secret |
| D12 | **Optional, needs your OK:** Sentry free for server functions only | A thrown test error shows up in Sentry | me |

## 5. Running it day to day

- **Content:** `/admin` on the production URL. Seeding production again **overwrites admin edits** to seeded rows, so seed only the first time (D9).
- **Schema changes:** `/06-db` → test the migration on Neon `preview` → apply it to `main` → then deploy. Each migration has a down script in `db/migrations/down`.
- **Deploys:** merging to `main` deploys production; each PR gets a preview.
- **Rollback:**
  - Code: Vercel Instant Rollback in the dashboard, or `vercel rollback`.
  - Data: Neon point-in-time restore within 6 h, or the latest weekly dump.
- **Monthly check (`/13-retro`):** usage in Vercel → Usage and in the Neon console, Dependabot PRs, and the UptimeRobot uptime report.
- **Secrets:** only in Vercel env vars, GitHub Actions secrets and your local `.env.local`. Rotate the OAuth secret and the Neon password if either is ever exposed.

## 6. Risks

| Risk | Mitigation |
|---|---|
| The Neon HTTP driver or its migrator misbehaves (never run) | D4 dry run on a branch first; the repos already avoid transactions |
| A cold Neon start (~0.5–1 s) slows the first uncached request | CDN caching on public reads; acceptable at this traffic |
| Crawlers and link previews see only the default meta (client-side rendering) | Known open issue; prerendering is a later unit |
| Scheduled workflows on public repos stop after 60 days without repo activity | The daily check's failure email doubles as a reminder; re-enable it with one click |
| Free-tier terms change | Recheck at signup and in the monthly retro; Cloudflare is the fallback host |
| One learning entry is dated 2026-11-01 (possibly a placeholder) | Check it in the admin after launch |

## 7. Decisions needed from you

1. **Repo visibility:** public (recommended: free CodeQL, secret scanning, unlimited Actions) or private (2,000 Actions minutes a month, no free CodeQL).
2. **Region:** where most visitors are, for example Singapore (Vercel `sin1` + Neon `aws-ap-southeast-1`) or US East (`iad1` + `aws-us-east-1`).
3. **Vercel project name:** this sets `https://<name>.vercel.app`.
4. **Sentry:** add it (D12) or rely on 1 h Vercel logs plus uptime alerts.
5. **Analytics:** enable Vercel Web Analytics and Speed Insights, or none.

## Sources

- Vercel limits: https://vercel.com/docs/limits
- Vercel Hobby allotments and commercial-use rule: https://vercel.com/docs/limits/fair-use-guidelines
- Vercel 12-function rule: https://vercel.com/docs/functions/runtimes#functions-created-per-deployment
- Vercel Hobby plan (Analytics, Speed Insights): https://vercel.com/docs/plans/hobby
- Speed Insights limits: https://vercel.com/docs/speed-insights/limits-and-pricing
- Neon pricing: https://neon.com/pricing
- Neon HTTP has no transactions: https://community.neon.tech/t/how-do-i-handle-transactions/1067
- UptimeRobot terms: https://uptimerobot.com/terms
- Sentry free plan summary: https://costbench.com/software/developer-tools/sentry/free-plan/

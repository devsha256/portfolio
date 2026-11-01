---
description: Phase 5 - Free security check (auth, secrets, input, deps).
argument-hint: [path]
---
Follow CLAUDE.md. Scope: ${ARGUMENTS:-whole repo}

Run free tools, then manual checks. Report file:line.
1. `npx semgrep --config p/typescript --config p/react --config p/nodejs .` (Semgrep CE; skip if unavailable and say so).
2. `npm audit --omit=dev`.
3. Secrets: `git grep -nE "(api[_-]?key|secret|token)\s*[:=]"`; confirm `.env.example` complete and `.env*` ignored.
4. Every `/api/admin/*` and `/admin/*` enforces session + `ADMIN_GITHUB_LOGIN` server-side.
5. OAuth: state param, secure httpOnly cookies, callback allowlist.
6. Input validated with zod; markdown rendering sanitized (no raw HTML / XSS).
7. SQL via Drizzle only; CORS and rate limiting on write routes.

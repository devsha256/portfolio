---
description: Phase 8 - Maintenance. Debt, deps, free-tier usage review.
---
Follow CLAUDE.md and `portfolio-clean-code`.

1. `npm outdated` and `npm audit`; propose safe upgrades only.
2. Run `/07-test` on whole repo; list top 5 debt items.
3. Check Vercel and Neon usage vs free limits.
4. Prune stale branches, unused deps (`npx knip`), old docs.
5. Summarize `docs/change-log.md`; update CLAUDE.md if rules drifted.

---
description: Phase 7 - Deploy to Vercel (preview then production).
argument-hint: preview | prod
---
Follow CLAUDE.md. Target: $ARGUMENTS

1. Confirm CI green and `/10-ship` done.
2. Env vars set in Vercel (never in repo); DB migration applied to Neon before deploy, idempotent.
3. `preview`: deploy, smoke test `/`, `/blog`, `/api/health`, GitHub login.
4. `prod`: only after preview passes and user confirms. Tag release `vX.Y.Z`.
5. Report URL, usage vs free-tier limits, rollback command (`vercel rollback`).

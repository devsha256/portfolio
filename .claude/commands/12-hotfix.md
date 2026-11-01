---
description: Phase 8 - Maintenance. Fix a production bug.
argument-hint: <bug description>
---
Follow CLAUDE.md and `portfolio-clean-code`. Bug: $ARGUMENTS

1. Reproduce with a failing test first.
2. Fix the root cause, smallest edit. No guard that only hides the crash.
3. Run `/07-test` on touched paths, then `/09-secure` if auth or input involved.
4. Branch `fix/<slug>`; commit why/what/proof; then `/10-ship` and `/11-deploy prod`.
5. Add the bug and lesson to `docs/change-log.md`.

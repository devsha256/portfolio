---
description: Phase 5 - Free code review of current changes (no paid tools).
argument-hint: [base branch]
---
Follow CLAUDE.md and `portfolio-clean-code`. Base: ${ARGUMENTS:-main}

1. Get the diff: `git diff ${ARGUMENTS:-main}...HEAD`.
2. Run free checks: `npm run lint`, `npm run typecheck`, `npx jscpd src api --min-lines 6`, `npx knip`.
3. Review the diff yourself against the skill: one decision one place, zod at boundaries, no `any`/`as` casts, pure domain logic, idempotency, behavioral tests, subtract-before-add.
4. Output list: severity, file:line, issue, fix. No praise, no rewrites.
5. Apply fixes only on approval, one commit per fix.
6. Optional (if PR open and `PR-Agent` Action configured): comment `/review` and `/improve` on the PR and merge its findings into the list.

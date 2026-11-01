---
description: Phase 4 - Implement one plan unit with TDD.
argument-hint: <spec slug> <unit number>
---
Follow CLAUDE.md and `portfolio-clean-code`. Target: $ARGUMENTS

1. Read the unit in docs/plans/.
2. RED: write failing Vitest test; run it; confirm expected failure.
3. GREEN: smallest change that passes.
4. REFACTOR: pin behavior, then restructure.
5. Run `npm run lint && npm run typecheck && npm test`.
6. Append action + reason to `docs/change-log.md`.
7. Stop after this unit. Do not start the next.

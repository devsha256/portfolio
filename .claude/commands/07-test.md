---
description: Phase 5 - Quality gate. Tests, complexity, duplication, mutation.
argument-hint: [path]
---
Follow `portfolio-clean-code` section "Make it Right". Scope: ${ARGUMENTS:-whole repo}

Run in order, fix root causes, report results:
1. `npm run lint && npm run typecheck && npm test -- --coverage`
2. ESLint complexity >10 or function >40 lines: split or test.
3. `npx jscpd src api --min-lines 6`: remove clones.
4. `npx stryker run` on `src/domain` and `api/_lib`: kill survivors.
5. `npx knip`: delete dead code.
6. Delete tests that pass when functions return nothing.

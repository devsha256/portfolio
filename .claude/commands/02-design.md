---
description: Phase 2 - Design. Data shape, API contract, UI structure.
argument-hint: <spec slug>
---
Follow CLAUDE.md and `portfolio-clean-code`. Spec: docs/specs/$ARGUMENTS.md

1. Data first: Drizzle schema + zod types (use skill `postgres`).
2. API contract: route, method, zod request/response, auth rule (`requireAdmin` or public).
3. UI: pages, components, state (use skill `frontend-design`).
4. Subtract first: reuse existing code before adding.
5. Write `docs/design/<slug>.md`. Do not write code.

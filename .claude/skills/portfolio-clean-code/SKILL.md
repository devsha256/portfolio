---
name: portfolio-clean-code
description: Clean-code workflow for the portfolio project (TypeScript, React + Vite, Node serverless on Vercel, Postgres + Drizzle, zod, Vitest). Every change goes Make it Work, then Make it Right, then Practice. Use when writing, changing or reviewing code in this repo.
---

# portfolio-clean-code

Adapted from unclebob/ub-mode for this stack. Every change follows:
1. Make it Work
2. Make it Right
3. Practice

## 1. Make it Work

**Smallest edit**
- One decision lives in one place.
- Subtract before you add. No new dependency if 10 lines do it (free-tier, lean bundle).

**Data first**
- Define the Drizzle schema and zod types before logic.
- Derive TS types from zod (`z.infer`) and from the schema. Never hand-duplicate a type.

**TDD (Vitest, plus React Testing Library for UI)**
- Write the failing test first. Watch it fail for the expected reason.
- Make the smallest change that passes.
- If an honest test is impractical (pure layout, CSS), skip it. Do not write a fake one.

**Redesign, don't bolt on**
- If a new requirement fights the design, ask what you would build had it existed from the start. Deliver it in small pieces.

## 2. Architecture rules for this stack

**Domain model**
- Entities: `Post`, `Project`, `AdminSession`.
- Use unions and enums for state (`status: 'draft' | 'published'`) so illegal states cannot be written.
- Keep a short glossary in `docs/glossary.md`.

**Boundaries**
- Validate with zod where data enters: API request bodies, query params, env vars, OAuth profile, DB rows from raw SQL.
- Inside, trust the types. No repeated checks.
- Business logic lives in pure functions under `src/domain` or `api/_lib`. Handlers only parse, call, respond.
- Auth check is server-side, in one `requireAdmin(req)` function. Never trust the client.

**Type discipline**
- `strict: true`. No `any`, no `@ts-ignore`, no `as` to silence errors.
- Parse outside data once at the edge.

**Idempotency**
- Migrations, seeds, publish and delete endpoints must be safe to run twice (`ON CONFLICT`, upserts, `IF NOT EXISTS`).
- Serverless functions are stateless. No module-level mutable state; use the DB.

**Concurrency**
- One writer per row. Use DB constraints and transactions rather than in-memory locks.

**React**
- Components render; hooks fetch; `lib` holds pure logic.
- Server state via fetch hooks or TanStack Query. Keep local state minimal.
- No duplicated fetch/format logic across pages.

## 3. Make it Right

- **Root cause:** reproduce with a test, fix the cause. A try/catch that hides the error is not a fix.
- **Verifiable units:** finish one small unit, run `npm test && npm run typecheck`, then continue.
- **Behavior over implementation:** test through the public interface (HTTP handler, rendered UI). A test that still passes when functions return nothing gets deleted.
- **Complexity:** ESLint `complexity` max 10 and `max-lines-per-function` 40. Split or test anything above.
- **Duplication:** run `npx jscpd src api --min-lines 6`. Remove clones.
- **Mutation:** run `npx stryker run` on `src/domain` and `api/_lib`. Kill survivors, cover the uncovered, delete dead code (`npx knip`).
- **Refactor:** pin behavior with tests, change structure, prove tests still pass.

## 4. Practice

- **Log:** keep `docs/change-log.md` entries of each action and why. Report it at the end.
- **Context:** keep the main thread small. Delegate bulk reading (lockfiles, long logs) elsewhere and keep only the summary.
- **Commits:** small, ordered, conventional (`feat:`, `fix:`, `refactor:`, `test:`). Each message says why, what, and how it was verified.
- **Cleanup:** remove stale branches, build output and unused deps after confirming nothing uses them. Uncommitted work waits for a decision.
- **Before finishing:** `npm run lint && npm run typecheck && npm test && npm run build`.

## Free-tier guardrails
- Stay inside Vercel and Neon free limits: no polling, cache reads, paginate lists.
- Ask before adding any paid or closed-source dependency.

# Change log

Each entry records what was done and why. Newest entries go last.

## portfolio-v1

- **Planning**: Fetched the `feature/reactive-portfolio` branch of devsha256.github.io; the `feature/reactive` branch named in the request does not exist. Wrote the spec, design and plan in `docs/`. Why: phases 1–3 come before any code.
- **U0**: Ran `git init` on branch `feat/portfolio-v1`. Why: per-unit commits need a repo, and work should not happen on the default branch.
- **U0**: Scaffolded Vite 8 + React 19 + TS strict + Tailwind 4 + Vitest (jsdom for UI, node for server) + ESLint 9 (complexity 10, max 40 lines per function, no `as` assertions, jsx-a11y). Why: this is the base every later unit builds on. Verified with a red test (App missing) → green, then lint, typecheck and build.
- **U0 deps**: Removed `arctic` because npm marks it deprecated. GitHub OAuth will use `fetch` instead (approved). Why: avoid an unmaintained auth library.
- **U0 deps**: Pinned ESLint to 9 because `eslint-plugin-jsx-a11y` does not support ESLint 10 yet. Did not use `--force` or `--legacy-peer-deps`.
- **U0 tests**: Set Vitest `pool: 'threads'`. Why: the `forks` pool timed out starting workers on this Windows machine.
- **U0 audit**: `npm audit` reports 2 moderate advisories in dev-only tooling: esbuild 0.18 (via drizzle-kit's `@esbuild-kit`, only affects esbuild's own dev server) and minimatch (via ESLint 9). The only fix npm offers downgrades drizzle-kit and jsx-a11y, so these stay listed as open issues.

# Development

The project builds with [Vite](https://vite.dev/), lints with
[Oxlint](https://oxc.rs/docs/guide/usage/linter), formats with
[Oxfmt](https://oxc.rs/docs/guide/usage/formatter), and type checks with
`tsc`. Each tool has its own config file:

| File             | Tool                               |
| ---------------- | ---------------------------------- |
| `vite.config.ts` | Vite (dev server and build)        |
| `.oxlintrc.json` | Oxlint                             |
| `.oxfmtrc.json`  | Oxfmt                              |
| `tsconfig.json`  | TypeScript (type check and editor) |

## Requirements

- Node.js `^20.19.0 || >=22.12.0`
- npm (lockfile is `package-lock.json`)

## Commands

| npm script             | Runs                                | Purpose                                           |
| ---------------------- | ----------------------------------- | ------------------------------------------------- |
| `npm run dev`          | `vite`                              | Dev server at `http://localhost:5173/neat-birds/` |
| `npm run build`        | `vite build`                        | Production build into `dist/`                     |
| `npm run preview`      | `vite preview`                      | Serve the built `dist/`                           |
| `npm run typecheck`    | `tsc`                               | Type check (`noEmit` is set in `tsconfig.json`)   |
| `npm run lint`         | `oxlint --type-aware`               | Lint, including type-aware rules                  |
| `npm run format`       | `oxfmt`                             | Format every file in place                        |
| `npm run format:check` | `oxfmt --check`                     | Fail if anything is unformatted                   |
| `npm run test`         | `vitest run`                        | Run the unit tests once                           |
| `npm run check`        | typecheck, lint, format:check, test | The gate for every change; CI runs it             |
| `npm run fix`          | `lint:fix` then `format`            | Apply auto-fixable lint fixes and formatting      |

`npm run check` is the gate for every change, and CI runs it before
building.

## Tests

[Vitest](https://vitest.dev/) tests live in `src/__tests__/`. They cover
`src/utils/neat.ts` (genome creation, feed-forward, mutation invariants,
crossover, compatibility distance, and the innovation registry), which has
no DOM dependencies. Modules that import the canvas (`bird.ts`, `ga.ts`,
`pipe.ts`, …) aren't unit tested; check those in the running game.

The innovation registry is module state shared by every test in a file. A
test that needs a clean registry calls `vi.resetModules()` and imports
`neat.ts` again.

## Linting

`.oxlintrc.json` configures Oxlint:

- Every rule in the `correctness` category is an error, plus the
  project-specific rules (`eqeqeq`, `prefer-const`, `no-var`,
  `import/no-cycle`, …).
- `--type-aware` (via `oxlint-tsgolint`) enables rules that need type
  information, such as `typescript/no-floating-promises`. For an
  intentional fire-and-forget promise, mark it with `void`.
- Suppress a rule on one line with
  `// oxlint-disable-next-line <rule>`, along with a comment saying why.

## Formatting

Oxfmt formats TS, CSS, HTML, JSON, and Markdown. The settings (double
quotes, semicolons, no trailing commas, 80 columns) carry over from the
previous Prettier config.

## Deployment

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on
every push to `main`. It installs with `npm ci`, runs `npm run check` and
`npm run build`, then publishes `dist/` to GitHub Pages. Vite's `base` is
`/neat-birds/` to match the Pages URL.

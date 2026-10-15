# Development

The project uses [Vite+](https://viteplus.dev/), a single toolchain that
wraps Vite (dev server and build), Oxlint (linting and type checking), and
Oxfmt (formatting) behind the `vp` CLI. All tool config lives in
[`vite.config.ts`](../vite.config.ts).

## Requirements

- Node.js `^22.18.0 || ^24.11.0 || >=26.0.0`
- npm (lockfile is `package-lock.json`)

You can run `vp` through the npm scripts or `npx vp`. Installing the global
CLI (see the [Vite+ guide](https://viteplus.dev/guide/global-cli)) lets you
call `vp` directly.

## Commands

| npm script        | Runs             | Purpose                                           |
| ----------------- | ---------------- | ------------------------------------------------- |
| `npm run dev`     | `vp dev`         | Dev server at `http://localhost:5173/neat-birds/` |
| `npm run build`   | `vp build`       | Production build into `dist/`                     |
| `npm run preview` | `vp preview`     | Serve the built `dist/`                           |
| `npm run check`   | `vp check`       | Format check, lint, and type check                |
| `npm run fix`     | `vp check --fix` | Apply formatter and auto-fixable lint fixes       |

There is no test suite yet. `vp check` is the gate for every change, and CI
runs it before building.

## Linting

The `lint` block in `vite.config.ts` configures Oxlint:

- Every rule in the `correctness` category is an error, plus the
  project-specific rules (`eqeqeq`, `prefer-const`, `no-var`,
  `typescript/no-explicit-any`, …).
- `typeAware` enables rules that need type information, such as
  `no-floating-promises`. For an intentional fire-and-forget promise, mark
  it with `void`.
- `typeCheck` makes `vp check` also report TypeScript errors, so there is no
  separate `tsc` step. `tsconfig.json` still drives editor support and the
  type checker's settings.
- Suppress a rule on one line with
  `// oxlint-disable-next-line <rule>`, along with a comment saying why.

## Formatting

Oxfmt formats TS, CSS, HTML, JSON, and Markdown. The settings (double
quotes, semicolons, no trailing commas, 80 columns) carry over from the
previous Prettier config.

## Deployment

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) runs on
every push to `main`. It sets up Vite+ with `voidzero-dev/setup-vp`, runs
`vp check` and `vp build`, then publishes `dist/` to GitHub Pages. Vite's
`base` is `/neat-birds/` to match the Pages URL.

# NEAT Birds

A Flappy Bird clone where a population of 500 birds evolves with a
hand-written NEAT implementation. It is plain TypeScript on an HTML5 canvas
with **zero runtime dependencies**, so new behaviour is written by hand,
not added from npm.

## Docs

Read the matching doc before changing that area:

- [docs/architecture.md](docs/architecture.md): module map, game loop, screens/actions, input, global state
- [docs/neat.md](docs/neat.md): genomes, innovation registry, mutation, crossover, speciation, generation breeding
- [docs/save-files.md](docs/save-files.md): checkpoint JSON format and versioning
- [docs/development.md](docs/development.md): npm scripts, Oxlint/Oxfmt config, CI and deploy

## Done means `npm run check` passes

There are no tests. `npm run check` (type check, lint, and format check) is
the whole gate; run `npm run fix` first to apply formatting. Confirm gameplay
changes in the running app (`npm run dev`).

## Gotchas

- Every user-triggered state change goes through `performAction()` in
  `src/utils/app.ts`; add a new `Action` there rather than mutating state
  from input handlers.
- Every clickable label is a `MenuItem` from `src/utils/menu.ts`. Screens
  draw those lists and `main.ts` hit-tests the same lists, so add or move a
  button there, never as a hard-coded rectangle.
- Use `showToast()` for user-facing messages, not `alert()`.
- Training and autoplay run at a fixed pipe speed so every generation is
  scored against the same environment; the speed ramp is standard-mode only.
- Changing what is serialized, or the network's inputs and outputs, requires
  bumping `SAVE_FILE_VERSION` in `src/state/index.ts`.
- Any code that loads genomes must call `syncGenomeCounters()` afterwards.
- Tunables live in `src/constants/`; put new magic numbers there with a
  comment explaining them.
- Mark an intentional fire-and-forget promise with `void`; type-aware lint
  rejects floating promises.

# Architecture

NEAT Birds is a single-page canvas game with no runtime dependencies. All
state lives in one mutable object, and a fixed-rate loop draws whichever
screen is active.

## Module map

| Path                   | Responsibility                                                                    |
| ---------------------- | --------------------------------------------------------------------------------- |
| `src/main.ts`          | Entry point: waits for the font, wires input, runs the loop                       |
| `src/state/index.ts`   | The global `state.current` object, reset, and save/load of checkpoint files       |
| `src/screens/*.ts`     | One `draw*Screen()` per `Screen`; `main.ts` also runs the simulation              |
| `src/utils/app.ts`     | `performAction()`: the single dispatcher for every `Action`                       |
| `src/utils/bird.ts`    | Bird physics, collision, drawing, and `think()` (network inputs → flap)           |
| `src/utils/pipe.ts`    | Pipe pool: create, activate/deactivate, move, draw                                |
| `src/utils/neat.ts`    | Genome encoding, innovation registry, feed-forward, mutation, crossover, distance |
| `src/utils/ga.ts`      | Population: speciation, fitness sharing, elitism, breeding the next generation    |
| `src/utils/sprites.ts` | Spritesheet regions for birds, pipes, ground; background images                   |
| `src/utils/sound.ts`   | Chiptune effects synthesized with the Web Audio API                               |
| `src/utils/menu.ts`    | Pause-menu items (shared by drawing and hit-testing)                              |
| `src/utils/canvas.ts`  | The canvas element, its 2D context, and `drawText()`                              |
| `src/utils/helper.ts`  | Small math/random/geometry helpers and `createCopy()` (deep clone)                |
| `src/constants/*.ts`   | Tunables and enums, grouped by domain (`app`, `bird`, `pipe`, `neat`)             |
| `src/types.ts`         | Shared interfaces: `Bird`, `Pipe`, `GameState`, `Sprite`, `PauseMenuItem`         |

## Game loop

`main.ts` calls `animate()`, which schedules `requestAnimationFrame` behind a
`setTimeout(FRAME_DELAY)` and calls `draw()`. `draw()` switches on
`state.current.activeScreen` and calls the matching screen function.

Only the main screen does simulation. Each frame `drawMainScreen()`:

1. Runs `simulate()` once, or `trainingSpeed` times in training mode
   (the 1x/2x/4x/8x fast-forward). It stops early if a tick ends the run.
2. Draws background, pipes, ground, HUD, and birds.

`simulate()` advances the pipes, then updates birds according to the mode:

- **Standard**: the player bird falls; input flaps it. Death shows the death
  screen and may record a new best score in `localStorage`.
- **Autoplay**: the player bird runs a loaded champion genome via `think()`.
- **Training**: every live bird runs `think()`; dead birds move to
  `deadBirds`. When none are left, `breedNextGeneration()` records stats,
  keeps the champion brain, and calls `nextGeneration()` from `ga.ts`.

Pipe speed ramps with score in standard mode only. Training and autoplay use
a fixed speed so every generation faces the same environment.

## Screens, actions, and input

`Screen` (title, main, pause, death) selects what is drawn. Every state
change triggered by the user goes through `performAction(Action)` in
`src/utils/app.ts`.

Input handlers in `main.ts` map keys and taps to actions:

- Keyboard (main screen only): `Space` flaps, `Escape` pauses, `↑`/`↓` cycle
  training speed.
- Click and touch: coordinates are scaled to the 500×400 logical canvas,
  then hit-tested against hard-coded rectangles per screen. These rectangles
  must match where the screen draws its labels. The pause menu avoids the
  duplication by hit-testing `getPauseMenuItems()`, the same list it draws.

## State

`state.current` (`GameState` in `src/types.ts`) holds everything: mode,
active screen, score and best values, the player bird, the training
population (`liveBirds`/`deadBirds`), the pipe pool, and chart history.
Modules import `state` and mutate it directly. `resetState()` returns birds
and pipes to their start positions without discarding the population.

See [save-files.md](save-files.md) for how state is exported and restored.

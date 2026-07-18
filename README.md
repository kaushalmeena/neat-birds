# NEAT Birds

A Flappy Bird–style game that learns to play itself using the **NEAT**
(NeuroEvolution of Augmenting Topologies) algorithm — implemented from scratch
in vanilla JavaScript, with no machine-learning libraries.

**▶ Play it live:** [kaushalmeena.github.io/neat-birds](https://kaushalmeena.github.io/neat-birds/)

## Features

- **Three modes** — play it yourself, watch a population evolve, or replay a
  trained brain.
- **From-scratch NEAT** — genomes, speciation, fitness sharing, elitism, and
  structural mutation, all hand-written (see [`src/utils/neat.js`](src/utils/neat.js)).
- **Training dashboard** — live best-distance, generation, population, and
  species counts, plus a best-distance-per-generation chart.
- **Speed multiplier** — fast-forward evolution at 1×/2×/4×/8× since rendering,
  not simulation, is the bottleneck.
- **Portable brains** — export the champion network to a JSON file and load it
  back later to watch it fly.
- **Retro presentation** — pixel-art sprites, multiple randomized backdrops, and
  chiptune sound effects synthesized with the Web Audio API.

## Modes

| Mode | What happens |
| --- | --- |
| **Standard** | You control a single bird. The pipes speed up as your score climbs. |
| **Training** | A population of 500 birds evolves generation after generation, unsupervised. Save the best brain from the pause menu. |
| **Autoplay** | Upload a previously saved brain file and watch it play on its own. |

## Controls

| Action | Keyboard | Mouse / Touch |
| --- | --- | --- |
| Flap (standard mode) | `Space` | Click / tap |
| Pause / resume | `Esc` | Tap **PAUSE** |
| Cycle training speed | `↑` / `↓` | Tap **SPEED** |

Menus (mode select, start, pause, save/load, restart, quit) are all clickable
or tappable.

## How it works

Each bird is driven by a small neural network. Every frame it receives five
normalized inputs — its vertical distance from the top and bottom of the screen,
the horizontal distance to the next pipe, and the vertical distance to that
pipe's top and bottom gap edges — plus a bias node. The single output decides
whether to flap.

In **training mode** the networks evolve rather than learn by backpropagation:

1. **Start minimal.** Every bird begins with inputs wired directly to the output
   and no hidden nodes.
2. **Score by survival.** A bird's fitness is how far it travels before dying.
3. **Speciate.** Birds with structurally similar networks are grouped so new
   topologies get time to mature before competing with the whole population.
4. **Reproduce.** Fitness sharing gives each species a share of the next
   generation; the fittest birds are bred via crossover and mutation while the
   overall champion carries over unchanged (elitism).
5. **Mutate.** Offspring can have weights perturbed, new connections added, or a
   connection split by a new hidden node — so networks grow more complex only
   when it helps.

Repeat, and the birds get measurably better at threading the pipes.

## Getting Started

### Requirements

- [Node.js](https://nodejs.org/) (v18 or newer)
- [git](https://git-scm.com/downloads) (only to clone this repository)

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/kaushalmeena/neat-birds.git
cd neat-birds
npm install
```

### Running

Start the dev server:

```bash
npm run dev
```

The app will be available at
[localhost:5173/neat-birds/](http://localhost:5173/neat-birds/).

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload. |
| `npm run build` | Build the production bundle into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Lint the source with ESLint. |
| `npm run lint:fix` | Lint and auto-fix where possible. |

## Project Structure

```
src/
  constants/   Tunable game and NEAT parameters
  screens/     Per-screen render functions (title, main, pause, death)
  state/       Central game state and brain save/load
  utils/       Entities (bird, pipe), the NEAT engine (neat, ga),
               rendering, input, and audio
  main.js      Entry point: game loop and input handling
```

## Tech Stack

- Vanilla JavaScript (ES modules) — no game or ML frameworks
- HTML5 Canvas for rendering
- Web Audio API for sound
- [Vite](https://vitejs.dev/) for bundling and dev server
- ESLint + Prettier for linting and formatting

## Credits

- Game art (birds, pipes, tiles, backgrounds) from the
  [Flappy Bird Assets](https://megacrash.itch.io/flappy-bird-assets) pack by
  **MegaCrash**, licensed under
  [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) font by
  **CodeMan38**, licensed under the
  [SIL Open Font License](https://openfontlicense.org/).

## Deployment

Every push to `main` is built and deployed to GitHub Pages automatically by the
[deploy workflow](.github/workflows/deploy.yml). One-time setup: in the
repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file
for details.

<div align="center">

<img src="public/favicon.png" alt="NEAT Birds logo" width="96" height="96" />

# NEAT Birds

**A Flappy Bird that evolves its own brain.** 🧠🐤

Watch a flock of 500 birds teach _themselves_ to fly through pipes using the
**NEAT** (NeuroEvolution of Augmenting Topologies) algorithm — hand-written in
TypeScript, with zero game or machine-learning libraries.

<a href="https://kaushalmeena.github.io/neat-birds/"><img src="https://img.shields.io/badge/%E2%96%B6%20Play-Live%20Demo-4ec0ca?style=for-the-badge&labelColor=272b30" alt="Play the live demo" /></a>

<table>
  <tr>
    <td align="center">
      <img src="screenshots/Title.png" width="270" alt="Title screen with mode select" /><br/>
      <sub><b>Pick a mode</b> — play, train, or replay</sub>
    </td>
    <td align="center">
      <img src="screenshots/Standard.png" width="270" alt="Standard mode gameplay" /><br/>
      <sub><b>Standard</b> — you vs. the pipes</sub>
    </td>
    <td align="center">
      <img src="screenshots/Training.png" width="270" alt="Training mode with 500 birds and live stats" /><br/>
      <sub><b>Training</b> — 500 birds evolving live</sub>
    </td>
  </tr>
</table>

</div>

## Features

- **Three modes** — play it yourself, watch a population evolve, or replay a
  trained brain.
- **From-scratch NEAT** — genomes, speciation, fitness sharing, elitism, and
  structural mutation, all hand-written (see [`src/utils/neat.ts`](src/utils/neat.ts)).
- **Training dashboard** — live best-distance, generation, population, and
  species counts, plus a best-distance-per-generation chart.
- **Speed multiplier** — fast-forward evolution at 1×/2×/4×/8× since rendering,
  not simulation, is the bottleneck.
- **Portable brains** — export the champion network to a JSON file and load it
  back later to watch it fly.
- **Retro presentation** — pixel-art sprites, multiple randomized backdrops, and
  chiptune sound effects synthesized with the Web Audio API.

## Modes

| Mode         | What happens                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Standard** | You control a single bird. The pipes speed up as your score climbs.                                                   |
| **Training** | A population of 500 birds evolves generation after generation, unsupervised. Save the best brain from the pause menu. |
| **Autoplay** | Upload a previously saved brain file and watch it play on its own.                                                    |

## Controls

| Action               | Keyboard  | Mouse / Touch |
| -------------------- | --------- | ------------- |
| Flap (standard mode) | `Space`   | Click / tap   |
| Pause / resume       | `Esc`     | Tap **PAUSE** |
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

## Tech Stack

- [TypeScript](https://www.typescriptlang.org/) (ES modules) — no game or ML frameworks
- HTML5 Canvas for rendering
- Web Audio API for sound
- [Vite](https://vitejs.dev/) for bundling and dev server
- ESLint + Prettier for linting and formatting

## Credits

- Game art (birds, pipes, tiles, backgrounds) from the [Flappy Bird Assets](https://megacrash.itch.io/flappy-bird-assets) pack by **MegaCrash**, licensed under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
- [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) font by **CodeMan38**, licensed under the [SIL Open Font License](https://openfontlicense.org/).

## Deployment

Every push to `main` is built and deployed to GitHub Pages automatically by the
[deploy workflow](.github/workflows/deploy.yml). One-time setup: in the
repository's **Settings → Pages**, set **Source** to **GitHub Actions**.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file
for details.

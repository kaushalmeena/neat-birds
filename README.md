# NEAT Birds

A flappy bird like game, that plays and learns itself using NEAT (NeuroEvolution of Augmenting Topologies) algorithm.

Live version is deployed at [https://kaushalmeena.github.io/neat-birds/](https://kaushalmeena.github.io/neat-birds/)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development purposes.

### Requirements

To install and run this project you need:

- [Node.js](https://nodejs.org/ "Node.js")
- [git](https://git-scm.com/downloads "git") (only to clone this repository)

### Installation

To set up everything in your local machine, you need to follow these steps:

1. Clone this repo and then change directory to the `neat-birds` folder:

```bash
git clone https://github.com/kaushalmeena/neat-birds.git
cd neat-birds
```

2. Install project dependencies using npm:

```bash
npm install
```

### Running

To run the project simply run:

```bash
npm run dev
```

Your app should now be running on [localhost:5173](http://localhost:5173/neat-birds/).

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
[deploy workflow](.github/workflows/deploy.yml). One-time setup: in the repository's
**Settings → Pages**, set **Source** to **GitHub Actions**.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

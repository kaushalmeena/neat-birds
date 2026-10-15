# NEAT implementation

The neuroevolution is a from-scratch implementation of NEAT (Stanley &
Miikkulainen, 2002). Genome-level operations are in `src/utils/neat.ts`;
population-level operations are in `src/utils/ga.ts`. All hyperparameters
are in `src/constants/neat.ts`.

## Network

Each bird's `brain` is a `Genome`: a list of node genes (input, bias, hidden,
output) and connection genes (`from`, `to`, `weight`, `enabled`,
`innovation`).

- **Inputs (5)**, normalized to roughly 0–1 by `think()` in `bird.ts`:
  1. bird's distance from the top of the screen
  2. bird's distance from the bottom of the screen
  3. horizontal distance to the next pipe
  4. vertical distance to the top edge of the gap
  5. vertical distance to the bottom edge of the gap
- **Bias**: one extra node fixed at 1.
- **Output (1)**: the bird flaps when it is above 0.5.

`feedForward()` resolves each output recursively through enabled incoming
connections, using the steepened sigmoid `1 / (1 + e^(-4.9x))` from the
paper. Genomes stay acyclic: `mutateAddConnection()` rejects any edge that
would create a cycle.

## Innovation registry

A module-level `innovations` object hands out:

- one **innovation number** per unique `from->to` connection, and
- one **node id** per split connection,

so the same structural mutation gets the same id in every genome. Crossover
and speciation rely on this to line up genes.

The registry is not saved. After loading genomes from a file,
`syncGenomeCounters()` must advance the counters past every loaded id, or new
mutations would reuse existing ids.

## Mutation

`mutateGenome()` applies, per offspring:

| Mutation       | Rate                                  | Effect                                                                                    |
| -------------- | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| Weights        | `WEIGHT_MUTATION_RATE` per connection | Perturb by up to `±WEIGHT_PERTURB_AMOUNT`, or replace outright (`WEIGHT_REPLACE_RATE`)    |
| Add connection | `ADD_CONNECTION_RATE`                 | Connect two previously unconnected nodes (up to 10 random attempts)                       |
| Add node       | `ADD_NODE_RATE`                       | Disable a connection and route it through a new hidden node (weight 1 in, old weight out) |

## Crossover

`crossoverGenomes(fitter, other)` takes the fitter parent first. Matching
genes are inherited at random from either parent; disjoint and excess genes
come from the fitter parent only. A gene disabled in either parent is
re-enabled with probability `GENE_REENABLE_RATE`.

## Speciation

`compatibilityDistance()` is

```
δ = MISMATCH_COEFFICIENT · (disjoint + excess) / N + WEIGHT_COEFFICIENT · avgWeightDiff
```

where `N` is the larger genome's connection count, or 1 when both genomes
have fewer than 20 connections. Birds join the first species whose
representative is within `COMPATIBILITY_THRESHOLD`; otherwise they found a
new one. Species are colored in rotation so speciation is visible.

## Producing a generation

`nextGeneration()` in `ga.ts`:

1. Sets `fitness = distance²` (frames survived, squared).
2. Speciates the population.
3. Scores each species by mean fitness (fitness sharing).
4. Copies the overall top `GLOBAL_ELITE_COUNT` birds unchanged, so the best
   distance never regresses.
5. Gives each species offspring in proportion to its share of total score.
   Only the top `SURVIVAL_RATE` of a species may parent. Species with at
   least `ELITE_SPECIES_SIZE` members also keep their champion unchanged.
6. Builds each child by crossover (`CROSSOVER_RATE`) or a cloned parent,
   then mutates it.
7. Trims or tops up (from the overall best bird) to exactly
   `BIRD_CREATE_LIMIT` (500).

## Tuning

Change hyperparameters in `src/constants/neat.ts`. The population size is
`BIRD_CREATE_LIMIT` in `src/constants/bird.ts`. Changing `INPUT_COUNT` or
`OUTPUT_COUNT` also requires updating `think()` and makes existing save
files incompatible (see [save-files.md](save-files.md)).

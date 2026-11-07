# Save files

In training mode, the pause menu can download a checkpoint
(`neat-birds-state.json`) and load one back. Autoplay mode loads the same
file but uses only its champion brain. The code is in `src/state/index.ts`.

Separately, the latest champion brain is kept in `localStorage` under
`champion` as `{ version, brain, color }`, so autoplay works without a file
(see [architecture.md](architecture.md#champion-and-autoplay)). Loading a
file also updates it.

## Format (version 1)

```jsonc
{
  "version": 1,
  "score": 0,
  "generation": 12,
  "bestDistance": 4821,
  "distanceHistory": [/* best distance per generation, last 60 */],
  "trainingSpeed": 4, // 0 means MAX (turbo)
  "backgroundIndex": 1,
  "bestBirdBrain": { "nodes": [/* … */], "connections": [/* … */] },
  "bestBirdColor": "blue",
  "species": [/* serialized species */],
  "liveBirds": [/* serialized birds */],
  "deadBirds": [/* serialized birds */],
  "pipes": [/* serialized pipes */]
}
```

A serialized bird has `x`, `y`, `dy`, `color`, `wing`, `distance`, `fitness`
and `brain`. The few-tick wing-flap counter is left out; the wing settles on
the next tick. A serialized pipe is one upper/lower pair with `x`, `gapY`
(top edge of the gap), `colorIndex`, `passed` and `active`. A serialized
species has `id`, `color`, `representative` (a genome), `bestFitness` and
`staleGenerations`; its members are not stored, because loading sorts every
bird back into the species with `speciate()`.

The file captures the whole live simulation, so training resumes from the
exact saved frame. Loading deliberately skips `resetState()` for this reason.

## Loading rules

- **Training** (`loadStateForTraining`) requires `version === 1`, the
  `species`, `liveBirds`, `deadBirds` and `pipes` arrays, and at least one
  bird.
- **Autoplay** (`loadBrainForAutoplay`) requires `version === 1` and a
  `bestBirdBrain`.
- Training loads call `syncGenomeCounters()` and `syncSpeciesIds()`, and
  autoplay loads call `syncGenomeCounters()`, so new mutations and species
  get fresh ids (see [neat.md](neat.md#innovation-registry)).
- Colors from the file go through `sanitizeColor()`; unknown values become
  `null` (or green for a species).

## Changing the format

`SAVE_FILE_VERSION` gates both loaders and the stored champion, and there is
no migration path. Bump it whenever the serialized shape or the genome's
meaning changes, for example new fields or a different number of network
inputs. Files with any other version are rejected with a message, and a
stored champion with any other version is ignored.

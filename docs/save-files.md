# Save files

In training mode, the pause menu can download a checkpoint
(`neat-birds-state.json`) and load one back. Autoplay mode loads the same
file but uses only its champion brain. The code is in `src/state/index.ts`.

## Format (version 3)

```jsonc
{
  "version": 3,
  "score": 0,
  "generation": 12,
  "bestDistance": 4821,
  "speciesCount": 4,
  "distanceHistory": [/* best distance per generation, last 60 */],
  "trainingSpeed": 4,
  "backgroundIndex": 1,
  "bestBirdBrain": { "nodes": [/* … */], "connections": [/* … */] },
  "bestBirdColor": "blue",
  "liveBirds": [/* serialized birds */],
  "deadBirds": [/* serialized birds */],
  "pipes": [/* serialized pipes */]
}
```

A serialized bird has `x`, `y`, `dy`, `color`, `wing`, `distance`, `fitness`
and `brain`. The wing-flap timer is left out because a stale timer handle
would be meaningless after a reload. A serialized pipe has `type`, `x`, `y`,
`colorIndex` and `active`.

The file captures the whole live simulation, so training resumes from the
exact saved frame. Loading deliberately skips `resetState()` for this reason.

## Loading rules

- **Training** (`loadStateForTraining`) requires `version === 3`, the three
  simulation arrays, and at least one bird.
- **Autoplay** (`loadBrainForAutoplay`) requires `version === 3` and a
  `bestBirdBrain`.
- Both call `syncGenomeCounters()` so new mutations get fresh innovation ids
  (see [neat.md](neat.md#innovation-registry)).
- Colors from the file go through `sanitizeColor()`; unknown values become
  `null`.

## Changing the format

`SAVE_FILE_VERSION` gates both loaders, and there is no migration path.
Bump it whenever the serialized shape or the genome's meaning changes, for
example new fields or a different number of network inputs. Files with any
other version are rejected with an alert.

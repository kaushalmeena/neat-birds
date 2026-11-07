# Save files

In training mode, the pause menu can download a checkpoint
(`neat-birds-state.json`) and load one back. Autoplay mode loads the same
file but uses only its champion brain. The code is in `src/state/index.ts`.

## Format (version 4)

```jsonc
{
  "version": 4,
  "score": 0,
  "generation": 12,
  "bestDistance": 4821,
  "speciesCount": 4,
  "distanceHistory": [/* best distance per generation, last 60 */],
  "trainingSpeed": 4, // 0 means MAX (turbo)
  "backgroundIndex": 1,
  "bestBirdBrain": { "nodes": [/* … */], "connections": [/* … */] },
  "bestBirdColor": "blue",
  "liveBirds": [/* serialized birds */],
  "deadBirds": [/* serialized birds */],
  "pipes": [/* serialized pipes */]
}
```

A serialized bird has `x`, `y`, `dy`, `color`, `wing`, `distance`, `fitness`
and `brain`. The few-tick wing-flap counter is left out; the wing settles on
the next tick. A serialized pipe is one upper/lower pair with `x`, `gapY`
(top edge of the gap), `colorIndex`, `passed` and `active`.

Version 4 replaced single pipes with gap pairs and changed the network's
inputs (velocity replaced the redundant bottom-distance input), so version 3
brains would play wrongly and are rejected.

The file captures the whole live simulation, so training resumes from the
exact saved frame. Loading deliberately skips `resetState()` for this reason.

## Loading rules

- **Training** (`loadStateForTraining`) requires `version === 4`, the three
  simulation arrays, and at least one bird.
- **Autoplay** (`loadBrainForAutoplay`) requires `version === 4` and a
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

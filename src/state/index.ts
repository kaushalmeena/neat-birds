import { Mode, Screen } from "../constants/app";
import { BirdColor } from "../constants/bird";
import type { Bird, GameState, Pipe } from "../types";
import { createBird, resetBird } from "../utils/bird";
import { createPopulation } from "../utils/ga";
import { getRandomInteger } from "../utils/helper";
import { syncGenomeCounters } from "../utils/neat";
import { createPipes, makePipeInactive } from "../utils/pipe";
import { backgroundImages } from "../utils/sprites";

// Version stamp for exported checkpoint files. A checkpoint captures the
// entire live simulation - every bird (position, velocity, alive/dead,
// fitness) and pipe - so training resumes from the exact same moment, plus
// the champion genome so autoplay can replay the best bird from the file.
const SAVE_FILE_VERSION = 3;

const VALID_COLORS: BirdColor[] = Object.values(BirdColor);
const sanitizeColor = (color: unknown): BirdColor | null =>
  VALID_COLORS.includes(color as BirdColor) ? (color as BirdColor) : null;

// Only the fields that define a bird's state; the transient wing-flap timer
// is intentionally left out (it would be a stale handle after reload).
function serializeBird(bird: Bird) {
  return {
    x: bird.x,
    y: bird.y,
    dy: bird.dy,
    color: bird.color,
    wing: bird.wing,
    distance: bird.distance,
    fitness: bird.fitness,
    brain: bird.brain
  };
}

// Rebuilds a bird from serialized data. createBird deep-copies the brain and
// zeroes distance/fitness, so those are restored explicitly afterwards.
function reviveBird(data: ReturnType<typeof serializeBird>): Bird {
  const bird = createBird({
    x: data.x,
    y: data.y,
    dy: data.dy,
    color: data.color,
    wing: data.wing,
    brain: data.brain
  });
  bird.distance = data.distance ?? 0;
  bird.fitness = data.fitness ?? 0;
  return bird;
}

function serializePipe(pipe: Pipe) {
  return {
    type: pipe.type,
    x: pipe.x,
    y: pipe.y,
    colorIndex: pipe.colorIndex,
    active: pipe.active
  };
}

function revivePipe(data: ReturnType<typeof serializePipe>): Pipe {
  return {
    type: data.type,
    x: data.x,
    y: data.y,
    colorIndex: data.colorIndex ?? 0,
    active: Boolean(data.active)
  };
}

// Saves data as a JSON file via an anchor download. The browser owns the
// rest of the flow, and there's no reliable, broadly-supported way to know
// whether the user actually kept the file, so callers don't claim success.
// The object URL is revoked on a later tick (not immediately) so the
// download is handed off before the blob is released - revoking
// synchronously can abort the save in some browsers.
function saveJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Opens a file picker and resolves the parsed JSON (or null on cancel/error).
// The result is untyped external data, so `any` is the honest type here.
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
function pickJsonFile(): Promise<any> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(await file.text()));
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

export function getBestScore(): number {
  return Number(localStorage.getItem("bestScore")) || 0;
}

export const state: { current: GameState } = {
  current: {
    score: 0,
    generation: 1,
    bestScore: getBestScore(),
    bestDistance: 0,
    // The champion genome seen so far in training; playable in autoplay
    // mode, along with the color the champion bird wore
    bestBirdBrain: null,
    bestBirdColor: null,
    // Best distance per generation, for the training fitness chart
    distanceHistory: [],
    speciesCount: 1,
    // Simulation steps per frame in training mode (fast-forward)
    trainingSpeed: 1,
    mode: Mode.STANDARD,
    activeScreen: Screen.TITLE,
    // Which backdrop is in use; re-rolled when a game starts
    backgroundIndex: getRandomInteger(0, backgroundImages.length - 1),
    playerBird: createBird(),
    liveBirds: createPopulation(),
    deadBirds: [],
    pipes: createPipes()
  }
};

export function setBestScore(score: number): void {
  state.current.bestScore = score;
  localStorage.setItem("bestScore", String(score));
}

export function resetState(): void {
  state.current.score = 0;
  resetBird(state.current.playerBird);
  // Reset any birds still alive (e.g. when quitting training mid-generation)
  state.current.liveBirds.forEach(resetBird);
  state.current.pipes.forEach(makePipeInactive);
}

// Downloads the full training state: every genome in the current population
// (so the run can be resumed) plus the champion (so autoplay can replay it).
export function saveStateToFile(): void {
  const population = [...state.current.liveBirds, ...state.current.deadBirds];
  if (population.length === 0) {
    alert("Nothing to save yet - start training first!");
    return;
  }
  // Prefer the recorded champion; otherwise fall back to the farthest bird
  // in the current population so the file always carries a playable brain
  let bestBirdBrain = state.current.bestBirdBrain;
  let bestBirdColor = state.current.bestBirdColor;
  if (!bestBirdBrain) {
    const champion = population.reduce((a, b) =>
      b.distance > a.distance ? b : a
    );
    bestBirdBrain = champion.brain;
    bestBirdColor = champion.color;
  }
  saveJsonFile("neat-birds-state.json", {
    version: SAVE_FILE_VERSION,
    score: state.current.score,
    generation: state.current.generation,
    bestDistance: state.current.bestDistance,
    speciesCount: state.current.speciesCount,
    distanceHistory: state.current.distanceHistory,
    trainingSpeed: state.current.trainingSpeed,
    backgroundIndex: state.current.backgroundIndex,
    bestBirdBrain,
    bestBirdColor,
    // Full live simulation so a run resumes from the exact same moment
    liveBirds: state.current.liveBirds.map(serializeBird),
    deadBirds: state.current.deadBirds.map(serializeBird),
    pipes: state.current.pipes.map(serializePipe)
  });
}

// A full training checkpoint has the live simulation arrays
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
function isTrainingCheckpoint(payload: any): boolean {
  return (
    payload &&
    payload.version === SAVE_FILE_VERSION &&
    Array.isArray(payload.liveBirds) &&
    Array.isArray(payload.deadBirds) &&
    Array.isArray(payload.pipes) &&
    payload.liveBirds.length + payload.deadBirds.length > 0
  );
}

// Restores the entire simulation from a checkpoint so training continues
// from the exact saved moment. Calls onLoaded on success.
export async function loadStateForTraining(
  onLoaded?: () => void
): Promise<void> {
  const payload = await pickJsonFile();
  if (payload === null) {
    return;
  }
  if (!isTrainingCheckpoint(payload)) {
    alert("That file is not a valid training state!");
    return;
  }
  state.current.score = payload.score ?? 0;
  state.current.generation = payload.generation ?? 1;
  state.current.bestDistance = payload.bestDistance ?? 0;
  state.current.speciesCount = payload.speciesCount ?? 1;
  state.current.distanceHistory = Array.isArray(payload.distanceHistory)
    ? payload.distanceHistory
    : [];
  if (typeof payload.trainingSpeed === "number") {
    state.current.trainingSpeed = payload.trainingSpeed;
  }
  if (typeof payload.backgroundIndex === "number") {
    state.current.backgroundIndex = payload.backgroundIndex;
  }
  state.current.bestBirdBrain = payload.bestBirdBrain ?? null;
  state.current.bestBirdColor = sanitizeColor(payload.bestBirdColor);
  state.current.liveBirds = payload.liveBirds.map(reviveBird);
  state.current.deadBirds = payload.deadBirds.map(reviveBird);
  state.current.pipes = payload.pipes.map(revivePipe);
  // Keep NEAT counters ahead of every loaded genome
  syncGenomeCounters(
    [...state.current.liveBirds, ...state.current.deadBirds].map(
      (bird) => bird.brain
    )
  );
  // Note: no resetState() - the whole point is to resume exactly as saved
  onLoaded?.();
}

// Loads only the champion brain from a checkpoint, for autoplay.
// Calls onLoaded on success (autoplay starts playing right away).
export async function loadBrainForAutoplay(
  onLoaded?: () => void
): Promise<void> {
  const payload = await pickJsonFile();
  if (payload === null) {
    return;
  }
  if (
    !payload ||
    payload.version !== SAVE_FILE_VERSION ||
    !payload.bestBirdBrain
  ) {
    alert("That file has no playable brain!");
    return;
  }
  state.current.bestBirdBrain = payload.bestBirdBrain;
  state.current.bestBirdColor = sanitizeColor(payload.bestBirdColor);
  state.current.bestDistance = Math.max(
    state.current.bestDistance,
    payload.bestDistance ?? 0
  );
  syncGenomeCounters([payload.bestBirdBrain]);
  onLoaded?.();
}

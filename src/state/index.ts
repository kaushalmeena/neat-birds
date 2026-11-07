import { Mode, Screen } from "../constants/app";
import { BirdColor } from "../constants/bird";
import type { Bird, GameState, Pipe, Species } from "../types";
import { createBird, resetBird } from "../utils/bird";
import { createPopulation, speciate, syncSpeciesIds } from "../utils/ga";
import { getRandomInteger } from "../utils/helper";
import type { Genome } from "../utils/neat";
import { syncGenomeCounters } from "../utils/neat";
import { createPipes, makePipeInactive } from "../utils/pipe";
import { backgroundImages } from "../utils/sprites";
import { showToast } from "../utils/toast";

// Version stamp for exported checkpoint files. A checkpoint captures the
// entire live simulation - every bird (position, velocity, alive/dead,
// fitness) and pipe - so training resumes from the exact same moment, plus
// the champion genome so autoplay can replay the best bird from the file.
// Only files with exactly this version load; there is no migration.
const SAVE_FILE_VERSION = 1;

const VALID_COLORS: BirdColor[] = Object.values(BirdColor);
const sanitizeColor = (color: unknown): BirdColor | null =>
  VALID_COLORS.includes(color as BirdColor) ? (color as BirdColor) : null;

// Only the fields that define a bird's state; the few-tick wing-flap
// animation counter is left out (the wing just settles on the next tick).
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

// A species without its members; birds are re-sorted into species on load
function serializeSpecies(species: Species) {
  return {
    id: species.id,
    color: species.color,
    representative: species.representative,
    bestFitness: species.bestFitness,
    staleGenerations: species.staleGenerations
  };
}

function reviveSpecies(data: ReturnType<typeof serializeSpecies>): Species {
  return {
    id: data.id,
    color: sanitizeColor(data.color) ?? BirdColor.GREEN,
    representative: data.representative,
    members: [],
    bestFitness: data.bestFitness ?? 0,
    staleGenerations: data.staleGenerations ?? 0
  };
}

function serializePipe(pipe: Pipe) {
  return {
    x: pipe.x,
    gapY: pipe.gapY,
    colorIndex: pipe.colorIndex,
    passed: pipe.passed,
    active: pipe.active
  };
}

function revivePipe(data: ReturnType<typeof serializePipe>): Pipe {
  return {
    x: data.x,
    gapY: data.gapY,
    colorIndex: data.colorIndex ?? 0,
    passed: Boolean(data.passed),
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

// The latest champion is remembered in localStorage, so autoplay can fly
// your best trained bird without a file, even after a reload
const CHAMPION_KEY = "champion";

interface StoredChampion {
  brain: Genome;
  color: BirdColor | null;
}

// A stored brain is trusted only if it has the current save version and
// the basic genome shape
function readStoredChampion(): StoredChampion | null {
  try {
    const data = JSON.parse(localStorage.getItem(CHAMPION_KEY) ?? "null");
    if (
      data?.version === SAVE_FILE_VERSION &&
      Array.isArray(data.brain?.nodes) &&
      Array.isArray(data.brain?.connections)
    ) {
      return { brain: data.brain, color: sanitizeColor(data.color) };
    }
  } catch {
    // Unreadable storage just means there is no remembered champion
  }
  return null;
}

const storedChampion = readStoredChampion();
if (storedChampion) {
  syncGenomeCounters([storedChampion.brain]);
}

const population = createPopulation();

export const state: { current: GameState } = {
  current: {
    score: 0,
    generation: 1,
    bestScore: getBestScore(),
    bestDistance: 0,
    // The champion genome seen so far in training; playable in autoplay
    // mode, along with the color the champion bird wore
    bestBirdBrain: storedChampion?.brain ?? null,
    bestBirdColor: storedChampion?.color ?? null,
    // Best distance per generation, for the training fitness chart
    distanceHistory: [],
    // Persistent species of the training population
    species: population.species,
    // Simulation steps per frame in training mode (fast-forward)
    trainingSpeed: 1,
    mode: Mode.STANDARD,
    activeScreen: Screen.TITLE,
    // Which backdrop is in use; re-rolled when a game starts
    backgroundIndex: getRandomInteger(0, backgroundImages.length - 1),
    playerBird: createBird(),
    liveBirds: population.birds,
    deadBirds: [],
    pipes: createPipes()
  }
};

export function setBestScore(score: number): void {
  state.current.bestScore = score;
  localStorage.setItem("bestScore", String(score));
}

// Records a new champion and remembers it for later sessions
export function setChampion(brain: Genome, color: BirdColor | null): void {
  state.current.bestBirdBrain = brain;
  state.current.bestBirdColor = color;
  try {
    localStorage.setItem(
      CHAMPION_KEY,
      JSON.stringify({ version: SAVE_FILE_VERSION, brain, color })
    );
  } catch {
    // Storage may be full or blocked; the champion still lives in memory
  }
}

export function resetState(): void {
  state.current.score = 0;
  resetBird(state.current.playerBird);
  // Leaving training mid-generation restarts that generation: birds that
  // already died rejoin the flock, and everyone goes back to the start
  state.current.liveBirds.push(...state.current.deadBirds);
  state.current.deadBirds = [];
  state.current.liveBirds.forEach(resetBird);
  state.current.pipes.forEach(makePipeInactive);
}

// Downloads the full training state: every genome in the current population
// (so the run can be resumed) plus the champion (so autoplay can replay it).
export function saveStateToFile(): void {
  const population = [...state.current.liveBirds, ...state.current.deadBirds];
  if (population.length === 0) {
    showToast("Nothing to save yet");
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
    species: state.current.species.map(serializeSpecies),
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
  showToast("State file saved");
}

// A full training checkpoint has the live simulation arrays
// oxlint-disable-next-line @typescript-eslint/no-explicit-any
function isTrainingCheckpoint(payload: any): boolean {
  return (
    payload &&
    payload.version === SAVE_FILE_VERSION &&
    Array.isArray(payload.species) &&
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
    showToast("Not a valid training state file");
    return;
  }
  state.current.score = payload.score ?? 0;
  state.current.generation = payload.generation ?? 1;
  state.current.bestDistance = payload.bestDistance ?? 0;
  state.current.distanceHistory = Array.isArray(payload.distanceHistory)
    ? payload.distanceHistory
    : [];
  if (typeof payload.trainingSpeed === "number") {
    state.current.trainingSpeed = payload.trainingSpeed;
  }
  if (typeof payload.backgroundIndex === "number") {
    state.current.backgroundIndex = payload.backgroundIndex;
  }
  if (payload.bestBirdBrain) {
    setChampion(payload.bestBirdBrain, sanitizeColor(payload.bestBirdColor));
  }
  state.current.liveBirds = payload.liveBirds.map(reviveBird);
  state.current.deadBirds = payload.deadBirds.map(reviveBird);
  state.current.pipes = payload.pipes.map(revivePipe);
  // Re-sort the birds into the saved species
  const species: Species[] = payload.species.map(reviveSpecies);
  syncSpeciesIds(species);
  state.current.species = speciate(
    [...state.current.liveBirds, ...state.current.deadBirds],
    species
  );
  // Keep NEAT counters ahead of every loaded genome
  syncGenomeCounters([
    ...[...state.current.liveBirds, ...state.current.deadBirds].map(
      (bird) => bird.brain
    ),
    ...state.current.species.map((s) => s.representative)
  ]);
  // Note: no resetState() - the whole point is to resume exactly as saved
  showToast(`Resumed at generation ${state.current.generation}`);
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
    showToast("That file has no playable brain");
    return;
  }
  setChampion(payload.bestBirdBrain, sanitizeColor(payload.bestBirdColor));
  state.current.bestDistance = Math.max(
    state.current.bestDistance,
    payload.bestDistance ?? 0
  );
  syncGenomeCounters([payload.bestBirdBrain]);
  showToast("Brain loaded");
  onLoaded?.();
}

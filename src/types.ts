import type { Action, Mode, Screen } from "./constants/app";
import type { BirdColor, Wing } from "./constants/bird";
import type { Genome } from "./utils/neat";

// A source region of the spritesheet (or a standalone image)
export interface Sprite {
  image: HTMLImageElement;
  sx: number;
  sy: number;
  sWidth: number;
  sHeight: number;
}

export interface Bird {
  color: BirdColor;
  wing: Wing;
  x: number;
  y: number;
  dy: number;
  brain: Genome;
  // How many frames the bird has been alive (its raw fitness signal)
  distance: number;
  fitness: number;
  // Simulation ticks left before the wing flips back down after a flap
  wingTicks: number;
}

// An upper and a lower pipe with a gap between them
// A niche of similar genomes that persists across generations
export interface Species {
  id: number;
  // Every member wears this color, so lineages are visible in training
  color: BirdColor;
  // New birds join the species if they are compatible with this genome
  representative: Genome;
  // Birds of the current generation in this species
  members: Bird[];
  // Highest member fitness the species has ever reached
  bestFitness: number;
  // Generations since bestFitness last improved
  staleGenerations: number;
}

export interface Pipe {
  x: number;
  // y of the gap's top edge; the gap's bottom edge is gapY + PIPE_GAP
  gapY: number;
  colorIndex: number;
  // Whether the pair has been counted towards the score
  passed: boolean;
  active: boolean;
}

// A clickable text label: drawn and hit-tested from the same data
export interface MenuItem {
  label: string;
  action: Action;
  x: number;
  y: number;
  // Font size of the label (also its height)
  size: number;
  width: number;
  height: number;
}

export interface GameState {
  score: number;
  generation: number;
  bestScore: number;
  bestDistance: number;
  bestBirdBrain: Genome | null;
  bestBirdColor: BirdColor | null;
  distanceHistory: number[];
  species: Species[];
  trainingSpeed: number;
  mode: Mode;
  activeScreen: Screen;
  backgroundIndex: number;
  playerBird: Bird;
  liveBirds: Bird[];
  deadBirds: Bird[];
  pipes: Pipe[];
}

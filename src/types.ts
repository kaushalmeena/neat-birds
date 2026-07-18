import type { Action, Mode, Screen } from "./constants/app";
import type { BirdColor, Wing } from "./constants/bird";
import type { PipeType } from "./constants/pipe";
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
  // Pending timer that flips the wing back down after a flap
  wingTimeout?: number;
}

export interface Pipe {
  type: PipeType;
  x: number;
  y: number;
  colorIndex: number;
  active: boolean;
}

export interface PauseMenuItem {
  label: string;
  action: Action;
  x: number;
  y: number;
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
  speciesCount: number;
  trainingSpeed: number;
  mode: Mode;
  activeScreen: Screen;
  backgroundIndex: number;
  playerBird: Bird;
  liveBirds: Bird[];
  deadBirds: Bird[];
  pipes: Pipe[];
}

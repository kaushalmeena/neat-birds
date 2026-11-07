export const BIRD_CREATE_LIMIT = 500;

// Bird sprites are 16x16, drawn at 2x
export const BIRD_WIDTH = 32;
export const BIRD_HEIGHT = 32;

// How much smaller the collision box is than the sprite, on each side
export const BIRD_HITBOX_INSET = 4;

export const BIRD_START_X = 50;
export const BIRD_START_Y = 50;
// Training birds start at a random height up to this far below
// BIRD_START_Y, so the flock is visible as a flock from the first frame
export const BIRD_SPAWN_SPREAD = 80;

export const BIRD_FALL_SPEED = 0.25;

// Terminal velocity, so falls stay controllable (and dy has a known range
// for the network input)
export const BIRD_MAX_FALL_SPEED = 8;

export const BIRD_FLAP_LIFT = -5;
// Ticks the wing stays up after a flap (about 80ms)
export const BIRD_FLAP_TICKS = 5;

export enum BirdColor {
  ORANGE = "orange",
  BLUE = "blue",
  RED = "red",
  GREEN = "green",
  BROWN = "brown",
  GRAY = "gray",
  PURPLE = "purple"
}

export enum Wing {
  UP = "up",
  DOWN = "down"
}

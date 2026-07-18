import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./app";

export const PIPE_ACTIVE_LIMIT = 4;
export const PIPE_CREATE_LIMIT = 6;

export const PIPE_WIDTH = 32;
export const PIPE_HEIGHT = 272;

export const PIPE_MIN_GAP = 100;

export const PIPE_MIN_DISTANCE = 200;
export const PIPE_MAX_DISTANCE = 400;

export const PIPE_MIN_X_POS = 10;
export const PIPE_MAX_X_POS = CANVAS_WIDTH - 10;

export const LOWER_PIPE_MIN_Y_POS = CANVAS_HEIGHT - PIPE_HEIGHT + PIPE_MIN_GAP;
export const LOWER_PIPE_MAX_Y_POS = CANVAS_HEIGHT - PIPE_HEIGHT;
export const UPPER_PIPE_MIN_Y_POS = -PIPE_MIN_GAP;
export const UPPER_PIPE_MAX_Y_POS = 0;

export const PIPE_SPEED = 2;

// Difficulty ramp (standard mode only): extra speed per point of score,
// capped so the game stays beatable
export const PIPE_SPEED_RAMP = 0.05;
export const PIPE_MAX_SPEED = 4;

export enum PipeType {
  UPPER = "upper",
  LOWER = "lower"
}

// Number of pipe color variants in the spritesheet
export const PIPE_COLOR_COUNT = 8;

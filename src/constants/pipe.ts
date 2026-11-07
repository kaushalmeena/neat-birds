import { CANVAS_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT } from "./app";

export const PIPE_ACTIVE_LIMIT = 4;
export const PIPE_CREATE_LIMIT = 6;

export const PIPE_WIDTH = 32;
export const PIPE_HEIGHT = 272;

// Each obstacle is an upper and a lower pipe with a gap between them
export const PIPE_GAP = 110;
// Smallest space kept between the gap and the top of the screen or the
// ground, so the gap is never flush against an edge
export const PIPE_GAP_MARGIN = 40;
// Height of the area birds fly in (everything above the ground)
export const PLAYFIELD_HEIGHT = CANVAS_HEIGHT - GROUND_HEIGHT;
// Range for the y of the gap's top edge. PIPE_HEIGHT (272) is tall enough
// that both pipes reach the screen edge across this whole range.
export const PIPE_GAP_MIN_Y = PIPE_GAP_MARGIN;
export const PIPE_GAP_MAX_Y = PLAYFIELD_HEIGHT - PIPE_GAP_MARGIN - PIPE_GAP;
// Largest vertical jump between consecutive gaps, so the next gap is
// always reachable even at top standard-mode speed
export const PIPE_MAX_GAP_SHIFT = 120;

// Horizontal space between consecutive pipes
export const PIPE_MIN_DISTANCE = 180;
export const PIPE_MAX_DISTANCE = 260;

// Pipes are recycled once they have scrolled this far off the left edge
export const PIPE_EXIT_X = -PIPE_WIDTH;
// The first pipe of a run enters from just beyond the right edge
export const PIPE_SPAWN_X = CANVAS_WIDTH;

export const PIPE_SPEED = 2;

// Difficulty ramp (standard mode only): extra speed per point of score,
// capped so the game stays beatable
export const PIPE_SPEED_RAMP = 0.05;
export const PIPE_MAX_SPEED = 4;

// Number of pipe color variants in the spritesheet
export const PIPE_COLOR_COUNT = 8;

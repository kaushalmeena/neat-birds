// The simulation advances in fixed ticks of this length, independent of the
// display's refresh rate; all per-tick physics constants assume it
export const TICK_MS = 1000 / 60;
// Most time a single frame may catch up on (e.g. after a stall), so the game
// never fast-forwards in a burst
export const MAX_FRAME_CATCHUP_MS = 100;

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 400;

// Ground tile is 16x16, drawn at 2x
export const GROUND_HEIGHT = 32;

// Strength of the white wash over the backdrop (0 = off, 1 = solid),
// so the foreground pipes and birds stand out against it
export const BACKGROUND_FADE_OPACITY = 0.4;

export enum Mode {
  STANDARD = "standard",
  TRAINING = "training",
  // An uploaded brain file plays by itself
  AUTOPLAY = "autoplay"
}

export enum Screen {
  TITLE = "title",
  MAIN = "main",
  DEATH = "death",
  PAUSE = "pause"
}

export enum Action {
  START_GAME = "start_game",
  RESTART_GAME = "restart_game",
  PAUSE_GAME = "pause_game",
  RESUME_GAME = "resume_game",
  QUIT_GAME = "quit_game",
  LOAD_STATE = "load_state",
  SAVE_STATE = "save_state",
  TOGGLE_MODE = "toggle_mode",
  FLAP_WING = "flap_wing",
  CYCLE_SPEED = "cycle_speed"
}

// Training speed value meaning "turbo": instead of a fixed multiplier, run as
// many ticks as fit in TURBO_BUDGET_MS each frame
export const TURBO_SPEED = 0;
export const TURBO_BUDGET_MS = 12;

// Training speed multipliers (ticks per real-time tick), cycled by the
// speed button
export const TRAINING_SPEEDS = [1, 2, 4, 8, TURBO_SPEED];

// A training generation ends once it passes this many pipes, so a bird
// that never dies can't stall evolution forever
export const TRAINING_MAX_SCORE = 50;

export const FRAME_DELAY = 10;

export const CANVAS_WIDTH = 500;
export const CANVAS_HEIGHT = 400;

// Ground tile is 16x16, drawn at 2x
export const GROUND_HEIGHT = 32;

// Strength of the white wash over the backdrop (0 = off, 1 = solid),
// so the foreground pipes and birds stand out against it
export const BACKGROUND_FADE_OPACITY = 0.4;

export const EXIT_X_POS = -80;

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

// Simulation steps per rendered frame, cycled by the training speed button.
// Higher values fast-forward evolution since rendering is the bottleneck.
export const TRAINING_SPEEDS = [1, 2, 4, 8];

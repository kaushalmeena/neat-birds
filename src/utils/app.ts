import { Action, Mode, Screen, TRAINING_SPEEDS } from "../constants/app";
import { BirdColor } from "../constants/bird";
import {
  loadBrainForAutoplay,
  loadStateForTraining,
  resetState,
  saveStateToFile,
  state
} from "../state";
import { flap } from "./bird";
import { createCopy, getRandomInteger, getRandomItem } from "./helper";
import { playFlapSound } from "./sound";
import { backgroundImages } from "./sprites";
import { showToast } from "./toast";

const MODE_CYCLE: Mode[] = [Mode.STANDARD, Mode.TRAINING, Mode.AUTOPLAY];

// Moves the selected mode by `step` places, wrapping around
function shiftMode(step: number): void {
  const index = MODE_CYCLE.indexOf(state.current.mode);
  state.current.mode =
    MODE_CYCLE[(index + step + MODE_CYCLE.length) % MODE_CYCLE.length];
}

// Pick a fresh backdrop and player bird color for a new run
function randomizeAppearance(): void {
  state.current.backgroundIndex = getRandomInteger(
    0,
    backgroundImages.length - 1
  );
  state.current.playerBird.color = getRandomItem(Object.values(BirdColor));
}

// Enter the main screen; in autoplay mode the player bird gets a copy of
// the champion brain (callers make sure one exists)
function startGame(): void {
  randomizeAppearance();
  if (state.current.mode === Mode.AUTOPLAY && state.current.bestBirdBrain) {
    state.current.playerBird.brain = createCopy(state.current.bestBirdBrain);
    // The autoplay bird wears the color its brain was trained in
    if (state.current.bestBirdColor) {
      state.current.playerBird.color = state.current.bestBirdColor;
    }
  }
  state.current.activeScreen = Screen.MAIN;
}

function restartGame(): void {
  resetState();
  startGame();
}

// Autoplay flies the remembered champion; without one, ask for a file
function startAutoplay(): void {
  if (state.current.bestBirdBrain) {
    startGame();
  } else {
    void loadBrainForAutoplay(startGame);
  }
}

// Leave training to watch its champion fly on its own. The interrupted
// generation restarts when training resumes.
function watchBest(): void {
  if (!state.current.bestBirdBrain) {
    showToast("No champion yet - let a generation finish");
    return;
  }
  state.current.mode = Mode.AUTOPLAY;
  restartGame();
  showToast("Watching your best bird");
}

// Function to perform various game actions based on the provided action type
export function performAction(action: Action): void {
  switch (action) {
    case Action.START_GAME:
      if (state.current.mode === Mode.AUTOPLAY) {
        startAutoplay();
      } else {
        startGame();
      }
      break;
    case Action.RESTART_GAME:
      restartGame();
      break;
    case Action.QUIT_GAME:
      resetState();
      state.current.activeScreen = Screen.TITLE;
      break;
    case Action.PAUSE_GAME:
      state.current.activeScreen = Screen.PAUSE;
      break;
    case Action.RESUME_GAME:
      state.current.activeScreen = Screen.MAIN;
      break;
    case Action.SAVE_STATE:
      saveStateToFile();
      break;
    case Action.LOAD_STATE:
      // Restore the whole population and resume training on the main screen
      void loadStateForTraining(() => {
        state.current.activeScreen = Screen.MAIN;
      });
      break;
    case Action.LOAD_BRAIN:
      // Swap in another brain file and fly it from the start
      void loadBrainForAutoplay(restartGame);
      break;
    case Action.WATCH_BEST:
      watchBest();
      break;
    case Action.NEXT_MODE:
      shiftMode(1);
      break;
    case Action.PREVIOUS_MODE:
      shiftMode(-1);
      break;
    case Action.SELECT_STANDARD:
      state.current.mode = Mode.STANDARD;
      break;
    case Action.SELECT_TRAINING:
      state.current.mode = Mode.TRAINING;
      break;
    case Action.SELECT_AUTOPLAY:
      state.current.mode = Mode.AUTOPLAY;
      break;
    case Action.FLAP_WING:
      // Only the player bird flaps by input; AI birds flap on their own
      if (state.current.mode === Mode.STANDARD) {
        flap(state.current.playerBird);
        playFlapSound();
      }
      break;
    case Action.CYCLE_SPEED: {
      // Step to the next speed multiplier, wrapping back to the slowest
      const next =
        (TRAINING_SPEEDS.indexOf(state.current.trainingSpeed) + 1) %
        TRAINING_SPEEDS.length;
      state.current.trainingSpeed = TRAINING_SPEEDS[next];
      break;
    }
    default:
  }
}

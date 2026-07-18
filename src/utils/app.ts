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

const MODE_CYCLE: Mode[] = [Mode.STANDARD, Mode.TRAINING, Mode.AUTOPLAY];

// Pick a fresh backdrop and player bird color for a new run
function randomizeAppearance(): void {
  state.current.backgroundIndex = getRandomInteger(
    0,
    backgroundImages.length - 1
  );
  state.current.playerBird.color = getRandomItem(Object.values(BirdColor));
}

// Enter the main screen; in autoplay mode the player bird gets a copy
// of the loaded brain (and refuses to start when there is none)
function startGame(): void {
  if (state.current.mode === Mode.AUTOPLAY && !state.current.bestBirdBrain) {
    alert("No brain loaded yet - upload a brain file first!");
    return;
  }
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

// Function to perform various game actions based on the provided action type
export function performAction(action: Action): void {
  switch (action) {
    case Action.START_GAME:
      // Starting autoplay prompts for a saved file and plays its champion;
      // restarts below reuse the brain that is already loaded
      if (state.current.mode === Mode.AUTOPLAY) {
        loadBrainForAutoplay(startGame);
      } else {
        startGame();
      }
      break;
    case Action.RESTART_GAME:
      resetState();
      startGame();
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
      loadStateForTraining(() => {
        state.current.activeScreen = Screen.MAIN;
      });
      break;
    case Action.TOGGLE_MODE:
      state.current.mode =
        MODE_CYCLE[
          (MODE_CYCLE.indexOf(state.current.mode) + 1) % MODE_CYCLE.length
        ];
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

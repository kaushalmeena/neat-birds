import { ACTIONS, MODES, SCREENS } from "../constants/app";
import { BIRD_COLORS } from "../constants/bird";
import {
  loadBrainFromFile,
  resetState,
  saveBrainToFile,
  state
} from "../state";
import { flap } from "./bird";
import { createCopy, getRandomInteger, getRandomItem } from "./helper";
import { playFlapSound } from "./sound";
import { backgroundImages } from "./sprites";

const MODE_CYCLE = [MODES.STANDARD, MODES.TRAINING, MODES.AUTOPLAY];

// Pick a fresh backdrop and player bird color for a new run
function randomizeAppearance() {
  state.current.backgroundIndex = getRandomInteger(
    0,
    backgroundImages.length - 1
  );
  state.current.playerBird.color = getRandomItem(Object.values(BIRD_COLORS));
}

// Enter the main screen; in autoplay mode the player bird gets a copy
// of the loaded brain (and refuses to start when there is none)
function startGame() {
  if (state.current.mode === MODES.AUTOPLAY && !state.current.bestBrain) {
    alert("No brain loaded yet - upload a brain file first!");
    return;
  }
  randomizeAppearance();
  if (state.current.mode === MODES.AUTOPLAY) {
    state.current.playerBird.brain = createCopy(state.current.bestBrain);
    // The autoplay bird wears the color its brain was trained in
    if (state.current.bestBrainColor) {
      state.current.playerBird.color = state.current.bestBrainColor;
    }
  }
  state.current.activeScreen = SCREENS.MAIN;
}

// Function to perform various game actions based on the provided action type
export function performAction(action) {
  switch (action) {
    case ACTIONS.START_GAME:
      // Starting autoplay prompts for a brain file, then plays it;
      // restarts below reuse the brain that is already loaded
      if (state.current.mode === MODES.AUTOPLAY) {
        loadBrainFromFile(startGame);
      } else {
        startGame();
      }
      break;
    case ACTIONS.RESTART_GAME:
      resetState();
      startGame();
      break;
    case ACTIONS.QUIT_GAME:
      resetState();
      state.current.activeScreen = SCREENS.TITLE;
      break;
    case ACTIONS.PAUSE_GAME:
      state.current.activeScreen = SCREENS.PAUSE;
      break;
    case ACTIONS.RESUME_GAME:
      state.current.activeScreen = SCREENS.MAIN;
      break;
    case ACTIONS.SAVE_BRAIN:
      saveBrainToFile();
      break;
    case ACTIONS.LOAD_BRAIN:
      loadBrainFromFile();
      break;
    case ACTIONS.TOGGLE_MODE:
      state.current.mode =
        MODE_CYCLE[
          (MODE_CYCLE.indexOf(state.current.mode) + 1) % MODE_CYCLE.length
        ];
      break;
    case ACTIONS.FLAP_WING:
      // Only the player bird flaps by input; AI birds flap on their own
      if (state.current.mode === MODES.STANDARD) {
        flap(state.current.playerBird);
        playFlapSound();
      }
      break;
    default:
  }
}

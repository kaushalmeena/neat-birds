import { MODES, SCREENS } from "../constants/app";
import { BIRD_COLORS } from "../constants/bird";
import { createBird, resetBird } from "../utils/bird";
import { createPopulation } from "../utils/ga";
import { getRandomInteger } from "../utils/helper";
import { syncGenomeCounters } from "../utils/neat";
import { createPipes, makePipeInactive } from "../utils/pipe";
import { backgroundImages } from "../utils/sprites";

// Version stamp for exported brain files
const BRAIN_FILE_VERSION = 1;

export function getBestScore() {
  return Number(localStorage.getItem("bestScore")) || 0;
}

export const state = {
  current: {
    score: 0,
    generation: 1,
    bestScore: getBestScore(),
    bestDistance: 0,
    // The champion genome seen so far in training; playable in autoplay
    // mode, along with the color the champion bird wore
    bestBrain: null,
    bestBrainColor: null,
    // Best distance per generation, for the training fitness chart
    distanceHistory: [],
    speciesCount: 1,
    mode: MODES.STANDARD,
    activeScreen: SCREENS.TITLE,
    // Which backdrop is in use; re-rolled when a game starts
    backgroundIndex: getRandomInteger(0, backgroundImages.length - 1),
    playerBird: createBird(),
    liveBirds: createPopulation(),
    deadBirds: [],
    pipes: createPipes()
  }
};

export function setBestScore(score) {
  state.current.bestScore = score;
  localStorage.setItem("bestScore", score);
}

export function resetState() {
  state.current.score = 0;
  resetBird(state.current.playerBird);
  // Reset any birds still alive (e.g. when quitting training mid-generation)
  state.current.liveBirds.forEach(resetBird);
  state.current.pipes.forEach(makePipeInactive);
}

// Downloads the champion brain as a JSON file
export function saveBrainToFile() {
  if (!state.current.bestBrain) {
    alert("No trained brain to save yet - run training mode first!");
    return;
  }
  const payload = {
    version: BRAIN_FILE_VERSION,
    bestDistance: state.current.bestDistance,
    color: state.current.bestBrainColor,
    brain: state.current.bestBrain
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "neat-bird-brain.json";
  link.click();
  URL.revokeObjectURL(url);
}

// Opens a file picker and loads a previously exported brain.
// Calls onLoaded after a successful import (used by autoplay mode to
// start playing right away); without it a confirmation alert is shown.
export function loadBrainFromFile(onLoaded) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) {
      return;
    }
    try {
      const payload = JSON.parse(await file.text());
      if (payload.version !== BRAIN_FILE_VERSION || !payload.brain) {
        throw new Error("Invalid brain file");
      }
      state.current.bestBrain = payload.brain;
      // Restore the champion's color when the file provides a valid one
      state.current.bestBrainColor = Object.values(BIRD_COLORS).includes(
        payload.color
      )
        ? payload.color
        : null;
      state.current.bestDistance = Math.max(
        state.current.bestDistance,
        payload.bestDistance ?? 0
      );
      // Keep global NEAT counters ahead of the loaded genome
      syncGenomeCounters([payload.brain]);
      if (onLoaded) {
        onLoaded();
      } else {
        alert("Brain successfully loaded!");
      }
    } catch {
      alert("That file is not a valid brain export!");
    }
  };
  input.click();
}

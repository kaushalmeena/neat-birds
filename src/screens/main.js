import {
  BACKGROUND_FADE_OPACITY,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  EXIT_X_POS,
  GROUND_HEIGHT,
  MODES,
  SCREENS
} from "../constants/app";
import { BIRD_CREATE_LIMIT } from "../constants/bird";
import {
  PIPE_ACTIVE_LIMIT,
  PIPE_MAX_DISTANCE,
  PIPE_MAX_SPEED,
  PIPE_MIN_DISTANCE,
  PIPE_SPEED,
  PIPE_SPEED_RAMP
} from "../constants/pipe";
import { resetState, setBestScore, state } from "../state";
import { drawBird, isBirdDead, think, updateBird } from "../utils/bird";
import { context, drawText } from "../utils/canvas";
import { nextGeneration } from "../utils/ga";
import { createCopy, getRandomInteger } from "../utils/helper";
import { drawPipe, makePipeActive, updatePipe } from "../utils/pipe";
import { playDeathSound, playScoreSound } from "../utils/sound";
import { backgroundImages, groundSprite } from "../utils/sprites";

// How many generations the fitness chart keeps
const CHART_MAX_POINTS = 60;

// Scroll offsets for the ground and background patterns (purely visual)
let groundOffset = 0;
let backgroundOffset = 0;

// The square background image is scaled to the canvas height
const BACKGROUND_TILE_SIZE = CANVAS_HEIGHT;

// Difficulty ramps up with score in standard mode; training keeps a fixed
// speed so every generation is scored against the same environment
function getPipeSpeed() {
  if (state.current.mode !== MODES.STANDARD) {
    return PIPE_SPEED;
  }
  return Math.min(
    PIPE_SPEED + state.current.score * PIPE_SPEED_RAMP,
    PIPE_MAX_SPEED
  );
}

function drawBackground(speed) {
  const backgroundImage =
    backgroundImages[state.current.backgroundIndex % backgroundImages.length];
  // Repeat the backdrop, scrolling at quarter speed for parallax depth
  backgroundOffset = (backgroundOffset + speed * 0.25) % BACKGROUND_TILE_SIZE;
  for (let x = -backgroundOffset; x < CANVAS_WIDTH; x += BACKGROUND_TILE_SIZE) {
    context.drawImage(
      backgroundImage,
      x,
      0,
      BACKGROUND_TILE_SIZE,
      BACKGROUND_TILE_SIZE
    );
  }
  // Wash the backdrop out so it doesn't compete with the pipe colors
  context.fillStyle = `rgba(255, 255, 255, ${BACKGROUND_FADE_OPACITY})`;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawPipes(speed) {
  let activeCount = 0;
  let farthestPosX = 0;
  for (let i = 0; i < state.current.pipes.length; i += 1) {
    const pipe = state.current.pipes[i];
    // Only active pipes are drawn and moved
    if (pipe.active) {
      activeCount += 1;
      // Track the farthest pipe so a new one can spawn behind it
      farthestPosX = Math.max(farthestPosX, pipe.x);
      drawPipe(pipe);
      updatePipe(pipe, speed);
      // Mark pipe inactive once it has scrolled off screen and count it as passed
      if (pipe.x < EXIT_X_POS) {
        pipe.active = false;
        state.current.score += 1;
        // Chime in standard and AI mode; training would be a wall of noise
        if (state.current.mode !== MODES.TRAINING) {
          playScoreSound();
        }
      }
    }
  }
  if (activeCount < PIPE_ACTIVE_LIMIT) {
    // Check if any inactive pipe available
    const pipeIndex = state.current.pipes.findIndex((pipe) => !pipe.active);
    if (pipeIndex > -1) {
      const newPosX =
        farthestPosX + getRandomInteger(PIPE_MIN_DISTANCE, PIPE_MAX_DISTANCE);
      makePipeActive(state.current.pipes[pipeIndex], newPosX);
    }
  }
}

function drawGround(speed) {
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
  // Repeat the ground block tile across the bottom, scrolled with the
  // pipes so the ground appears to move
  groundOffset = (groundOffset + speed) % GROUND_HEIGHT;
  for (let x = -groundOffset; x < CANVAS_WIDTH; x += GROUND_HEIGHT) {
    context.drawImage(
      groundSprite.image,
      groundSprite.sx,
      groundSprite.sy,
      groundSprite.sWidth,
      groundSprite.sHeight,
      x,
      groundY,
      GROUND_HEIGHT,
      GROUND_HEIGHT
    );
  }
}

function drawPlayerBird() {
  drawBird(state.current.playerBird);
  updateBird(state.current.playerBird);
  // If player bird has died then navigate to death screen
  if (isBirdDead(state.current.playerBird, state.current.pipes)) {
    state.current.activeScreen = SCREENS.DEATH;
    playDeathSound();
    // If high-score is achieved then save the score
    if (state.current.score > state.current.bestScore) {
      setBestScore(state.current.score);
    }
  }
}

function drawBirds() {
  // Iterate backwards so removing a dead bird doesn't skip the next one
  for (let i = state.current.liveBirds.length - 1; i >= 0; i -= 1) {
    const bird = state.current.liveBirds[i];
    drawBird(bird);
    updateBird(bird);
    think(bird, state.current.pipes);

    // If bird has died then move it from liveBirds to deadBirds
    if (isBirdDead(bird, state.current.pipes)) {
      state.current.deadBirds.push(...state.current.liveBirds.splice(i, 1));
    }
  }

  // When all birds are dead breed the next generation from the dead ones
  if (state.current.liveBirds.length === 0) {
    const generationBest = Math.max(
      ...state.current.deadBirds.map((bird) => bird.distance)
    );
    state.current.generation += 1;
    // Keep a copy of the champion brain (and its color) whenever the
    // record improves, so it can be exported and played back in
    // autoplay mode
    if (generationBest > state.current.bestDistance) {
      const champion = state.current.deadBirds.reduce((a, b) =>
        b.distance > a.distance ? b : a
      );
      state.current.bestBrain = createCopy(champion.brain);
      state.current.bestBrainColor = champion.color;
    }
    state.current.bestDistance = Math.max(
      generationBest,
      state.current.bestDistance
    );
    // Record this generation's best distance for the fitness chart
    state.current.distanceHistory.push(generationBest);
    if (state.current.distanceHistory.length > CHART_MAX_POINTS) {
      state.current.distanceHistory.shift();
    }
    const { birds, speciesCount } = nextGeneration(state.current.deadBirds);
    state.current.liveBirds = birds;
    state.current.speciesCount = speciesCount;
    state.current.deadBirds = [];
    resetState();
  }
}

// The autoplay bird: thinks with the uploaded brain
function drawAutoplayBird() {
  const bird = state.current.playerBird;
  drawBird(bird);
  updateBird(bird);
  think(bird, state.current.pipes);
  // Autoplay runs don't count towards the player's best score
  if (isBirdDead(bird, state.current.pipes)) {
    state.current.activeScreen = SCREENS.DEATH;
    playDeathSound();
  }
}

function drawPauseButton() {
  drawText("PAUSE", 420, 10, { color: "#f7dc6f" });
}

function drawScoreText() {
  drawText(`SCORE:${state.current.score}`, 10, 10);
}

// HUD panel in the top-right corner below the pause button, holding the
// training stats with the best-distance-per-generation chart underneath
function drawTrainingPanel() {
  const panelWidth = 170;
  const panelHeight = 120;
  const panelX = CANVAS_WIDTH - panelWidth - 10;
  const panelY = 34;
  context.fillStyle = "rgba(0, 0, 0, 0.45)";
  context.fillRect(panelX, panelY, panelWidth, panelHeight);
  // Stats, with labels padded to equal width so the values line up
  // in the pixel font
  const lines = [
    ["BEST-DIST", state.current.bestDistance],
    ["GENERATION", state.current.generation],
    ["ALIVE", `${state.current.liveBirds.length}/${BIRD_CREATE_LIMIT}`],
    ["SPECIES", state.current.speciesCount]
  ];
  lines.forEach(([label, value], index) => {
    drawText(
      `${label.padEnd(10)} : ${value}`,
      panelX + 8,
      panelY + 8 + index * 12,
      { size: 8 }
    );
  });
  // Chart title below the stats
  drawText("DIST/GEN", panelX + 8, panelY + 60, { size: 8 });
  // Plot area inside the panel
  const plotX = panelX + 8;
  const plotY = panelY + 74;
  const plotWidth = panelWidth - 16;
  const plotHeight = panelHeight - 82;
  // Recessive baseline
  context.strokeStyle = "rgba(255, 255, 255, 0.35)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(plotX, plotY + plotHeight);
  context.lineTo(plotX + plotWidth, plotY + plotHeight);
  context.stroke();
  // The series line needs at least two generations of data,
  // scaled to the highest value in view
  const history = state.current.distanceHistory;
  if (history.length < 2) {
    return;
  }
  const maxValue = Math.max(...history);
  context.strokeStyle = "#f7dc6f";
  context.lineWidth = 2;
  context.beginPath();
  history.forEach((value, i) => {
    const x = plotX + (i / (history.length - 1)) * plotWidth;
    const y = plotY + plotHeight - (value / maxValue) * plotHeight;
    if (i === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });
  context.stroke();
}

function drawMainScreen() {
  const speed = getPipeSpeed();
  drawBackground(speed);
  drawPipes(speed);
  drawGround(speed);
  drawScoreText();
  drawPauseButton();
  if (state.current.mode === MODES.STANDARD) {
    drawPlayerBird();
  } else if (state.current.mode === MODES.AUTOPLAY) {
    drawAutoplayBird();
  } else {
    drawTrainingPanel();
    drawBirds();
  }
}

export default drawMainScreen;

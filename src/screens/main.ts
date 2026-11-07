import {
  BACKGROUND_FADE_OPACITY,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  GROUND_HEIGHT,
  Mode,
  Screen,
  TRAINING_MAX_SCORE,
  TURBO_BUDGET_MS,
  TURBO_SPEED
} from "../constants/app";
import {
  BIRD_CREATE_LIMIT,
  BIRD_HEIGHT,
  BIRD_START_X,
  BIRD_WIDTH
} from "../constants/bird";
import {
  PIPE_ACTIVE_LIMIT,
  PIPE_EXIT_X,
  PIPE_MAX_DISTANCE,
  PIPE_MAX_SPEED,
  PIPE_MIN_DISTANCE,
  PIPE_SPAWN_X,
  PIPE_SPEED,
  PIPE_SPEED_RAMP,
  PIPE_WIDTH
} from "../constants/pipe";
import { resetState, setBestScore, setChampion, state } from "../state";
import type { Bird, Pipe } from "../types";
import { drawBird, isBirdDead, think, updateBird } from "../utils/bird";
import { context, drawText } from "../utils/canvas";
import { nextGeneration } from "../utils/ga";
import { createCopy, getRandomInteger } from "../utils/helper";
import { drawItems, getMainItems } from "../utils/menu";
import { drawPipe, makePipeActive, updatePipe } from "../utils/pipe";
import { playDeathSound, playScoreSound } from "../utils/sound";
import { backgroundImages, groundSprite } from "../utils/sprites";

// How many generations the fitness chart keeps
const CHART_MAX_POINTS = 60;

// Opacity of each training bird
const FLOCK_OPACITY = 0.6;
// Radius of the ring marking the elite bird
const ELITE_RING_RADIUS = 19;

// Scroll offsets for the ground and background patterns (purely visual)
const scrollOffsets = {
  ground: 0,
  background: 0
};

// The square background image is scaled to the canvas height
const BACKGROUND_TILE_SIZE = CANVAS_HEIGHT;

// Difficulty ramps up with score in standard mode; training keeps a fixed
// speed so every generation is scored against the same environment
function getPipeSpeed(): number {
  if (state.current.mode !== Mode.STANDARD) {
    return PIPE_SPEED;
  }
  return Math.min(
    PIPE_SPEED + state.current.score * PIPE_SPEED_RAMP,
    PIPE_MAX_SPEED
  );
}

// --- Simulation (no drawing) ---------------------------------------------

// Advances every active pipe, scores pairs the birds have flown past,
// recycles pairs that left the screen, and spawns new ones
function updatePipes(speed: number): void {
  let activeCount = 0;
  let farthest: Pipe | null = null;
  for (const pipe of state.current.pipes) {
    if (!pipe.active) {
      continue;
    }
    updatePipe(pipe, speed);
    // Score as soon as the pair's trailing edge passes the birds
    if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_START_X) {
      pipe.passed = true;
      state.current.score += 1;
      // Chime in standard and autoplay mode; training would be a noise wall
      if (state.current.mode !== Mode.TRAINING) {
        playScoreSound();
      }
    }
    if (pipe.x < PIPE_EXIT_X) {
      pipe.active = false;
      continue;
    }
    activeCount += 1;
    if (!farthest || pipe.x > farthest.x) {
      farthest = pipe;
    }
  }
  if (activeCount < PIPE_ACTIVE_LIMIT) {
    const pipe = state.current.pipes.find((p) => !p.active);
    if (pipe) {
      // Chain each new pair after the farthest one, keeping its gap within
      // reach; the first pair of a run enters from the right edge
      if (farthest) {
        const x =
          farthest.x + getRandomInteger(PIPE_MIN_DISTANCE, PIPE_MAX_DISTANCE);
        makePipeActive(pipe, x, farthest.gapY);
      } else {
        makePipeActive(pipe, PIPE_SPAWN_X);
      }
    }
  }
}

function updatePlayerBird(): void {
  updateBird(state.current.playerBird);
  if (isBirdDead(state.current.playerBird, state.current.pipes)) {
    state.current.activeScreen = Screen.DEATH;
    playDeathSound();
    if (state.current.score > state.current.bestScore) {
      setBestScore(state.current.score);
    }
  }
}

function updateAutoplayBird(): void {
  const bird = state.current.playerBird;
  updateBird(bird);
  think(bird, state.current.pipes);
  // Autoplay runs don't count towards the player's best score
  if (isBirdDead(bird, state.current.pipes)) {
    state.current.activeScreen = Screen.DEATH;
    playDeathSound();
  }
}

function breedNextGeneration(): void {
  const generationBest = Math.max(
    ...state.current.deadBirds.map((bird) => bird.distance)
  );
  state.current.generation += 1;
  // Keep a copy of the champion brain (and its color) whenever the record
  // improves, so it can be exported and played back in autoplay mode
  if (generationBest > state.current.bestDistance) {
    const champion = state.current.deadBirds.reduce((a, b) =>
      b.distance > a.distance ? b : a
    );
    setChampion(createCopy(champion.brain), champion.color);
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
  // Every bird of the finished generation is a member of some species
  const { birds, species } = nextGeneration(state.current.species);
  state.current.liveBirds = birds;
  state.current.species = species;
  state.current.deadBirds = [];
  resetState();
}

function updateLiveBirds(): void {
  // Iterate backwards so removing a dead bird doesn't skip the next one
  for (let i = state.current.liveBirds.length - 1; i >= 0; i -= 1) {
    const bird = state.current.liveBirds[i];
    updateBird(bird);
    think(bird, state.current.pipes);
    if (isBirdDead(bird, state.current.pipes)) {
      state.current.deadBirds.push(...state.current.liveBirds.splice(i, 1));
    }
  }
  // A generation that reaches the score cap is done: end it so evolution
  // keeps going instead of watching a perfect bird forever
  if (state.current.score >= TRAINING_MAX_SCORE) {
    state.current.deadBirds.push(...state.current.liveBirds);
    state.current.liveBirds = [];
  }
  // When all birds are dead breed the next generation from the dead ones
  if (state.current.liveBirds.length === 0) {
    breedNextGeneration();
  }
}

// Runs one simulation tick for the active mode
function simulate(speed: number): void {
  updatePipes(speed);
  if (state.current.mode === Mode.STANDARD) {
    updatePlayerBird();
  } else if (state.current.mode === Mode.AUTOPLAY) {
    updateAutoplayBird();
  } else {
    updateLiveBirds();
  }
}

// --- Drawing --------------------------------------------------------------

function drawBackground(advance: number): void {
  const backgroundImage =
    backgroundImages[state.current.backgroundIndex % backgroundImages.length];
  // Repeat the backdrop, scrolling at quarter speed for parallax depth
  scrollOffsets.background =
    (scrollOffsets.background + advance * 0.25) % BACKGROUND_TILE_SIZE;
  for (
    let x = -scrollOffsets.background;
    x < CANVAS_WIDTH;
    x += BACKGROUND_TILE_SIZE
  ) {
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

function drawActivePipes(): void {
  for (let i = 0; i < state.current.pipes.length; i += 1) {
    if (state.current.pipes[i].active) {
      drawPipe(state.current.pipes[i]);
    }
  }
}

function drawGround(advance: number): void {
  const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
  // Repeat the ground block tile across the bottom, scrolled with the
  // pipes so the ground appears to move
  scrollOffsets.ground = (scrollOffsets.ground + advance) % GROUND_HEIGHT;
  for (let x = -scrollOffsets.ground; x < CANVAS_WIDTH; x += GROUND_HEIGHT) {
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

// Training birds are drawn translucent, so where the flock overlaps reads
// as density instead of one solid blob. The elite (last generation's
// champion) is drawn last, solid and ringed, so you can follow it.
function drawLiveBirds(): void {
  let elite: Bird | null = null;
  context.globalAlpha = FLOCK_OPACITY;
  for (const bird of state.current.liveBirds) {
    if (bird.elite) {
      elite = bird;
    } else {
      drawBird(bird);
    }
  }
  context.globalAlpha = 1;
  if (elite) {
    drawBird(elite);
    context.strokeStyle = "white";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(
      elite.x + BIRD_WIDTH / 2,
      elite.y + BIRD_HEIGHT / 2,
      ELITE_RING_RADIUS,
      0,
      Math.PI * 2
    );
    context.stroke();
  }
}

function drawScoreText(): void {
  drawText(`SCORE:${state.current.score}`, 10, 10);
}

// HUD panel in the top-right corner below the pause button, holding the
// training stats with the best-distance-per-generation chart underneath
function drawTrainingPanel(): void {
  const panelWidth = 170;
  const panelHeight = 120;
  const panelX = CANVAS_WIDTH - panelWidth - 10;
  const panelY = 34;
  context.fillStyle = "rgba(0, 0, 0, 0.45)";
  context.fillRect(panelX, panelY, panelWidth, panelHeight);
  // Stats, with labels padded to equal width so the values line up
  // in the pixel font
  const lines: [string, string | number][] = [
    ["BEST-DIST", state.current.bestDistance],
    ["GENERATION", state.current.generation],
    ["ALIVE", `${state.current.liveBirds.length}/${BIRD_CREATE_LIMIT}`],
    ["SPECIES", state.current.species.length]
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

// Runs the simulation for this frame and returns how many ticks ran.
// `ticks` is how many real-time ticks elapsed since the last frame; training
// multiplies it by the speed setting, or in turbo runs as many ticks as fit
// in a fixed time budget.
function runTicks(ticks: number, speed: number): number {
  const { mode, trainingSpeed } = state.current;
  const isTraining = mode === Mode.TRAINING;
  const isTurbo = isTraining && trainingSpeed === TURBO_SPEED;
  const deadline = performance.now() + TURBO_BUDGET_MS;
  const target = isTraining && !isTurbo ? ticks * trainingSpeed : ticks;
  let ran = 0;
  while (isTurbo ? performance.now() < deadline : ran < target) {
    simulate(speed);
    ran += 1;
    // A tick may end the run (death screen) - stop simulating further
    if (state.current.activeScreen !== Screen.MAIN) {
      break;
    }
  }
  return ran;
}

function drawMainScreen(ticks: number): void {
  const speed = getPipeSpeed();
  const ran = runTicks(ticks, speed);
  // Ground and backdrop scroll to match the total distance traveled
  const advance = speed * ran;
  drawBackground(advance);
  drawActivePipes();
  drawGround(advance);
  drawScoreText();
  if (state.current.mode === Mode.TRAINING) {
    drawLiveBirds();
    drawTrainingPanel();
  } else {
    drawBird(state.current.playerBird);
  }
  drawItems(getMainItems(state.current.mode, state.current.trainingSpeed));
}

export default drawMainScreen;

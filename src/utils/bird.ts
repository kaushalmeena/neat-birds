import { CANVAS_WIDTH } from "../constants/app";
import {
  BirdColor,
  BIRD_FALL_SPEED,
  BIRD_FLAP_TICKS,
  BIRD_MAX_FALL_SPEED,
  BIRD_HEIGHT,
  BIRD_HITBOX_INSET,
  BIRD_FLAP_LIFT,
  BIRD_START_X,
  BIRD_START_Y,
  BIRD_WIDTH,
  Wing
} from "../constants/bird";
import { Input, INPUT_COUNT, OUTPUT_COUNT } from "../constants/neat";
import {
  PIPE_GAP,
  PIPE_HEIGHT,
  PIPE_WIDTH,
  PLAYFIELD_HEIGHT
} from "../constants/pipe";
import type { Bird, Pipe } from "../types";
import type { Genome } from "./neat";
import { context } from "./canvas";
import { createCopy, isRectangleOverlapping } from "./helper";
import { createGenome, feedForward } from "./neat";
import { getLowerPipeY, getUpperPipeY } from "./pipe";
import { birdSprites } from "./sprites";

interface CreateBirdOptions {
  x?: number;
  y?: number;
  dy?: number;
  color?: BirdColor;
  wing?: Wing;
  brain?: Genome;
}

// Function to create a bird object with specified or default properties
export function createBird({
  x,
  y,
  dy,
  color,
  wing,
  brain
}: CreateBirdOptions = {}): Bird {
  return {
    // Color of bird (default to green)
    color: color ?? BirdColor.GREEN,
    // Wing of bird (default to down)
    wing: wing ?? Wing.DOWN,
    // Coordinates of bird (default to start position)
    x: x ?? BIRD_START_X,
    y: y ?? BIRD_START_Y,
    // Vertical velocity of bird (default to 0)
    dy: dy ?? 0,
    // Brain of bird (contains NEAT genome data); copy a given brain to
    // avoid reference problems, otherwise start from a fresh genome
    brain: brain ? createCopy(brain) : createGenome(INPUT_COUNT, OUTPUT_COUNT),
    // Ticks left with the wing up after a flap
    wingTicks: 0,
    // Distance is how many ticks it's been alive
    distance: 0,
    // Fitness is normalized version of distance
    fitness: 0
  };
}

// Function to advance a bird by one tick: gravity, position, wing animation
export function updateBird(bird: Bird): void {
  bird.dy = Math.min(bird.dy + BIRD_FALL_SPEED, BIRD_MAX_FALL_SPEED);
  // Prevent bird going offscreen by flapping
  if (bird.y + bird.dy > 0) {
    bird.y += bird.dy;
  }
  // The wing stays up for a few ticks after a flap. Counting ticks (not a
  // timer) keeps the animation in step with fast-forwarded training.
  if (bird.wingTicks > 0) {
    bird.wingTicks -= 1;
  }
  bird.wing = bird.wingTicks > 0 ? Wing.UP : Wing.DOWN;
  // Every tick it is alive increases the distance
  bird.distance += 1;
}

// Function to draw a bird on the canvas, tilted up when rising
// and progressively nose-down as it falls
export function drawBird(bird: Bird): void {
  const sprite = birdSprites[bird.color][bird.wing];
  const angle = Math.min(Math.max(bird.dy * 0.08, -0.4), 0.9);
  context.save();
  context.translate(bird.x + BIRD_WIDTH / 2, bird.y + BIRD_HEIGHT / 2);
  context.rotate(angle);
  context.drawImage(
    sprite.image,
    sprite.sx,
    sprite.sy,
    sprite.sWidth,
    sprite.sHeight,
    -BIRD_WIDTH / 2,
    -BIRD_HEIGHT / 2,
    BIRD_WIDTH,
    BIRD_HEIGHT
  );
  context.restore();
}

// Function to simulate the bird flapping its wings
export function flap(bird: Bird): void {
  bird.dy = BIRD_FLAP_LIFT;
  bird.wingTicks = BIRD_FLAP_TICKS;
  bird.wing = Wing.UP;
}

// Function to reset a bird back to its starting position and stats
export function resetBird(bird: Bird): void {
  bird.x = BIRD_START_X;
  bird.y = BIRD_START_Y;
  bird.dy = 0;
  bird.wing = Wing.DOWN;
  bird.wingTicks = 0;
  bird.distance = 0;
  bird.fitness = 0;
}

// Finds the closest pipe pair ahead. A pair counts as ahead until its
// trailing edge passes the bird, so the bird keeps reacting to the pair it
// is currently flying through.
function getNextPipe(bird: Bird, pipes: Pipe[]): Pipe | null {
  let nextPipe: Pipe | null = null;
  let minDistance = Number.POSITIVE_INFINITY;
  for (const pipe of pipes) {
    if (pipe.active) {
      const diff = pipe.x + PIPE_WIDTH - bird.x;
      if (diff > 0 && diff < minDistance) {
        minDistance = diff;
        nextPipe = pipe;
      }
    }
  }
  return nextPipe;
}

// Function for the bird to decide whether to flap, from what it can sense.
// Every input is scaled to roughly -1..1.
export function think(bird: Bird, pipes: Pipe[]): void {
  const pipe = getNextPipe(bird, pipes);
  if (!pipe) {
    return;
  }
  // See Input in constants/neat.ts for what each input means
  const inputs: number[] = Array.from({ length: INPUT_COUNT }, () => 0);
  inputs[Input.HEIGHT] = bird.y / PLAYFIELD_HEIGHT;
  inputs[Input.VELOCITY] = bird.dy / BIRD_MAX_FALL_SPEED;
  inputs[Input.PIPE_DISTANCE] = (pipe.x - bird.x) / CANVAS_WIDTH;
  inputs[Input.GAP_TOP_DISTANCE] = (bird.y - pipe.gapY) / PLAYFIELD_HEIGHT;
  inputs[Input.GAP_BOTTOM_DISTANCE] =
    (pipe.gapY + PIPE_GAP - (bird.y + BIRD_HEIGHT)) / PLAYFIELD_HEIGHT;
  // Get the output from the network and decide to flap or not!
  const [output] = feedForward(bird.brain, inputs);
  if (output > 0.5) {
    flap(bird);
  }
}

function isHittingPipe(bird: Bird, pipeY: number, pipeX: number): boolean {
  return isRectangleOverlapping(
    bird.x + BIRD_HITBOX_INSET,
    bird.y + BIRD_HITBOX_INSET,
    BIRD_WIDTH - 2 * BIRD_HITBOX_INSET,
    BIRD_HEIGHT - 2 * BIRD_HITBOX_INSET,
    pipeX,
    pipeY,
    PIPE_WIDTH,
    PIPE_HEIGHT
  );
}

// Function to check if bird has hit the ground or collided with a pipe,
// using a hitbox inset on all sides to be a bit forgiving
export function isBirdDead(bird: Bird, pipes: Pipe[]): boolean {
  if (bird.y + BIRD_HEIGHT - BIRD_HITBOX_INSET > PLAYFIELD_HEIGHT) {
    return true;
  }
  return pipes.some(
    (pipe) =>
      pipe.active &&
      (isHittingPipe(bird, getUpperPipeY(pipe), pipe.x) ||
        isHittingPipe(bird, getLowerPipeY(pipe), pipe.x))
  );
}

import { CANVAS_HEIGHT, CANVAS_WIDTH, GROUND_HEIGHT } from "../constants/app";
import {
  BirdColor,
  BIRD_FLAP_TIMEOUT,
  BIRD_FALL_SPEED,
  BIRD_HEIGHT,
  BIRD_HITBOX_INSET,
  BIRD_FLAP_LIFT,
  BIRD_START_X,
  BIRD_START_Y,
  BIRD_WIDTH,
  Wing
} from "../constants/bird";
import { INPUT_COUNT, OUTPUT_COUNT } from "../constants/neat";
import { PIPE_HEIGHT, PipeType, PIPE_WIDTH } from "../constants/pipe";
import type { Bird, Pipe } from "../types";
import type { Genome } from "./neat";
import { context } from "./canvas";
import { createCopy, isRectangleOverlapping, normalizeValue } from "./helper";
import { createGenome, feedForward } from "./neat";
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
    // Distance is how many frames it's been alive
    distance: 0,
    // Fitness is normalized version of distance
    fitness: 0
  };
}

// Function to update the position of a bird based on its velocity
export function updateBird(bird: Bird): void {
  bird.dy += BIRD_FALL_SPEED;
  // Prevent bird going offscreen by flapping
  if (bird.y + bird.dy > 0) {
    bird.y += bird.dy;
  }
  // Every frame it is alive increases the distance
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
  // Each bird tracks its own wing timer, otherwise birds flapping in the
  // same window would cancel each other's wing animation
  clearTimeout(bird.wingTimeout);
  bird.dy = BIRD_FLAP_LIFT;
  bird.wing = Wing.UP;
  bird.wingTimeout = setTimeout(() => {
    bird.wing = Wing.DOWN;
  }, BIRD_FLAP_TIMEOUT);
}

// Function to reset a bird back to its starting position and stats
export function resetBird(bird: Bird): void {
  bird.x = BIRD_START_X;
  bird.y = BIRD_START_Y;
  bird.dy = 0;
  bird.wing = Wing.DOWN;
  bird.distance = 0;
  bird.fitness = 0;
}

// Function for the bird to make decisions based on the current environment (pipes)
export function think(bird: Bird, pipes: Pipe[]): void {
  // Find the closest pipe ahead - a pipe counts as ahead until its
  // trailing edge passes the bird, so the bird keeps reacting to the
  // pipe it is currently passing through
  let closestPipe: Pipe | null = null;
  let minDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < pipes.length; i += 1) {
    // Check if pipe is active
    if (pipes[i].active) {
      const diff = pipes[i].x + PIPE_WIDTH - bird.x;
      if (diff > 0 && diff < minDistance) {
        minDistance = diff;
        closestPipe = pipes[i];
      }
    }
  }
  if (closestPipe) {
    const inputs: number[] = [];
    const relativeX = closestPipe.x - bird.x;
    const relativeY = closestPipe.y - bird.y;
    // Distance in the Y axis from the bird to the top of the screen
    inputs[0] = normalizeValue(bird.y, 0, CANVAS_HEIGHT);
    // Distance in the Y axis from the bird to the bottom of the screen
    inputs[1] = 1 - inputs[0];
    // Distance in the X axis from the bird to the next pipe
    inputs[2] = normalizeValue(relativeX, 0, CANVAS_WIDTH);
    // Distance in the Y axis from the bird to the highest point of the pipe in the top
    inputs[3] =
      closestPipe.type === PipeType.LOWER
        ? inputs[0]
        : normalizeValue(relativeY + PIPE_HEIGHT, 0, CANVAS_HEIGHT);
    // Distance in the Y axis form the bird to the lowest point of the pipe in the bottom
    inputs[4] =
      closestPipe.type === PipeType.LOWER
        ? normalizeValue(relativeY, 0, CANVAS_HEIGHT)
        : inputs[1];
    // Get the output from the network and decide to flap or not!
    const [output] = feedForward(bird.brain, inputs);
    if (output > 0.5) {
      flap(bird);
    }
  }
}

// Function to check if bird has hit the ground or collided with a pipe
export function isBirdDead(bird: Bird, pipes: Pipe[]): boolean {
  // If bird has hit the ground
  if (
    bird.y + BIRD_HEIGHT - BIRD_HITBOX_INSET >
    CANVAS_HEIGHT - GROUND_HEIGHT
  ) {
    return true;
  }
  // Check if bird has collided with active pipes,
  // using a hitbox inset on all sides to be a bit forgiving
  for (let i = 0; i < pipes.length; i += 1) {
    if (
      pipes[i].active &&
      isRectangleOverlapping(
        bird.x + BIRD_HITBOX_INSET,
        bird.y + BIRD_HITBOX_INSET,
        BIRD_WIDTH - 2 * BIRD_HITBOX_INSET,
        BIRD_HEIGHT - 2 * BIRD_HITBOX_INSET,
        pipes[i].x,
        pipes[i].y,
        PIPE_WIDTH,
        PIPE_HEIGHT
      )
    ) {
      return true;
    }
  }
  return false;
}

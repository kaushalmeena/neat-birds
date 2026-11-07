import {
  PIPE_COLOR_COUNT,
  PIPE_CREATE_LIMIT,
  PIPE_GAP,
  PIPE_GAP_MAX_Y,
  PIPE_GAP_MIN_Y,
  PIPE_HEIGHT,
  PIPE_MAX_GAP_SHIFT,
  PIPE_SPEED,
  PIPE_WIDTH
} from "../constants/pipe";
import type { Pipe, Sprite } from "../types";
import { context } from "./canvas";
import { getRandomInteger } from "./helper";
import { pipeSprites } from "./sprites";

// Function to create an inactive pipe pair
export function createPipe(): Pipe {
  return {
    x: 0,
    // y of the gap's top edge; the gap's bottom edge is gapY + PIPE_GAP
    gapY: 0,
    // Color variant of pipe (randomized on activation)
    colorIndex: 0,
    // Whether the pair has been counted towards the score
    passed: false,
    // Make pipe initially inactive for drawing
    active: false
  };
}

// Function to create an array of pipes
export function createPipes(): Pipe[] {
  const pipes: Pipe[] = [];
  for (let i = 0; i < PIPE_CREATE_LIMIT; i += 1) {
    pipes.push(createPipe());
  }
  return pipes;
}

// Function to place a pipe pair at x with a random gap. When the previous
// pair's gap is given, the new gap stays within PIPE_MAX_GAP_SHIFT of it.
export function makePipeActive(
  pipe: Pipe,
  x: number,
  previousGapY?: number
): void {
  let minY = PIPE_GAP_MIN_Y;
  let maxY = PIPE_GAP_MAX_Y;
  if (previousGapY !== undefined) {
    minY = Math.max(minY, previousGapY - PIPE_MAX_GAP_SHIFT);
    maxY = Math.min(maxY, previousGapY + PIPE_MAX_GAP_SHIFT);
  }
  pipe.x = x;
  pipe.gapY = getRandomInteger(minY, maxY);
  pipe.colorIndex = getRandomInteger(0, PIPE_COLOR_COUNT - 1);
  pipe.passed = false;
  pipe.active = true;
}

// Function to make a pipe inactive by resetting its properties
export function makePipeInactive(pipe: Pipe): void {
  pipe.x = 0;
  pipe.gapY = 0;
  pipe.passed = false;
  pipe.active = false;
}

// Function to update the position of a pipe based on the given speed
export function updatePipe(pipe: Pipe, speed: number = PIPE_SPEED): void {
  pipe.x -= speed;
}

// The upper pipe's rectangle sits right above the gap
export function getUpperPipeY(pipe: Pipe): number {
  return pipe.gapY - PIPE_HEIGHT;
}

// The lower pipe's rectangle starts right below the gap
export function getLowerPipeY(pipe: Pipe): number {
  return pipe.gapY + PIPE_GAP;
}

function drawPipeSprite(sprite: Sprite, x: number, y: number): void {
  context.drawImage(
    sprite.image,
    sprite.sx,
    sprite.sy,
    sprite.sWidth,
    sprite.sHeight,
    x,
    y,
    PIPE_WIDTH,
    PIPE_HEIGHT
  );
}

// Function to draw a pipe pair on the canvas. The sheet stores one pipe per
// color with the cap at the top, so the upper pipe is drawn rotated 180
// degrees to point its cap down at the gap.
export function drawPipe(pipe: Pipe): void {
  const sprite = pipeSprites[pipe.colorIndex] ?? pipeSprites[0];
  const upperY = getUpperPipeY(pipe);
  context.save();
  context.translate(pipe.x + PIPE_WIDTH / 2, upperY + PIPE_HEIGHT / 2);
  context.rotate(Math.PI);
  drawPipeSprite(sprite, -PIPE_WIDTH / 2, -PIPE_HEIGHT / 2);
  context.restore();
  drawPipeSprite(sprite, pipe.x, getLowerPipeY(pipe));
}

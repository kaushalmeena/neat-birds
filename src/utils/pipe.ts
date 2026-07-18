import { CANVAS_WIDTH } from "../constants/app";
import {
  LOWER_PIPE_MAX_Y_POS,
  LOWER_PIPE_MIN_Y_POS,
  PIPE_COLOR_COUNT,
  PIPE_CREATE_LIMIT,
  PIPE_HEIGHT,
  PIPE_MAX_X_POS,
  PIPE_MIN_X_POS,
  PIPE_SPEED,
  PipeType,
  PIPE_WIDTH,
  UPPER_PIPE_MAX_Y_POS,
  UPPER_PIPE_MIN_Y_POS
} from "../constants/pipe";
import type { Pipe } from "../types";
import { context } from "./canvas";
import { getRandomInteger, getRandomItem } from "./helper";
import { pipeSprites } from "./sprites";

interface CreatePipeOptions {
  x?: number;
  y?: number;
  type?: PipeType;
}

// Function to create a pipe object with specified or random properties
export function createPipe({ x, y, type }: CreatePipeOptions = {}): Pipe {
  return {
    // Type of pipe (default to random type)
    type: type ?? getRandomItem([PipeType.UPPER, PipeType.LOWER]),
    // Coordinates of pipe (default to origin)
    x: x ?? 0,
    y: y ?? 0,
    // Color variant of pipe (randomized on activation)
    colorIndex: 0,
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

// Function to make a pipe active by updating its properties
export function makePipeActive(pipe: Pipe, xPos?: number): void {
  pipe.type = getRandomItem([PipeType.UPPER, PipeType.LOWER]);
  pipe.colorIndex = getRandomInteger(0, PIPE_COLOR_COUNT - 1);
  pipe.x =
    xPos ?? CANVAS_WIDTH + getRandomInteger(PIPE_MIN_X_POS, PIPE_MAX_X_POS);
  // Set y position of the pipe based on type
  if (pipe.type === PipeType.LOWER) {
    pipe.y = getRandomInteger(LOWER_PIPE_MIN_Y_POS, LOWER_PIPE_MAX_Y_POS);
  } else {
    pipe.y = getRandomInteger(UPPER_PIPE_MIN_Y_POS, UPPER_PIPE_MAX_Y_POS);
  }
  pipe.active = true;
}

// Function to make a pipe inactive by resetting its properties
export function makePipeInactive(pipe: Pipe): void {
  pipe.x = 0;
  pipe.y = 0;
  pipe.active = false;
}

// Function to update the position of a pipe based on the given speed
export function updatePipe(pipe: Pipe, speed: number = PIPE_SPEED): void {
  pipe.x -= speed;
}

// Function to draw a pipe on the canvas. The sheet stores one pipe per
// color with the cap at the top, so upper pipes are drawn rotated 180
// degrees to point their cap down at the gap.
export function drawPipe(pipe: Pipe): void {
  const sprite = pipeSprites[pipe.colorIndex] ?? pipeSprites[0];
  if (pipe.type === PipeType.UPPER) {
    context.save();
    context.translate(pipe.x + PIPE_WIDTH / 2, pipe.y + PIPE_HEIGHT / 2);
    context.rotate(Math.PI);
    context.drawImage(
      sprite.image,
      sprite.sx,
      sprite.sy,
      sprite.sWidth,
      sprite.sHeight,
      -PIPE_WIDTH / 2,
      -PIPE_HEIGHT / 2,
      PIPE_WIDTH,
      PIPE_HEIGHT
    );
    context.restore();
  } else {
    context.drawImage(
      sprite.image,
      sprite.sx,
      sprite.sy,
      sprite.sWidth,
      sprite.sHeight,
      pipe.x,
      pipe.y,
      PIPE_WIDTH,
      PIPE_HEIGHT
    );
  }
}

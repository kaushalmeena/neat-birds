import {
  Action,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_FRAME_CATCHUP_MS,
  Screen,
  TICK_MS
} from "./constants/app";
import drawDeathScreen from "./screens/death";
import drawMainScreen from "./screens/main";
import drawPauseScreen from "./screens/pause";
import drawTitleScreen from "./screens/title";
import { state } from "./state";
import { performAction } from "./utils/app";
import { canvas, context } from "./utils/canvas";
import { findItemAt, getScreenItems } from "./utils/menu";
import { drawToast } from "./utils/toast";

import "./style.css";

// Keyboard shortcuts per screen. Restarting after death needs Enter (not
// Space) so mashing flap through a crash doesn't skip the death screen.
const KEY_ACTIONS: Record<Screen, Partial<Record<string, Action>>> = {
  [Screen.TITLE]: {
    ArrowUp: Action.PREVIOUS_MODE,
    ArrowDown: Action.NEXT_MODE,
    Enter: Action.START_GAME,
    Space: Action.START_GAME
  },
  [Screen.MAIN]: {
    Space: Action.FLAP_WING,
    Escape: Action.PAUSE_GAME,
    KeyP: Action.PAUSE_GAME,
    ArrowUp: Action.CYCLE_SPEED,
    ArrowDown: Action.CYCLE_SPEED
  },
  [Screen.PAUSE]: {
    Escape: Action.RESUME_GAME,
    KeyP: Action.RESUME_GAME
  },
  [Screen.DEATH]: {
    Enter: Action.RESTART_GAME,
    Escape: Action.QUIT_GAME
  }
};

// Acts on key press (not release) so flapping has no lag; held keys don't
// auto-repeat
function handleKeyDown(event: KeyboardEvent): void {
  if (event.repeat) {
    return;
  }
  const action = KEY_ACTIONS[state.current.activeScreen][event.code];
  if (action) {
    // Keep Space/arrows from scrolling the page
    event.preventDefault();
    performAction(action);
  }
}

// Converts a pointer position to logical canvas coordinates and finds the
// button under it on the current screen
function getItemAtPointer(event: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
  const { activeScreen, mode, trainingSpeed } = state.current;
  return findItemAt(getScreenItems(activeScreen, mode, trainingSpeed), x, y);
}

// Flapping acts on pointerdown (mouse, pen or touch), not click, which
// fires on release and would make flaps feel late
function handlePointerDown(event: PointerEvent): void {
  if (state.current.activeScreen === Screen.MAIN && !getItemAtPointer(event)) {
    performAction(Action.FLAP_WING);
  }
}

// Buttons act on click like normal buttons. A click counts as a user
// gesture on every device (a touch pointerdown does not), which opening the
// file picker and starting audio require.
function handleClick(event: MouseEvent): void {
  const item = getItemAtPointer(event);
  if (item) {
    performAction(item.action);
  }
}

// Pause automatically when the tab is hidden, so a run doesn't sit frozen
// mid-flight (the loop stops while hidden) and resume with no warning
function handleVisibilityChange(): void {
  if (document.hidden && state.current.activeScreen === Screen.MAIN) {
    performAction(Action.PAUSE_GAME);
  }
}

function setup(): void {
  // Set canvas height and width;
  canvas.height = CANVAS_HEIGHT;
  canvas.width = CANVAS_WIDTH;
  // Resizing resets context state, so set pixel-art-friendly
  // nearest-neighbor scaling afterwards
  context.imageSmoothingEnabled = false;
  document.addEventListener("keydown", handleKeyDown);
  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("click", handleClick);
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function draw(ticks: number): void {
  switch (state.current.activeScreen) {
    case Screen.TITLE:
      drawTitleScreen();
      break;
    case Screen.MAIN:
      drawMainScreen(ticks);
      break;
    case Screen.PAUSE:
      drawPauseScreen();
      break;
    case Screen.DEATH:
      drawDeathScreen();
      break;
    default:
  }
  drawToast();
}

// Fixed-timestep loop: real time accumulates and is spent in whole
// TICK_MS simulation ticks, so the game runs at the same speed on 60Hz and
// 120Hz displays. Leftover time carries over to the next frame.
const clock = { last: 0, accumulator: 0 };

function animate(now: number): void {
  clock.accumulator = Math.min(
    clock.accumulator + now - clock.last,
    MAX_FRAME_CATCHUP_MS
  );
  clock.last = now;
  const ticks = Math.floor(clock.accumulator / TICK_MS);
  clock.accumulator -= ticks * TICK_MS;
  draw(ticks);
  requestAnimationFrame(animate);
}

function start(): void {
  // Wait for font to load
  document.fonts
    .load("44px PressStart2P")
    .then(() => {
      setup();
      clock.last = performance.now();
      requestAnimationFrame(animate);
    })
    .catch(() => {
      alert("Couldn't load font!");
    })
    .finally(() => {
      document.querySelector(".loader-container")?.remove();
    });
}

start();

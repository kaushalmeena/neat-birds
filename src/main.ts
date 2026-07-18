import {
  Action,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FRAME_DELAY,
  Mode,
  Screen
} from "./constants/app";
import drawDeathScreen from "./screens/death";
import drawMainScreen from "./screens/main";
import drawPauseScreen from "./screens/pause";
import drawTitleScreen from "./screens/title";
import { state } from "./state";
import { performAction } from "./utils/app";
import { canvas, context } from "./utils/canvas";
import { isPointInside } from "./utils/helper";
import { getPauseMenuItems } from "./utils/menu";

import "./style.css";

function setup(): void {
  // Set canvas height and width;
  canvas.height = CANVAS_HEIGHT;
  canvas.width = CANVAS_WIDTH;
  // Resizing resets context state, so set pixel-art-friendly
  // nearest-neighbor scaling afterwards
  context.imageSmoothingEnabled = false;
  // Attach keyboard listener for spacebar key
  document.body.onkeyup = (e) => {
    switch (state.current.activeScreen) {
      case Screen.MAIN:
        if (e.code === "Space") {
          performAction(Action.FLAP_WING);
        } else if (e.code === "Escape") {
          performAction(Action.PAUSE_GAME);
        } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
          performAction(Action.CYCLE_SPEED);
        }
        break;
      default:
    }
  };
  // Handle a tap/click at canvas coordinates, per screen
  const handleTap = (x: number, y: number) => {
    switch (state.current.activeScreen) {
      case Screen.TITLE:
        // When 'MODE' is clicked (three mode lines)
        if (isPointInside(x, y, 132, 230, 224, 56)) {
          performAction(Action.TOGGLE_MODE);
        }
        // When 'START' is clicked
        else if (isPointInside(x, y, 190, 300, 120, 24)) {
          performAction(Action.START_GAME);
        }
        break;
      case Screen.MAIN:
        // When 'PAUSE' is clicked
        if (isPointInside(x, y, 420, 10, 80, 14)) {
          performAction(Action.PAUSE_GAME);
        }
        // When the training 'SPEED' toggle is clicked
        else if (
          state.current.mode === Mode.TRAINING &&
          isPointInside(x, y, 318, 160, 130, 20)
        ) {
          performAction(Action.CYCLE_SPEED);
        } else {
          performAction(Action.FLAP_WING);
        }
        break;
      case Screen.DEATH:
        // When 'RESTART' is clicked
        if (isPointInside(x, y, 166, 250, 168, 24)) {
          performAction(Action.RESTART_GAME);
        }
        // When 'QUIT' is clicked
        else if (isPointInside(x, y, 202, 290, 96, 24)) {
          performAction(Action.QUIT_GAME);
        }
        break;
      case Screen.PAUSE: {
        // Menu items vary by mode, so hit-test the same list the screen draws
        const item = getPauseMenuItems(state.current.mode).find((menuItem) =>
          isPointInside(
            x,
            y,
            menuItem.x,
            menuItem.y,
            menuItem.width,
            menuItem.height
          )
        );
        if (item) {
          performAction(item.action);
        }
        break;
      }
      default:
    }
  };
  // Attach mouse listener
  canvas.onclick = (e) => {
    handleTap(
      (e.offsetX / canvas.offsetWidth) * CANVAS_WIDTH,
      (e.offsetY / canvas.offsetHeight) * CANVAS_HEIGHT
    );
  };
  // Attach touch listener for mobile devices
  canvas.ontouchstart = (e) => {
    // Prevent the browser from also firing a delayed synthetic click
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    handleTap(
      ((touch.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      ((touch.clientY - rect.top) / rect.height) * CANVAS_HEIGHT
    );
  };
}

function draw(): void {
  switch (state.current.activeScreen) {
    case Screen.TITLE:
      drawTitleScreen();
      break;
    case Screen.MAIN:
      drawMainScreen();
      break;
    case Screen.PAUSE:
      drawPauseScreen();
      break;
    case Screen.DEATH:
      drawDeathScreen();
      break;
    default:
  }
}

function animate(): void {
  setTimeout(() => {
    requestAnimationFrame(animate);
    draw();
  }, FRAME_DELAY);
}

function start(): void {
  // Wait for font to load
  document.fonts
    .load("44px PressStart2P")
    .then(() => {
      setup();
      animate();
    })
    .catch(() => {
      alert("Couldn't load font!");
    })
    .finally(() => {
      document.querySelector(".loader-container")?.remove();
    });
}

start();

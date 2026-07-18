import {
  ACTIONS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  FRAME_DELAY,
  MODES,
  SCREENS
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

function setup() {
  // Set canvas height and width;
  canvas.height = CANVAS_HEIGHT;
  canvas.width = CANVAS_WIDTH;
  // Resizing resets context state, so set pixel-art-friendly
  // nearest-neighbor scaling afterwards
  context.imageSmoothingEnabled = false;
  // Attach keyboard listener for spacebar key
  document.body.onkeyup = (e) => {
    switch (state.current.activeScreen) {
      case SCREENS.MAIN:
        if (e.code === "Space") {
          performAction(ACTIONS.FLAP_WING);
        } else if (e.code === "Escape") {
          performAction(ACTIONS.PAUSE_GAME);
        } else if (e.code === "ArrowUp" || e.code === "ArrowDown") {
          performAction(ACTIONS.CYCLE_SPEED);
        }
        break;
      default:
    }
  };
  // Handle a tap/click at canvas coordinates, per screen
  const handleTap = (x, y) => {
    switch (state.current.activeScreen) {
      case SCREENS.TITLE:
        // When 'MODE' is clicked (three mode lines)
        if (isPointInside(x, y, 132, 230, 224, 56)) {
          performAction(ACTIONS.TOGGLE_MODE);
        }
        // When 'START' is clicked
        else if (isPointInside(x, y, 190, 300, 120, 24)) {
          performAction(ACTIONS.START_GAME);
        }
        break;
      case SCREENS.MAIN:
        // When 'PAUSE' is clicked
        if (isPointInside(x, y, 420, 10, 80, 14)) {
          performAction(ACTIONS.PAUSE_GAME);
        }
        // When the training 'SPEED' toggle is clicked
        else if (
          state.current.mode === MODES.TRAINING &&
          isPointInside(x, y, 8, 28, 130, 18)
        ) {
          performAction(ACTIONS.CYCLE_SPEED);
        } else {
          performAction(ACTIONS.FLAP_WING);
        }
        break;
      case SCREENS.DEATH:
        // When 'RESTART' is clicked
        if (isPointInside(x, y, 166, 250, 168, 24)) {
          performAction(ACTIONS.RESTART_GAME);
        }
        // When 'QUIT' is clicked
        else if (isPointInside(x, y, 202, 290, 96, 24)) {
          performAction(ACTIONS.QUIT_GAME);
        }
        break;
      case SCREENS.PAUSE: {
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

function draw() {
  switch (state.current.activeScreen) {
    case SCREENS.TITLE:
      drawTitleScreen();
      break;
    case SCREENS.MAIN:
      drawMainScreen();
      break;
    case SCREENS.PAUSE:
      drawPauseScreen();
      break;
    case SCREENS.DEATH:
      drawDeathScreen();
      break;
    default:
  }
}

function animate() {
  setTimeout(() => {
    requestAnimationFrame(animate);
    draw();
  }, FRAME_DELAY);
}

function start() {
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
      document.querySelector(".loader-container").remove();
    });
}

start();

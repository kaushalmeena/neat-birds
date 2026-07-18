import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants/app";
import { state } from "../state";
import { context, drawText } from "../utils/canvas";
import { getPauseMenuItems } from "../utils/menu";

function drawPauseScreen() {
  context.textBaseline = "top";
  context.fillStyle = "#3196ca";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawText("PAUSED", 118, 100, { size: 44, lineWidth: 4 });
  // Menu items depend on the mode (only training can save/load state)
  getPauseMenuItems(state.current.mode).forEach((item) => {
    drawText(item.label, item.x, item.y, { size: 24, color: "#f7dc6f" });
  });
}

export default drawPauseScreen;

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants/app";
import { state } from "../state";
import { context, drawText } from "../utils/canvas";
import { drawItems, getPauseItems } from "../utils/menu";

function drawPauseScreen(): void {
  context.textBaseline = "top";
  context.fillStyle = "#3196ca";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawText("PAUSED", 118, 90, { size: 44, lineWidth: 4 });
  drawItems(getPauseItems(state.current.mode));
}

export default drawPauseScreen;

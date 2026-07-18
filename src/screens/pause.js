import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants/app";
import { context, drawText } from "../utils/canvas";

function drawPauseScreen() {
  context.textBaseline = "top";
  context.fillStyle = "#3196ca";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawText("PAUSED", 118, 100, { size: 44, lineWidth: 4 });
  drawText("RESUME", 178, 180, { size: 24, color: "#f7dc6f" });
  drawText("SAVE BRAIN", 130, 220, { size: 24, color: "#f7dc6f" });
  drawText("LOAD BRAIN", 130, 260, { size: 24, color: "#f7dc6f" });
  drawText("QUIT", 202, 300, { size: 24, color: "#f7dc6f" });
}

export default drawPauseScreen;

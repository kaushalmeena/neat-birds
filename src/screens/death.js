import { CANVAS_HEIGHT, CANVAS_WIDTH } from "../constants/app";
import { state } from "../state";
import { context, drawText } from "../utils/canvas";

function drawDeathScreen() {
  context.textBaseline = "top";
  context.fillStyle = "#3196ca";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawText("GAME OVER", 52, 100, { size: 44, lineWidth: 4 });
  drawText("YOUR SCORE", 58, 170, { size: 16 });
  drawText(state.current.score, 58, 190, { size: 16 });
  drawText("BEST SCORE", 280, 170, { size: 16 });
  drawText(state.current.bestScore, 280, 190, { size: 16 });
  drawText("RESTART", 166, 250, { size: 24, color: "#f7dc6f" });
  drawText("QUIT", 202, 290, { size: 24, color: "#f7dc6f" });
}

export default drawDeathScreen;

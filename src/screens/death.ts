import { CANVAS_HEIGHT, CANVAS_WIDTH, Mode } from "../constants/app";
import { state } from "../state";
import { context, drawText } from "../utils/canvas";
import { drawItems, getDeathItems } from "../utils/menu";

function drawDeathScreen(): void {
  context.textBaseline = "top";
  context.fillStyle = "#3196ca";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawText("GAME OVER", 52, 100, { size: 44, lineWidth: 4 });
  // In autoplay the trained bird was flying, not the player
  const scoreLabel =
    state.current.mode === Mode.AUTOPLAY ? "BIRD SCORE" : "YOUR SCORE";
  drawText(scoreLabel, 58, 170, { size: 16 });
  drawText(state.current.score, 58, 190, { size: 16 });
  drawText("BEST SCORE", 280, 170, { size: 16 });
  drawText(state.current.bestScore, 280, 190, { size: 16 });
  drawItems(getDeathItems());
}

export default drawDeathScreen;

import { CANVAS_HEIGHT, CANVAS_WIDTH, Mode } from "../constants/app";
import { state } from "../state";
import { context, drawText } from "../utils/canvas";
import { drawItems, getTitleItems } from "../utils/menu";

// One-line hint under START saying what autoplay will fly
function getAutoplayHint(): string {
  return state.current.bestBirdBrain
    ? "FLIES YOUR BEST TRAINED BIRD"
    : "NO BIRD YET - PICKS A BRAIN FILE";
}

function drawTitleScreen(): void {
  context.textBaseline = "top";
  context.fillStyle = "#3196ca";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawText("NEAT", 110, 70, { size: 72, lineWidth: 5 });
  drawText("BIRDS", 110, 145, { size: 58, lineWidth: 5 });
  drawItems(getTitleItems(state.current.mode));
  if (state.current.mode === Mode.AUTOPLAY) {
    const hint = getAutoplayHint();
    drawText(hint, (CANVAS_WIDTH - hint.length * 8) / 2, 336, { size: 8 });
  }
}

export default drawTitleScreen;

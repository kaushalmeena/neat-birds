import { CANVAS_HEIGHT, CANVAS_WIDTH, Mode } from "../constants/app";
import { state } from "../state";
import { context, drawText } from "../utils/canvas";

const MODE_LABELS: [Mode, string][] = [
  [Mode.STANDARD, "STANDARD MODE"],
  [Mode.TRAINING, "TRAINING MODE"],
  [Mode.AUTOPLAY, "AUTOPLAY MODE"]
];

function drawTitleScreen(): void {
  context.textBaseline = "top";
  context.fillStyle = "#3196ca";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawText("NEAT", 110, 70, { size: 72, lineWidth: 5 });
  drawText("BIRDS", 110, 145, { size: 58, lineWidth: 5 });
  MODE_LABELS.forEach(([mode, label], index) => {
    drawText(
      `${state.current.mode === mode ? ">" : " "}${label}`,
      130,
      230 + index * 20,
      { size: 16, color: "#f7dc6f" }
    );
  });
  drawText("START", 190, 300, { size: 24, color: "#f7dc6f" });
}

export default drawTitleScreen;

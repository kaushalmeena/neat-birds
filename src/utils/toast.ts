import { CANVAS_WIDTH } from "../constants/app";
import { context, drawText } from "./canvas";

// Short in-game messages that replace blocking alert() dialogs. One toast
// shows at a time; a new one replaces the old.
const TOAST_DURATION_MS = 2500;
const TOAST_SIZE = 10;
const TOAST_Y = 372;
const TOAST_PADDING = 8;

const toast = { message: "", until: 0 };

export function showToast(message: string): void {
  toast.message = message.toUpperCase();
  toast.until = performance.now() + TOAST_DURATION_MS;
}

// Drawn last on every screen, as a dark bar centered near the bottom
export function drawToast(): void {
  if (performance.now() > toast.until) {
    return;
  }
  const width = toast.message.length * TOAST_SIZE;
  const x = (CANVAS_WIDTH - width) / 2;
  context.fillStyle = "rgba(0, 0, 0, 0.7)";
  context.fillRect(
    x - TOAST_PADDING,
    TOAST_Y - TOAST_PADDING,
    width + 2 * TOAST_PADDING,
    TOAST_SIZE + 2 * TOAST_PADDING
  );
  drawText(toast.message, x, TOAST_Y, { size: TOAST_SIZE, lineWidth: 2 });
}

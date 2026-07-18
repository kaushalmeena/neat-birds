export const canvas = document.getElementById("canvas");

export const context = canvas.getContext("2d");

// Draws pixel-font text with a black outline so it pops on any backdrop
export function drawText(
  text,
  x,
  y,
  { size = 14, lineWidth = 3, color = "white" } = {}
) {
  context.font = `${size}px PressStart2P`;
  context.lineJoin = "round";
  context.lineWidth = lineWidth;
  context.strokeStyle = "black";
  context.strokeText(text, x, y);
  context.fillStyle = color;
  context.fillText(text, x, y);
}

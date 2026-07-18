export const canvas = document.getElementById("canvas") as HTMLCanvasElement;

export const context = canvas.getContext("2d") as CanvasRenderingContext2D;

interface TextOptions {
  size?: number;
  lineWidth?: number;
  color?: string;
}

// Draws pixel-font text with a black outline so it pops on any backdrop
export function drawText(
  text: string | number,
  x: number,
  y: number,
  { size = 14, lineWidth = 3, color = "white" }: TextOptions = {}
): void {
  const value = String(text);
  context.font = `${size}px PressStart2P`;
  context.lineJoin = "round";
  context.lineWidth = lineWidth;
  context.strokeStyle = "black";
  context.strokeText(value, x, y);
  context.fillStyle = color;
  context.fillText(value, x, y);
}

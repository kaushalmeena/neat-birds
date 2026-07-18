// Returns random integer between min and max (inclusive)
export function getRandomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Returns random item from array
export function getRandomItem<T>(arr: T[]): T {
  return arr[getRandomInteger(0, arr.length - 1)];
}

// Checks if point lies inside rectangle
export function isPointInside(
  pX: number,
  pY: number,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number
): boolean {
  return pX > rectX && pX < rectX + rectW && pY > rectY && pY < rectY + rectH;
}

// Checks if two rectangle overlap each other
export function isRectangleOverlapping(
  rect1X: number,
  rect1Y: number,
  rect1W: number,
  rect1H: number,
  rect2X: number,
  rect2Y: number,
  rect2W: number,
  rect2H: number
): boolean {
  return !(
    rect1X + rect1W < rect2X ||
    rect2X + rect2W < rect1X ||
    rect1Y + rect1H < rect2Y ||
    rect2Y + rect2H < rect1Y
  );
}

// Returns normalized value between 0 and 1
export function normalizeValue(
  value: number,
  minValue: number,
  maxValue: number
): number {
  return (value - minValue) / (maxValue - minValue);
}

// Returns deep-copy of data
export function createCopy<T>(data: T): T {
  return structuredClone(data);
}

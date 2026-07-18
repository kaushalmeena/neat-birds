// Returns random integer between min and max (inclusive)
export function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Returns random item from array
export function getRandomItem(arr) {
  return arr[getRandomInteger(0, arr.length - 1)];
}

// Checks if point lies inside rectangle
export function isPointInside(pX, pY, rectX, rectY, rectW, rectH) {
  return pX > rectX && pX < rectX + rectW && pY > rectY && pY < rectY + rectH;
}

// Checks if two rectangle overlap each other
export function isRectangleOverlapping(
  rect1X,
  rect1Y,
  rect1W,
  rect1H,
  rect2X,
  rect2Y,
  rect2W,
  rect2H
) {
  return !(
    rect1X + rect1W < rect2X ||
    rect2X + rect2W < rect1X ||
    rect1Y + rect1H < rect2Y ||
    rect2Y + rect2H < rect1Y
  );
}

// Returns normalized value between 0 and 1
export function normalizeValue(value, minValue, maxValue) {
  return (value - minValue) / (maxValue - minValue);
}

// Returns deep-copy of data
export function createCopy(data) {
  return structuredClone(data);
}

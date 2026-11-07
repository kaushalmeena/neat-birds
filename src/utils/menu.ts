import { Action, CANVAS_WIDTH, Mode, TURBO_SPEED } from "../constants/app";
import type { MenuItem } from "../types";

// Pause menu layout. PressStart2P is monospaced, so a 24px glyph advances
// ~24px - used to horizontally center each label.
const ITEM_SIZE = 24;
const ITEM_START_Y = 180;
const ITEM_SPACING = 40;

// Builds the pause menu for the given mode. Standard mode has no brain to
// save, and autoplay's brain is chosen when the run starts, so only training
// exposes the save/load-state options.
export function getPauseMenuItems(mode: Mode): MenuItem[] {
  const items: { label: string; action: Action }[] = [
    { label: "RESUME", action: Action.RESUME_GAME }
  ];
  if (mode === Mode.TRAINING) {
    items.push({ label: "SAVE STATE", action: Action.SAVE_STATE });
    items.push({ label: "LOAD STATE", action: Action.LOAD_STATE });
  }
  items.push({ label: "QUIT", action: Action.QUIT_GAME });

  return items.map((item, index) => {
    const width = item.label.length * ITEM_SIZE;
    return {
      ...item,
      x: (CANVAS_WIDTH - width) / 2,
      y: ITEM_START_Y + index * ITEM_SPACING,
      width,
      height: ITEM_SIZE
    };
  });
}

// Training HUD buttons, stacked under the training panel on the right.
// PressStart2P advances ~1px per px of font size, so a label's width is
// its length times the size; the hit-box pads that by a few pixels.
export const TRAINING_BUTTON_SIZE = 14;
const TRAINING_BUTTON_X = 320;
const TRAINING_BUTTON_START_Y = 162;
const TRAINING_BUTTON_SPACING = 22;
const TRAINING_BUTTON_PADDING = 3;

export function getTrainingButtons(trainingSpeed: number): MenuItem[] {
  const speedLabel =
    trainingSpeed === TURBO_SPEED ? "MAX" : `${trainingSpeed}x`;
  const items: { label: string; action: Action }[] = [
    { label: `SPEED:${speedLabel}`, action: Action.CYCLE_SPEED },
    { label: "SAVE STATE", action: Action.SAVE_STATE },
    { label: "LOAD STATE", action: Action.LOAD_STATE }
  ];
  return items.map((item, index) => ({
    ...item,
    x: TRAINING_BUTTON_X,
    y: TRAINING_BUTTON_START_Y + index * TRAINING_BUTTON_SPACING,
    width: item.label.length * TRAINING_BUTTON_SIZE,
    height: TRAINING_BUTTON_SIZE
  }));
}

// Pads a menu item's box so small labels are easier to hit
export function isPointOnItem(
  x: number,
  y: number,
  item: MenuItem,
  padding = TRAINING_BUTTON_PADDING
): boolean {
  return (
    x > item.x - padding &&
    x < item.x + item.width + padding &&
    y > item.y - padding &&
    y < item.y + item.height + padding
  );
}

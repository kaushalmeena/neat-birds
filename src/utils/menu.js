import { ACTIONS, CANVAS_WIDTH, MODES } from "../constants/app";

// Pause menu layout. PressStart2P is monospaced, so a 24px glyph advances
// ~24px - used to horizontally center each label.
const ITEM_SIZE = 24;
const ITEM_START_Y = 180;
const ITEM_SPACING = 40;

// Builds the pause menu for the given mode. Standard mode has no brain to
// save, and autoplay's brain is chosen when the run starts, so only training
// exposes the save/load-state options.
export function getPauseMenuItems(mode) {
  const items = [{ label: "RESUME", action: ACTIONS.RESUME_GAME }];
  if (mode === MODES.TRAINING) {
    items.push({ label: "SAVE STATE", action: ACTIONS.SAVE_STATE });
    items.push({ label: "LOAD STATE", action: ACTIONS.LOAD_STATE });
  }
  items.push({ label: "QUIT", action: ACTIONS.QUIT_GAME });

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

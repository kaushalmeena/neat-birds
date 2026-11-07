import {
  Action,
  CANVAS_WIDTH,
  Mode,
  Screen,
  TURBO_SPEED
} from "../constants/app";
import type { MenuItem } from "../types";
import { drawText } from "./canvas";

// Every clickable label in the game is a MenuItem built here. Screens draw
// these lists and main.ts hit-tests the same lists, so a label and its
// click target can never drift apart.

const ITEM_COLOR = "#f7dc6f";
// Extra pixels around each label that still count as a hit
const HIT_PADDING = 3;

interface ItemSpec {
  label: string;
  action: Action;
}

interface StackLayout {
  // Left edge of every label; omit to center each label horizontally
  x?: number;
  y: number;
  size: number;
  spacing: number;
}

// Lays labels out in a vertical stack. PressStart2P is monospaced and a
// glyph advances ~1px per px of font size, so width = length × size.
function stack(specs: ItemSpec[], layout: StackLayout): MenuItem[] {
  return specs.map((spec, index) => {
    const width = spec.label.length * layout.size;
    return {
      ...spec,
      x: layout.x ?? (CANVAS_WIDTH - width) / 2,
      y: layout.y + index * layout.spacing,
      size: layout.size,
      width,
      height: layout.size
    };
  });
}

const MODE_ITEMS: [Mode, string, Action][] = [
  [Mode.STANDARD, "STANDARD MODE", Action.SELECT_STANDARD],
  [Mode.TRAINING, "TRAINING MODE", Action.SELECT_TRAINING],
  [Mode.AUTOPLAY, "AUTOPLAY MODE", Action.SELECT_AUTOPLAY]
];

// Title: the three modes (the selected one marked with ">") and START
export function getTitleItems(mode: Mode): MenuItem[] {
  const modes = MODE_ITEMS.map(([itemMode, label, action]) => ({
    label: `${itemMode === mode ? ">" : " "}${label}`,
    action
  }));
  return [
    ...stack(modes, { x: 130, y: 230, size: 16, spacing: 20 }),
    ...stack([{ label: "START", action: Action.START_GAME }], {
      y: 300,
      size: 24,
      spacing: 0
    })
  ];
}

// Pause menu. Training can watch its champion and save/load the run;
// autoplay can swap in another brain file.
export function getPauseItems(mode: Mode): MenuItem[] {
  const specs: ItemSpec[] = [{ label: "RESUME", action: Action.RESUME_GAME }];
  if (mode === Mode.TRAINING) {
    specs.push(
      { label: "WATCH BEST", action: Action.WATCH_BEST },
      { label: "SAVE STATE", action: Action.SAVE_STATE },
      { label: "LOAD STATE", action: Action.LOAD_STATE }
    );
  } else if (mode === Mode.AUTOPLAY) {
    specs.push({ label: "LOAD BRAIN", action: Action.LOAD_BRAIN });
  }
  specs.push({ label: "QUIT", action: Action.QUIT_GAME });
  return stack(specs, { y: 170, size: 24, spacing: 40 });
}

export function getDeathItems(): MenuItem[] {
  return stack(
    [
      { label: "RESTART", action: Action.RESTART_GAME },
      { label: "QUIT", action: Action.QUIT_GAME }
    ],
    { y: 250, size: 24, spacing: 40 }
  );
}

// Main screen: the PAUSE button, plus in training the HUD buttons stacked
// under the training panel on the right
export function getMainItems(mode: Mode, trainingSpeed: number): MenuItem[] {
  const pause = stack([{ label: "PAUSE", action: Action.PAUSE_GAME }], {
    x: 420,
    y: 10,
    size: 14,
    spacing: 0
  });
  if (mode !== Mode.TRAINING) {
    return pause;
  }
  const speedLabel =
    trainingSpeed === TURBO_SPEED ? "MAX" : `${trainingSpeed}x`;
  const training = stack(
    [
      { label: `SPEED:${speedLabel}`, action: Action.CYCLE_SPEED },
      { label: "SAVE STATE", action: Action.SAVE_STATE },
      { label: "LOAD STATE", action: Action.LOAD_STATE }
    ],
    { x: 320, y: 162, size: 14, spacing: 22 }
  );
  return [...pause, ...training];
}

// The clickable items on the given screen
export function getScreenItems(
  screen: Screen,
  mode: Mode,
  trainingSpeed: number
): MenuItem[] {
  switch (screen) {
    case Screen.TITLE:
      return getTitleItems(mode);
    case Screen.PAUSE:
      return getPauseItems(mode);
    case Screen.DEATH:
      return getDeathItems();
    case Screen.MAIN:
      return getMainItems(mode, trainingSpeed);
    default:
      return [];
  }
}

export function findItemAt(
  items: MenuItem[],
  x: number,
  y: number
): MenuItem | undefined {
  return items.find(
    (item) =>
      x > item.x - HIT_PADDING &&
      x < item.x + item.width + HIT_PADDING &&
      y > item.y - HIT_PADDING &&
      y < item.y + item.height + HIT_PADDING
  );
}

export function drawItems(items: MenuItem[]): void {
  for (const item of items) {
    drawText(item.label, item.x, item.y, {
      size: item.size,
      color: ITEM_COLOR
    });
  }
}

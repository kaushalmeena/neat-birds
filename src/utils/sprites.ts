import { BirdColor, Wing } from "../constants/bird";
import { PIPE_COLOR_COUNT } from "../constants/pipe";
import type { Sprite } from "../types";
import background1 from "../assets/sprites/Background1.png";
import background2 from "../assets/sprites/Background2.png";
import background3 from "../assets/sprites/Background3.png";
import background4 from "../assets/sprites/Background4.png";
import background5 from "../assets/sprites/Background5.png";
import background6 from "../assets/sprites/Background6.png";
import spritesheet from "../assets/sprites/Spritesheet.png";

// All art comes from the CC0 "Flappy Bird Assets" pack by Megacrash

const spritesheetImage = new Image();
spritesheetImage.src = spritesheet;

function createImage(src: string): HTMLImageElement {
  const image = new Image();
  image.src = src;
  return image;
}

// Scrolling backdrops (256x256): green/orange/brown canyons,
// then sunset, day and dusk cities
export const backgroundImages: HTMLImageElement[] = [
  background1,
  background2,
  background3,
  background4,
  background5,
  background6
].map(createImage);

export const groundSprite: Sprite = {
  image: spritesheetImage,
  sx: 96,
  sy: 288,
  sWidth: 16,
  sHeight: 16
};

// One 32x272 pipe per color, in LOWER orientation (cap at top);
// UPPER pipes are drawn rotated 180 degrees
export const pipeSprites: Sprite[] = Array.from(
  { length: PIPE_COLOR_COUNT },
  (_, index) => ({
    image: spritesheetImage,
    sx: index * 32,
    sy: 0,
    sWidth: 32,
    sHeight: 272
  })
);

// Bird frames are laid out 4 colors per 16px row, wings-UP then
// wings-DOWN per color, starting at y=272
const BIRD_COLOR_ORDER: BirdColor[] = [
  BirdColor.ORANGE,
  BirdColor.BLUE,
  BirdColor.RED,
  BirdColor.GREEN,
  BirdColor.BROWN,
  BirdColor.GRAY,
  BirdColor.PURPLE
];

export const birdSprites = Object.fromEntries(
  BIRD_COLOR_ORDER.map((color, index) => {
    const sx = (index % 4) * 32;
    const sy = 272 + Math.floor(index / 4) * 16;
    return [
      color,
      {
        [Wing.UP]: {
          image: spritesheetImage,
          sx,
          sy,
          sWidth: 16,
          sHeight: 16
        },
        [Wing.DOWN]: {
          image: spritesheetImage,
          sx: sx + 16,
          sy,
          sWidth: 16,
          sHeight: 16
        }
      }
    ];
  })
) as Record<BirdColor, Record<Wing, Sprite>>;

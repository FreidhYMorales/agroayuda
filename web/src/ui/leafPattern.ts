import { COLORS } from "./colors";

// Faint leaves and sprouts over the warm page color, drawn here as an inline SVG tile:
// no file to download and no licence to track. Outline only, at low opacity, so text
// on the page keeps its contrast (checked in leafPattern.test.ts). White cards cover it.
export const LEAF_INK = COLORS.primary;
export const LEAF_OPACITY = 0.08;

const TILE = 160;

// Each shape is a leaf (two curves and a midrib) or a sprout, placed and turned by hand.
const SHAPES = [
  // Leaf, top left.
  "<g transform='translate(28 30) rotate(-30)'><path d='M0 18C-10 6-6-12 0-18 6-12 10 6 0 18Z'/><path d='M0 16V-14'/></g>",
  // Sprout, top right.
  "<g transform='translate(118 38)'><path d='M0 14V-2'/><path d='M0 0C-2-8-10-10-14-8-12-2-6 2 0 0Z'/><path d='M0-2C2-10 10-12 14-10 12-4 6 0 0-2Z'/></g>",
  // Leaf, middle.
  "<g transform='translate(80 92) rotate(40)'><path d='M0 14C-8 4-5-9 0-14 5-9 8 4 0 14Z'/><path d='M0 12V-11'/></g>",
  // Small leaf, bottom left.
  "<g transform='translate(30 128) rotate(70)'><path d='M0 11C-6 3-4-7 0-11 4-7 6 3 0 11Z'/></g>",
  // Sprout, bottom right.
  "<g transform='translate(136 130) rotate(15)'><path d='M0 12V0'/><path d='M0 2C-2-5-8-7-11-5-9 0-5 3 0 2Z'/><path d='M0 0C2-6 8-8 11-6 9-1 5 1 0 0Z'/></g>",
].join("");

const SVG =
  `<svg xmlns='http://www.w3.org/2000/svg' width='${TILE}' height='${TILE}' viewBox='0 0 ${TILE} ${TILE}'>` +
  `<g fill='none' stroke='${LEAF_INK}' stroke-opacity='${LEAF_OPACITY}' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'>` +
  `${SHAPES}</g></svg>`;

/** CSS `background-image` value for the leaf tile. */
export const LEAF_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(SVG)}")`;

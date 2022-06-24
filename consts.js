// game states
const GameModes = {
  STARTUP: 0,
  MAIN_MENU: 1,
  GAMEPLAY: 2,
  DIALOG: 3,
  DEAD: 4,
};

// size of sprites on the tilesheet
const spriteSize = 16;

// sprite lookup + ascii representations
const Tiles = {
  player: { c: 35, r: 14, ascii: "@", color: "#ffffff" },
  human: { c: 26, r: 9, ascii: "H", color: "#ff00ff" },
  town: { c: 1, r: 21, ascii: "T", color: "#FFA500" },
  dungeon: { c: 3, r: 6, ascii: "D", color: "#FFA500" },
  dirt1: { c: 2, r: 0, ascii: ".", color: "#a0522d" },
  grass1: { c: 5, r: 0, ascii: ".", color: "#1a5b02" },
  grass2: { c: 6, r: 0, ascii: ".", color: "#2c7c0e" },
  grass3: { c: 7, r: 0, ascii: ".", color: "#56af36" },
  tree1: { c: 0, r: 1, ascii: "⇑", color: "#203a16" },
  tree2: { c: 1, r: 1, ascii: "⥣", color: "#2c6318" },
  tree3: { c: 2, r: 1, ascii: "⤉", color: "#5f9e48" },
  tree4: { c: 3, r: 1, ascii: "⇈", color: "#46cc16" },
  tree5: { c: 4, r: 1, ascii: "▲", color: "#103004" },
  tree6: { c: 5, r: 1, ascii: "⇞", color: "#3d632f" },
  tree7: { c: 3, r: 1, ascii: "⇧", color: "#47d613" },
  tree8: { c: 4, r: 1, ascii: "⇮", color: "#82e25f" },
  space1: { c: 0, r: 22, ascii: " ", color: "#000000" },
  space2: { c: 1, r: 22, ascii: " ", color: "#222222" },
  bones: { c: 0, r: 15, ascii: "%", color: "#333333" },
  enemy: { c: 25, r: 2, ascii: "o", color: "#ff0000" },
  npc: { c: 25, r: 1, ascii: "N", color: "#00ff00" },
};

const TREES = [
  Tiles.tree1,
  Tiles.tree2,
  Tiles.tree3,
  Tiles.tree4,
  Tiles.tree5,
  Tiles.tree6,
  Tiles.tree7,
  Tiles.tree8
];

// is this something we can walk over?
const WALKABLE = [
  Tiles.town,
  Tiles.dungeon,
  Tiles.grass1,
  Tiles.grass2,
  Tiles.grass3,
  Tiles.dirt1,
  //debug
  // Tiles.space1,
  // Tiles.space2,
  // Tiles.tree1,
  // Tiles.tree2,
  // Tiles.tree3,
  // Tiles.tree4,
  // Tiles.tree5,
  // Tiles.tree6,
  // Tiles.tree7,
  // Tiles.tree8,
];

// surround with paths -- better way?
const SURROUND_WITH_PATH = [
  Tiles.tree1,
  Tiles.tree2,
  Tiles.tree3,
  Tiles.tree4,
  Tiles.tree5,
  Tiles.tree6,
  Tiles.tree7,
  Tiles.tree8,
  Tiles.town,
];

const WEAPON_TYPES = {
  MELEE: 0,
  BLUNT: 1,
};
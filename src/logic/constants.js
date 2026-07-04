// ============================================================
// constants.js — Tetris Guideline Constants
// All data follows the official Tetris Guideline specification.
// ============================================================

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;        // Visible rows
export const BOARD_HEIGHT_BUFFER = 20; // Hidden buffer rows above
export const BOARD_HEIGHT_TOTAL = BOARD_HEIGHT + BOARD_HEIGHT_BUFFER; // 40

export const PIECE_TYPES = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

// Standard Guideline colors
export const PIECE_COLORS = {
  I: '#00FFFF', // Cyan
  J: '#0000FF', // Blue
  L: '#FF8800', // Orange
  O: '#FFFF00', // Yellow
  S: '#00FF00', // Green
  T: '#AA00FF', // Purple
  Z: '#FF0000', // Red
};

// ============================================================
// PIECE SHAPES
// Each piece has 4 rotation states (0, 1, 2, 3).
// Coordinates are [row, col] offsets relative to a bounding box.
// Using the official Tetris Guideline rotation states.
// ============================================================
export const PIECE_SHAPES = {
  I: [
    [[2, 0], [2, 1], [2, 2], [2, 3]],
    [[0, 2], [1, 2], [2, 2], [3, 2]],
    [[1, 0], [1, 1], [1, 2], [1, 3]],
    [[0, 1], [1, 1], [2, 1], [3, 1]],
  ],
  J: [
    [[1, 0], [1, 1], [1, 2], [2, 0]],
    [[0, 1], [1, 1], [2, 1], [2, 2]],
    [[0, 2], [1, 0], [1, 1], [1, 2]],
    [[0, 0], [0, 1], [1, 1], [2, 1]],
  ],
  L: [
    [[1, 0], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [0, 2], [1, 1], [2, 1]],
    [[0, 0], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 1], [2, 0], [2, 1]],
  ],
  O: [
    [[1, 1], [1, 2], [2, 1], [2, 2]],
    [[1, 1], [1, 2], [2, 1], [2, 2]],
    [[1, 1], [1, 2], [2, 1], [2, 2]],
    [[1, 1], [1, 2], [2, 1], [2, 2]],
  ],
  S: [
    [[1, 0], [1, 1], [2, 1], [2, 2]],
    [[0, 2], [1, 1], [1, 2], [2, 1]],
    [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 1], [1, 0], [1, 1], [2, 0]],
  ],
  T: [
    [[1, 0], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 1], [1, 2], [2, 1]],
    [[0, 1], [1, 0], [1, 1], [1, 2]],
    [[0, 1], [1, 0], [1, 1], [2, 1]],
  ],
  Z: [
    [[1, 1], [1, 2], [2, 0], [2, 1]],
    [[0, 1], [1, 1], [1, 2], [2, 2]],
    [[0, 1], [0, 2], [1, 0], [1, 1]],
    [[0, 0], [1, 0], [1, 1], [2, 1]],
  ],
};

// ============================================================
// SRS WALL KICK DATA
// Official Tetris Guideline wall kick offsets.
// Format: { 'fromState>toState': [[dx, dy], ...] }
// dx = column offset (positive = right), dy = row offset (positive = up)
// Each transition tests 5 offsets (including the identity [0,0] test).
// ============================================================

// Wall kicks for J, L, S, T, Z pieces
export const SRS_WALL_KICKS_JLSTZ = {
  '0>1': [[ 0, 0], [-1, 0], [-1, 1], [ 0,-2], [-1,-2]],
  '1>0': [[ 0, 0], [ 1, 0], [ 1,-1], [ 0, 2], [ 1, 2]],
  '1>2': [[ 0, 0], [ 1, 0], [ 1,-1], [ 0, 2], [ 1, 2]],
  '2>1': [[ 0, 0], [-1, 0], [-1, 1], [ 0,-2], [-1,-2]],
  '2>3': [[ 0, 0], [ 1, 0], [ 1, 1], [ 0,-2], [ 1,-2]],
  '3>2': [[ 0, 0], [-1, 0], [-1,-1], [ 0, 2], [-1, 2]],
  '3>0': [[ 0, 0], [-1, 0], [-1,-1], [ 0, 2], [-1, 2]],
  '0>3': [[ 0, 0], [ 1, 0], [ 1, 1], [ 0,-2], [ 1,-2]],
};

// Wall kicks for I piece (different from JLSTZ)
export const SRS_WALL_KICKS_I = {
  '0>1': [[ 0, 0], [-2, 0], [ 1, 0], [-2,-1], [ 1, 2]],
  '1>0': [[ 0, 0], [ 2, 0], [-1, 0], [ 2, 1], [-1,-2]],
  '1>2': [[ 0, 0], [-1, 0], [ 2, 0], [-1, 2], [ 2,-1]],
  '2>1': [[ 0, 0], [ 1, 0], [-2, 0], [ 1,-2], [-2, 1]],
  '2>3': [[ 0, 0], [ 2, 0], [-1, 0], [ 2, 1], [-1,-2]],
  '3>2': [[ 0, 0], [-2, 0], [ 1, 0], [-2,-1], [ 1, 2]],
  '3>0': [[ 0, 0], [ 1, 0], [-2, 0], [ 1,-2], [-2, 1]],
  '0>3': [[ 0, 0], [-1, 0], [ 2, 0], [-1, 2], [ 2,-1]],
};

// ============================================================
// HANDLING / TUNING DEFAULTS (matching TETR.IO defaults)
// ============================================================
export const DEFAULT_DAS = 133;       // ms — Delayed Auto Shift
export const DEFAULT_ARR = 0;         // ms — Auto Repeat Rate (0 = instant)
export const DEFAULT_SDF = 41;        // Soft Drop Factor (41 = infinity in TETR.IO)
export const SDF_INFINITY = 41;       // TETR.IO uses 41 as "infinity"

// ============================================================
// LOCK DELAY
// ============================================================
export const LOCK_DELAY = 500;        // ms before piece locks after landing
export const MAX_LOCK_RESETS = 15;    // Max times lock timer can be reset by movement

// ============================================================
// GRAVITY (frames per cell drop at 60fps)
// Lower number = faster. Level 0 starts slow.
// ============================================================
export const GRAVITY_SPEEDS = [
  800,  // Level 0  — 800ms per drop
  720,  // Level 1
  630,  // Level 2
  550,  // Level 3
  470,  // Level 4
  380,  // Level 5
  300,  // Level 6
  220,  // Level 7
  130,  // Level 8
  100,  // Level 9
  80,   // Level 10
  60,   // Level 11
  50,   // Level 12
  40,   // Level 13
  30,   // Level 14
  20,   // Level 15+
];

// Spawn position (column offset for piece bounding box)
export const SPAWN_COL = 3; // Pieces spawn centered (col 3 for most, adjusted for I/O)
export const SPAWN_ROW = BOARD_HEIGHT; // Spawn just above visible area (row 20 in 0-indexed from bottom)

// Spawn column adjustments per piece type
export const SPAWN_COL_OFFSET = {
  I: 3, J: 3, L: 3, O: 3, S: 3, T: 3, Z: 3,
};

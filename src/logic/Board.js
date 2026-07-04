// ============================================================
// Board.js — Tetris Game Board (Matrix)
// 10 columns x 40 rows (20 visible + 20 buffer above).
// Each cell is null (empty) or a color string.
// ============================================================

import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  BOARD_HEIGHT_TOTAL,
  PIECE_SHAPES,
  PIECE_COLORS,
} from './constants.js';

export class Board {
  constructor() {
    this.grid = this._createEmptyGrid();
  }

  /**
   * Create an empty grid (40 rows x 10 cols).
   * Row 0 = bottom of the board, Row 39 = top of buffer.
   */
  _createEmptyGrid() {
    const grid = [];
    for (let row = 0; row < BOARD_HEIGHT_TOTAL; row++) {
      grid.push(new Array(BOARD_WIDTH).fill(null));
    }
    return grid;
  }

  /**
   * Get the cells occupied by a piece at a given position and rotation.
   * @param {string} pieceType - e.g. 'T'
   * @param {number} col - Left edge column of the piece bounding box
   * @param {number} row - Bottom edge row of the piece bounding box
   * @param {number} rotation - 0, 1, 2, or 3
   * @returns {Array<[number, number]>} Array of [row, col] positions on the board
   */
  getPieceCells(pieceType, col, row, rotation) {
    const shape = PIECE_SHAPES[pieceType][rotation];
    return shape.map(([dr, dc]) => [row + dr, col + dc]);
  }

  /**
   * Check if a piece placement is valid (no collision, within bounds).
   */
  isValid(pieceType, col, row, rotation) {
    const cells = this.getPieceCells(pieceType, col, row, rotation);
    for (const [r, c] of cells) {
      // Check horizontal bounds
      if (c < 0 || c >= BOARD_WIDTH) return false;
      // Check bottom bound
      if (r < 0) return false;
      // Check top bound (allow above visible area, but not above total)
      if (r >= BOARD_HEIGHT_TOTAL) return false;
      // Check collision with locked cells
      if (this.grid[r][c] !== null) return false;
    }
    return true;
  }

  /**
   * Lock a piece onto the board.
   * @returns {Array<[number, number]>} The cells that were locked
   */
  lock(pieceType, col, row, rotation) {
    const color = PIECE_COLORS[pieceType];
    const cells = this.getPieceCells(pieceType, col, row, rotation);
    for (const [r, c] of cells) {
      if (r >= 0 && r < BOARD_HEIGHT_TOTAL && c >= 0 && c < BOARD_WIDTH) {
        this.grid[r][c] = color;
      }
    }
    return cells;
  }

  /**
   * Detect and clear completed lines.
   * @returns {number} Number of lines cleared
   */
  clearLines() {
    let linesCleared = 0;
    // Check from bottom to top
    for (let row = 0; row < BOARD_HEIGHT_TOTAL; row++) {
      if (this.grid[row].every(cell => cell !== null)) {
        // Remove the completed row
        this.grid.splice(row, 1);
        // Add an empty row at the top
        this.grid.push(new Array(BOARD_WIDTH).fill(null));
        linesCleared++;
        // Re-check same row index since rows shifted down
        row--;
      }
    }
    return linesCleared;
  }

  /**
   * Calculate ghost piece Y position (lowest valid row).
   */
  getGhostRow(pieceType, col, row, rotation) {
    let ghostRow = row;
    while (this.isValid(pieceType, col, ghostRow - 1, rotation)) {
      ghostRow--;
    }
    return ghostRow;
  }

  /**
   * Get the visible portion of the grid (bottom 20 rows).
   * Returns rows from bottom (index 0) to top (index 19).
   */
  getVisibleGrid() {
    return this.grid.slice(0, BOARD_HEIGHT);
  }

  /**
   * Check if any cell in the top visible rows is occupied
   * (used for top-out / game over detection).
   */
  isTopOut() {
    for (let row = BOARD_HEIGHT; row < BOARD_HEIGHT_TOTAL; row++) {
      if (this.grid[row].some(cell => cell !== null)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Reset the board to empty state.
   */
  reset() {
    this.grid = this._createEmptyGrid();
  }
}

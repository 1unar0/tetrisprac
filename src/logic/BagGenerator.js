// ============================================================
// BagGenerator.js — 7-Bag Random Generator (Tetris Guideline)
// Generates pieces in bags of 7, each bag contains exactly
// one of each piece type, shuffled using Fisher-Yates.
// ============================================================

import { PIECE_TYPES } from './constants.js';

export class BagGenerator {
  constructor() {
    this.queue = [];
    this._fillQueue();
  }

  /**
   * Fisher-Yates (Knuth) shuffle — unbiased in-place shuffle.
   * This is the standard algorithm used by TETR.IO and all
   * Guideline-compliant Tetris implementations.
   */
  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate a new bag of 7 shuffled pieces and append to queue.
   */
  _generateBag() {
    const bag = [...PIECE_TYPES]; // ['I', 'J', 'L', 'O', 'S', 'T', 'Z']
    this._shuffle(bag);
    return bag;
  }

  /**
   * Ensure queue always has enough pieces for peek operations.
   * We keep at least 14 pieces (2 full bags) so we can always
   * peek 5+ pieces ahead.
   */
  _fillQueue() {
    while (this.queue.length < 14) {
      this.queue.push(...this._generateBag());
    }
  }

  /**
   * Get and consume the next piece from the queue.
   * @returns {string} Piece type ('I', 'J', 'L', etc.)
   */
  next() {
    const piece = this.queue.shift();
    this._fillQueue();
    return piece;
  }

  /**
   * Peek at the next N pieces without consuming them.
   * Used to display the Next Queue.
   * @param {number} n - Number of pieces to peek
   * @returns {string[]} Array of piece types
   */
  peek(n = 5) {
    this._fillQueue();
    return this.queue.slice(0, n);
  }

  /**
   * Reset the generator (new game).
   */
  reset() {
    this.queue = [];
    this._fillQueue();
  }
}

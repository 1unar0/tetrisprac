// ============================================================
// GameState.js — Main Game State Manager
// Ties together Board, BagGenerator, piece movement, rotation
// with SRS wall kicks, hold system, lock delay, and scoring.
// ============================================================

import { Board } from './Board.js';
import { BagGenerator } from './BagGenerator.js';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PIECE_SHAPES,
  PIECE_COLORS,
  SRS_WALL_KICKS_JLSTZ,
  SRS_WALL_KICKS_I,
  LOCK_DELAY,
  MAX_LOCK_RESETS,
  GRAVITY_SPEEDS,
  SPAWN_COL_OFFSET,
} from './constants.js';

export class GameState {
  constructor() {
    this.board = new Board();
    this.bag = new BagGenerator();
    this.reset();
  }

  /**
   * Reset to a fresh game state.
   */
  reset() {
    this.board.reset();
    this.bag.reset();

    // Current piece state
    this.currentPiece = null;
    this.currentCol = 0;
    this.currentRow = 0;
    this.currentRotation = 0;

    // Hold piece
    this.holdPiece = null;
    this.holdUsed = false; // Can only hold once per piece drop

    // Stats
    this.linesCleared = 0;
    this.level = 0;
    this.score = 0;
    this.piecesPlaced = 0;

    // Game state flags
    this.gameOver = false;
    this.paused = false;
    this.lastMoveWasRotation = false;
    this.lastRotationKick = 0;
    this.lastActionText = '';

    // Lock delay tracking
    this.lockTimer = 0;
    this.lockResets = 0;
    this.isOnGround = false;

    // Undo/Redo tracking
    this.history = [];
    this.redoStack = [];

    // Combo and B2B
    this.combo = 0;
    this.b2b = 0;

    // Gravity
    this.gravityTimer = 0;

    // Timer
    this.elapsedTime = 0;

    // Spawn first piece
    this._spawnPiece();
  }

  // ============================================================
  // UNDO / REDO
  // ============================================================

  _saveSnapshot() {
    return {
      grid: JSON.parse(JSON.stringify(this.board.grid)),
      bagQueue: [...this.bag.queue],
      score: this.score,
      level: this.level,
      linesCleared: this.linesCleared,
      piecesPlaced: this.piecesPlaced,
      holdPiece: this.holdPiece,
      holdUsed: this.holdUsed,
      currentPiece: this.currentPiece,
      currentCol: this.currentCol,
      currentRow: this.currentRow,
      currentRotation: this.currentRotation,
      elapsedTime: this.elapsedTime,
      b2b: this.b2b,
      combo: this.combo,
      lastActionText: this.lastActionText
    };
  }

  _loadSnapshot(snapshot) {
    this.board.grid = JSON.parse(JSON.stringify(snapshot.grid));
    this.bag.queue = [...snapshot.bagQueue];
    this.score = snapshot.score;
    this.level = snapshot.level;
    this.linesCleared = snapshot.linesCleared;
    this.piecesPlaced = snapshot.piecesPlaced;
    this.holdPiece = snapshot.holdPiece;
    this.holdUsed = snapshot.holdUsed;
    this.currentPiece = snapshot.currentPiece;
    this.currentCol = snapshot.currentCol;
    this.currentRow = snapshot.currentRow;
    this.currentRotation = snapshot.currentRotation;
    this.elapsedTime = snapshot.elapsedTime;
    this.b2b = snapshot.b2b || 0;
    this.combo = snapshot.combo || 0;
    this.lastActionText = snapshot.lastActionText || '';
    
    // Reset drop states
    this.isOnGround = false;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.gameOver = false;
  }

  _pushHistory() {
    this.history.push(this._saveSnapshot());
    if (this.history.length > 100) this.history.shift(); // Max 100 undos
    this.redoStack = []; // Clear redo stack on new action
  }

  undo() {
    if (this.gameOver || this.paused || this.history.length === 0) return false;
    this.redoStack.push(this._saveSnapshot());
    this._loadSnapshot(this.history.pop());
    return true;
  }

  redo() {
    if (this.gameOver || this.paused || this.redoStack.length === 0) return false;
    this.history.push(this._saveSnapshot());
    this._loadSnapshot(this.redoStack.pop());
    return true;
  }

  /**
   * Spawn the next piece from the bag.
   * Piece spawns at the top of the visible area.
   */
  _spawnPiece() {
    const type = this.bag.next();
    this.currentPiece = type;
    this.currentRotation = 0;
    this.currentCol = SPAWN_COL_OFFSET[type];

    // Spawn row: Standard Guideline spawn row for our coordinate system
    this.currentRow = 18;

    // Reset lock delay
    this.lockTimer = 0;
    this.lockResets = 0;
    this.isOnGround = false;
    this.holdUsed = false;

    // Check if spawn position is valid — if not, try one row higher, else game over
    if (!this.board.isValid(type, this.currentCol, this.currentRow, 0)) {
      this.currentRow = 19;
      if (!this.board.isValid(type, this.currentCol, this.currentRow, 0)) {
        this.gameOver = true;
      }
    }
    this._pushHistory();
  }

  // ============================================================
  // MOVEMENT
  // ============================================================

  /**
   * Move piece left. Returns true if successful.
   */
  moveLeft() {
    if (this.gameOver || this.paused || !this.currentPiece) return false;
    if (this.board.isValid(this.currentPiece, this.currentCol - 1, this.currentRow, this.currentRotation)) {
      this.currentCol--;
      this.lastMoveWasRotation = false;
      this._onSuccessfulMove();
      return true;
    }
    return false;
  }

  /**
   * Move piece right. Returns true if successful.
   */
  moveRight() {
    if (this.gameOver || this.paused || !this.currentPiece) return false;
    if (this.board.isValid(this.currentPiece, this.currentCol + 1, this.currentRow, this.currentRotation)) {
      this.currentCol++;
      this.lastMoveWasRotation = false;
      this._onSuccessfulMove();
      return true;
    }
    return false;
  }

  /**
   * Move piece down by 1 cell. Returns true if successful.
   * If softDrop is true, awards 1 point per cell.
   */
  moveDown(softDrop = false) {
    if (this.gameOver || this.paused || !this.currentPiece) return false;
    if (this.board.isValid(this.currentPiece, this.currentCol, this.currentRow - 1, this.currentRotation)) {
      this.currentRow--;
      this.lastMoveWasRotation = false;
      if (softDrop) this.score += 1;
      // If moved off ground, reset lock state
      this.isOnGround = false;
      this.lockTimer = 0;
      return true;
    }
    // Can't move down — piece is on the ground
    this.isOnGround = true;
    return false;
  }

  /**
   * Hard drop: instantly drop to ghost position and lock.
   */
  hardDrop() {
    if (this.gameOver || this.paused || !this.currentPiece) return;
    const ghostRow = this.board.getGhostRow(
      this.currentPiece, this.currentCol, this.currentRow, this.currentRotation
    );
    const distance = this.currentRow - ghostRow;
    this.score += distance * 2; // 2 points per cell dropped
    this.currentRow = ghostRow;
    this.lastMoveWasRotation = false;
    this._lockPiece();
  }

  /**
   * Sonic drop: instantly drop to ghost position WITHOUT locking.
   * Used when SDF = infinity.
   */
  sonicDrop() {
    if (this.gameOver || this.paused || !this.currentPiece) return;
    const ghostRow = this.board.getGhostRow(
      this.currentPiece, this.currentCol, this.currentRow, this.currentRotation
    );
    const distance = this.currentRow - ghostRow;
    this.score += distance; // 1 point per cell dropped (soft drop points)
    this.currentRow = ghostRow;
    this.isOnGround = true;
    this.lastMoveWasRotation = false;
  }

  // ============================================================
  // ROTATION (SRS with Wall Kicks)
  // ============================================================

  /**
   * Rotate piece clockwise. Returns true if successful.
   */
  rotateCW() {
    return this._rotate((this.currentRotation + 1) % 4);
  }

  /**
   * Rotate piece counter-clockwise. Returns true if successful.
   */
  rotateCCW() {
    return this._rotate((this.currentRotation + 3) % 4);
  }

  /**
   * Rotate piece 180 degrees. Returns true if successful.
   */
  rotate180() {
    // 180 rotation: try without wall kicks first (no official 180 kick data)
    const newRotation = (this.currentRotation + 2) % 4;
    if (this.board.isValid(this.currentPiece, this.currentCol, this.currentRow, newRotation)) {
      this.currentRotation = newRotation;
      this.lastMoveWasRotation = true;
      this.lastRotationKick = 0;
      this._onSuccessfulMove();
      return true;
    }
    // Try basic shifts as a simple 180 kick table
    const kicks180 = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0]];
    let kickIndex = 0;
    for (const [dx, dy] of kicks180) {
      if (this.board.isValid(this.currentPiece, this.currentCol + dx, this.currentRow + dy, newRotation)) {
        this.currentCol += dx;
        this.currentRow += dy;
        this.currentRotation = newRotation;
        this.lastMoveWasRotation = true;
        this.lastRotationKick = kickIndex;
        this._onSuccessfulMove();
        return true;
      }
      kickIndex++;
    }
    return false;
  }

  /**
   * Attempt rotation with SRS wall kick testing.
   * @param {number} newRotation - Target rotation state (0-3)
   * @returns {boolean} true if rotation succeeded
   */
  _rotate(newRotation) {
    if (this.gameOver || this.paused || !this.currentPiece) return false;
    if (this.currentPiece === 'O') return false; // O piece doesn't rotate

    const kickKey = `${this.currentRotation}>${newRotation}`;
    const kickTable = this.currentPiece === 'I'
      ? SRS_WALL_KICKS_I
      : SRS_WALL_KICKS_JLSTZ;

    const kicks = kickTable[kickKey];
    if (!kicks) return false;

    // Test each kick offset
    let kickIndex = 0;
    for (const [dx, dy] of kicks) {
      if (this.board.isValid(this.currentPiece, this.currentCol + dx, this.currentRow + dy, newRotation)) {
        this.currentCol += dx;
        this.currentRow += dy;
        this.currentRotation = newRotation;
        this.lastMoveWasRotation = true;
        this.lastRotationKick = kickIndex;
        this._onSuccessfulMove();
        return true;
      }
      kickIndex++;
    }
    return false;
  }

  // ============================================================
  // HOLD
  // ============================================================

  /**
   * Hold the current piece. Swap with held piece if one exists.
   */
  hold() {
    if (this.gameOver || this.paused || !this.currentPiece || this.holdUsed) return;

    this.holdUsed = true;
    const current = this.currentPiece;

    if (this.holdPiece) {
      // Swap with held piece
      this.currentPiece = this.holdPiece;
      this.holdPiece = current;
      // Reset position for swapped piece
      this.currentRotation = 0;
      this.currentCol = SPAWN_COL_OFFSET[this.currentPiece];
      this.currentRow = 18;

      if (!this.board.isValid(this.currentPiece, this.currentCol, this.currentRow, 0)) {
        this.currentRow = 19;
        if (!this.board.isValid(this.currentPiece, this.currentCol, this.currentRow, 0)) {
          this.gameOver = true;
        }
      }

      this.lockTimer = 0;
      this.lockResets = 0;
      this.isOnGround = false;
      this._pushHistory();
    } else {
      // No held piece — store current and spawn next
      this.holdPiece = current;
      this._spawnPiece();
    }
  }

  // ============================================================
  // LOCK & LINE CLEAR
  // ============================================================

  /**
   * Lock the current piece onto the board and handle line clears.
   */
  _lockPiece() {
    if (!this.currentPiece) return;

    let spinType = null; // 'mini', 'full', or null

    if (this.lastMoveWasRotation) {
      if (this.currentPiece === 'T') {
        // T-Spin 3-corner rule
        let corners = 0;
        const cornerCoords = [
          [0, 0], [0, 2], [2, 0], [2, 2]
        ];
        
        let flatCorners = 0;
        let prongCorners = 0;
        
        for (const [r, c] of cornerCoords) {
           const boardR = this.currentRow + r;
           const boardC = this.currentCol + c;
           // If out of bounds or filled with block, it counts as a corner
           const isBlocked = boardR < 0 || boardR >= BOARD_HEIGHT_TOTAL || boardC < 0 || boardC >= BOARD_WIDTH || this.board.grid[boardR][boardC];
           if (isBlocked) {
             corners++;
             // determine if it's a flat corner
             let isFlat = false;
             if (this.currentRotation === 0 && (r === 0)) isFlat = true;
             else if (this.currentRotation === 1 && (c === 0)) isFlat = true;
             else if (this.currentRotation === 2 && (r === 2)) isFlat = true;
             else if (this.currentRotation === 3 && (c === 2)) isFlat = true;
             
             if (isFlat) flatCorners++;
             else prongCorners++;
           }
        }
        
        if (corners >= 3) {
          if (flatCorners === 2 || this.lastRotationKick === 4) {
            spinType = 'full';
          } else {
            spinType = 'mini';
          }
        }
      } else {
        // All-spin immobile rule
        const canMoveLeft = this.board.isValid(this.currentPiece, this.currentCol - 1, this.currentRow, this.currentRotation);
        const canMoveRight = this.board.isValid(this.currentPiece, this.currentCol + 1, this.currentRow, this.currentRotation);
        const canMoveUp = this.board.isValid(this.currentPiece, this.currentCol, this.currentRow + 1, this.currentRotation);
        const canMoveDown = this.board.isValid(this.currentPiece, this.currentCol, this.currentRow - 1, this.currentRotation);
        if (!canMoveLeft && !canMoveRight && !canMoveUp && !canMoveDown) {
          spinType = 'full'; // All spins are considered full for non-T pieces
        }
      }
    }

    // Lock piece onto board
    this.board.lock(this.currentPiece, this.currentCol, this.currentRow, this.currentRotation);
    this.piecesPlaced++;

    // Clear lines
    const cleared = this.board.clearLines();
    
    // Calculate Score & B2B
    let actionText = '';
    
    if (cleared > 0) {
      this.linesCleared += cleared;
      this.level = Math.floor(this.linesCleared / 10);
      
      const isDifficult = (cleared === 4) || (spinType !== null);
      const b2bMultiplier = (this.b2b > 0 && isDifficult) ? 1.5 : 1.0;
      
      let baseScore = 0;
      if (spinType === 'full') {
         if (this.currentPiece === 'T') {
           const scores = { 1: 800, 2: 1200, 3: 1600 };
           baseScore = scores[cleared] || 0;
           actionText = `T-SPIN ${['SINGLE', 'DOUBLE', 'TRIPLE'][cleared-1]}`;
         } else {
           const scores = { 1: 400, 2: 800, 3: 1200 };
           baseScore = scores[cleared] || 0;
           actionText = `${this.currentPiece}-SPIN ${['SINGLE', 'DOUBLE', 'TRIPLE'][cleared-1]}`;
         }
      } else if (spinType === 'mini') {
         // T-spin mini
         const scores = { 1: 200, 2: 400 }; 
         baseScore = scores[cleared] || 0;
         actionText = `T-SPIN MINI ${['SINGLE', 'DOUBLE'][cleared-1] || ''}`;
      } else {
         const scores = { 1: 100, 2: 300, 3: 500, 4: 800 };
         baseScore = scores[cleared] || 0;
         if (cleared === 4) actionText = 'TETRIS';
      }
      
      this.score += Math.floor(baseScore * b2bMultiplier * (this.level + 1));
      
      if (this.b2b > 0 && isDifficult) {
         actionText = `B2B ${actionText}`;
      }
      
      this.score += this.combo * 50 * (this.level + 1);
      
      if (isDifficult) {
         this.b2b++;
      } else {
         this.b2b = 0;
      }
      
      if (this.combo > 0 && actionText) {
         actionText += `\nCOMBO ${this.combo}`;
      } else if (this.combo > 0) {
         actionText = `COMBO ${this.combo}`;
      }
      this.combo++;
      
    } else {
      // No lines cleared
      if (spinType === 'full') {
        this.score += 400 * (this.level + 1);
        actionText = this.currentPiece === 'T' ? 'T-SPIN' : `${this.currentPiece}-SPIN`;
      } else if (spinType === 'mini') {
        this.score += 100 * (this.level + 1);
        actionText = 'T-SPIN MINI';
      }
      this.combo = 0;
    }
    
    if (actionText) {
      this.lastActionText = actionText.trim();
    }

    // Spawn next piece
    this._spawnPiece();
  }

  // ============================================================
  // LOCK DELAY & GRAVITY
  // ============================================================

  /**
   * Called when piece successfully moves or rotates.
   * Resets lock delay timer if on ground (up to MAX_LOCK_RESETS).
   */
  _onSuccessfulMove() {
    if (this.isOnGround && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
    // Check if still on ground after move
    this.isOnGround = !this.board.isValid(
      this.currentPiece, this.currentCol, this.currentRow - 1, this.currentRotation
    );
  }

  /**
   * Update game state. Called every frame.
   * @param {number} deltaTime - Time since last frame in ms
   */
  update(deltaTime) {
    if (this.gameOver || this.paused || !this.currentPiece) return;

    this.elapsedTime += deltaTime;

    // Gravity: move piece down at regular intervals
    const gravitySpeed = GRAVITY_SPEEDS[Math.min(this.level, GRAVITY_SPEEDS.length - 1)];
    this.gravityTimer += deltaTime;
    if (this.gravityTimer >= gravitySpeed) {
      this.gravityTimer -= gravitySpeed;
      this.moveDown(false);
    }

    // Lock delay: if piece is on ground, count down to lock
    if (this.isOnGround) {
      this.lockTimer += deltaTime;
      if (this.lockTimer >= LOCK_DELAY) {
        this._lockPiece();
      }
    }
  }

  // ============================================================
  // STATE SNAPSHOT (for React rendering)
  // ============================================================

  /**
   * Get a plain object snapshot of the entire game state.
   * React components read from this.
   */
  getState() {
    const ghostRow = this.currentPiece
      ? this.board.getGhostRow(this.currentPiece, this.currentCol, this.currentRow, this.currentRotation)
      : null;

    return {
      grid: this.board.getVisibleGrid(),
      currentPiece: this.currentPiece,
      currentCol: this.currentCol,
      currentRow: this.currentRow,
      currentRotation: this.currentRotation,
      ghostRow,
      holdPiece: this.holdPiece,
      holdUsed: this.holdUsed,
      nextPieces: this.bag.peek(5),
      linesCleared: this.linesCleared,
      level: this.level,
      score: this.score,
      piecesPlaced: this.piecesPlaced,
      gameOver: this.gameOver,
      paused: this.paused,
      elapsedTime: this.elapsedTime,
      b2b: this.b2b,
      combo: this.combo,
      lastActionText: this.lastActionText,
    };
  }
}

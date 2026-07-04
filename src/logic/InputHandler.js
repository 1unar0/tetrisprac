// ============================================================
// InputHandler.js — Keyboard & Touch Input with DAS/ARR/SDF
// Handles precise timing for auto-repeat movement,
// matching TETR.IO's handling system.
// ============================================================

import {
  DEFAULT_DAS,
  DEFAULT_ARR,
  DEFAULT_SDF,
  SDF_INFINITY,
} from './constants.js';

export class InputHandler {
  constructor(gameState) {
    this.game = gameState;

    // Tuning values
    this.das = DEFAULT_DAS;
    this.arr = DEFAULT_ARR;
    this.sdf = DEFAULT_SDF;

    // Key state tracking
    // Each key tracks: { pressed, dasTimer, dasCharged, arrTimer }
    this.keys = {};

    // Key bindings (action -> key codes)
    this.bindings = {
      moveLeft:   ['ArrowLeft'],
      moveRight:  ['ArrowRight'],
      softDrop:   ['ArrowDown'],
      hardDrop:   ['Space'],
      rotateCW:   ['KeyD'],
      rotateCCW:  ['KeyA'],
      rotate180:  ['KeyS'],
      hold:       ['ArrowUp'],
      undo:       ['Ctrl+KeyZ'],
      redo:       ['Ctrl+KeyY'],
      pause:      ['Escape'],
      restart:    ['KeyR'],
    };

    // Build reverse lookup: keyCode -> action
    this._rebuildKeyMap();

    // Bind event handlers
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onKeyUp = this._handleKeyUp.bind(this);

    // Attach listeners
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  // ============================================================
  // KEY EVENT HANDLERS
  // ============================================================

  _handleKeyDown(e) {
    if (['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight'].includes(e.code)) return;

    let code = e.code;
    if (e.ctrlKey) code = 'Ctrl+' + code;

    const action = this._keyToAction[code];
    if (!action) return;

    e.preventDefault();

    // Ignore if already pressed (key repeat from OS)
    if (this.keys[action]?.pressed) return;

    this.keys[action] = {
      pressed: true,
      dasTimer: 0,
      dasCharged: false,
      arrTimer: 0,
    };

    // Execute action immediately on first press
    this._executeAction(action);
  }

  _handleKeyUp(e) {
    if (['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight'].includes(e.code)) return;

    let code = e.code;
    if (e.ctrlKey) code = 'Ctrl+' + code;

    const action = this._keyToAction[code];
    if (!action) return;

    e.preventDefault();

    if (this.keys[action]) {
      this.keys[action].pressed = false;
    }
  }

  // ============================================================
  // ACTION EXECUTION
  // ============================================================

  _executeAction(action) {
    switch (action) {
      case 'moveLeft':
        this.game.moveLeft();
        break;
      case 'moveRight':
        this.game.moveRight();
        break;
      case 'softDrop':
        if (this.sdf >= SDF_INFINITY) {
          // SDF = infinity: sonic drop (instant to bottom, no lock)
          this.game.sonicDrop();
        } else {
          this.game.moveDown(true);
        }
        break;
      case 'hardDrop':
        this.game.hardDrop();
        break;
      case 'rotateCW':
        this.game.rotateCW();
        break;
      case 'rotateCCW':
        this.game.rotateCCW();
        break;
      case 'rotate180':
        this.game.rotate180();
        break;
      case 'hold':
        this.game.hold();
        break;
      case 'undo':
        this.game.undo();
        break;
      case 'redo':
        this.game.redo();
        break;
      case 'pause':
        this.game.togglePause();
        break;
      case 'restart':
        this.game.reset();
        break;
    }
  }

  // ============================================================
  // DAS / ARR UPDATE (called every frame)
  // ============================================================

  /**
   * Process held keys with DAS/ARR timing.
   * @param {number} deltaTime - Time since last frame in ms
   */
  update(deltaTime) {
    // Process left/right movement with DAS/ARR
    this._processMovement('moveLeft', deltaTime);
    this._processMovement('moveRight', deltaTime);

    // Process soft drop with SDF
    this._processSoftDrop(deltaTime);
  }

  /**
   * Handle DAS/ARR for a directional movement action.
   */
  _processMovement(action, deltaTime) {
    const state = this.keys[action];
    if (!state || !state.pressed) return;

    // Accumulate DAS timer
    state.dasTimer += deltaTime;

    // Check if DAS threshold has been reached
    if (!state.dasCharged) {
      if (state.dasTimer >= this.das) {
        state.dasCharged = true;
        state.arrTimer = 0;

        // ARR = 0: instant teleport to wall
        if (this.arr === 0) {
          // Move as far as possible in one frame
          let moved = true;
          while (moved) {
            moved = action === 'moveLeft'
              ? this.game.moveLeft()
              : this.game.moveRight();
          }
        } else {
          // Execute first auto-repeat immediately
          this._executeAction(action);
        }
      }
    } else if (this.arr > 0) {
      // DAS already charged, process ARR
      state.arrTimer += deltaTime;
      while (state.arrTimer >= this.arr) {
        state.arrTimer -= this.arr;
        this._executeAction(action);
      }
    }
    // If ARR = 0 and DAS charged, we already teleported — no need for ARR loop
  }

  /**
   * Handle soft drop with SDF timing.
   */
  _processSoftDrop(deltaTime) {
    const state = this.keys['softDrop'];
    if (!state || !state.pressed) return;

    // SDF = infinity was already handled on first press (sonic drop)
    if (this.sdf >= SDF_INFINITY) return;

    // SDF is a speed multiplier: move down every (normal_speed / SDF) ms
    // For simplicity, we just move down multiple times per frame based on SDF
    state.arrTimer = (state.arrTimer || 0) + deltaTime;
    const interval = Math.max(1, Math.floor(1000 / (this.sdf * 60))); // rough conversion
    while (state.arrTimer >= interval) {
      state.arrTimer -= interval;
      this.game.moveDown(true);
    }
  }

  // ============================================================
  // TUNING SETTERS
  // ============================================================

  setDAS(ms) { this.das = Math.max(0, ms); }
  setARR(ms) { this.arr = Math.max(0, ms); }
  setSDF(value) { this.sdf = value; }

  // ============================================================
  // KEY BINDING MANAGEMENT
  // ============================================================

  /**
   * Rebuild the reverse lookup map from bindings.
   * Called after bindings change.
   */
  _rebuildKeyMap() {
    this._keyToAction = {};
    for (const [action, keyCodes] of Object.entries(this.bindings)) {
      for (const code of keyCodes) {
        this._keyToAction[code] = action;
      }
    }
  }

  /**
   * Get current key bindings.
   * @returns {Object} action -> key codes map
   */
  getBindings() {
    return { ...this.bindings };
  }

  /**
   * Update key bindings and rebuild the lookup map.
   * @param {Object} newBindings - action -> key codes map
   */
  setBindings(newBindings) {
    this.bindings = { ...newBindings };
    this._rebuildKeyMap();
    // Release all currently held keys to avoid stuck keys
    this.keys = {};
  }

  /**
   * Set a single action's key binding.
   * @param {string} action - e.g. 'moveLeft'
   * @param {string[]} keyCodes - e.g. ['ArrowLeft']
   */
  setActionKeys(action, keyCodes) {
    this.bindings[action] = keyCodes;
    this._rebuildKeyMap();
    this.keys = {};
  }

  // ============================================================
  // TOUCH INPUT (for mobile controls)
  // ============================================================

  /**
   * Trigger an action from a touch button press.
   * Used by MobileControls component.
   */
  triggerAction(action) {
    this._executeAction(action);
  }

  /**
   * Start holding a direction (for touch DAS/ARR).
   */
  startHolding(action) {
    if (this.keys[action]?.pressed) return;
    this.keys[action] = {
      pressed: true,
      dasTimer: 0,
      dasCharged: false,
      arrTimer: 0,
    };
    this._executeAction(action);
  }

  /**
   * Stop holding a direction (for touch DAS/ARR).
   */
  stopHolding(action) {
    if (this.keys[action]) {
      this.keys[action].pressed = false;
    }
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}

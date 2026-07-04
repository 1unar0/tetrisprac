// ============================================================
// SettingsPanel.jsx — DAS/ARR/SDF tuning + Key Bindings
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_DAS, DEFAULT_ARR, DEFAULT_SDF } from '../logic/constants.js';
import '../styles/panels.css';

// Human-readable names for actions
const ACTION_LABELS = {
  moveLeft:   'Move Left',
  moveRight:  'Move Right',
  softDrop:   'Soft Drop',
  hardDrop:   'Hard Drop',
  rotateCW:   'Rotate CW',
  rotateCCW:  'Rotate CCW',
  rotate180:  'Rotate 180°',
  hold:       'Hold',
  undo:       'Undo',
  redo:       'Redo',
  pause:      'Pause',
  restart:    'Restart',
};

// Convert e.code to a readable label
function keyCodeToLabel(code) {
  const map = {
    ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓',
    Space: 'Space', ShiftLeft: 'L-Shift', ShiftRight: 'R-Shift',
    ControlLeft: 'L-Ctrl', ControlRight: 'R-Ctrl',
    AltLeft: 'L-Alt', AltRight: 'R-Alt',
    Escape: 'Esc', Backspace: 'Back', Enter: 'Enter', Tab: 'Tab',
    Delete: 'Del', Insert: 'Ins',
  };
  if (map[code]) return map[code];
  if (code.startsWith('Ctrl+')) return 'Ctrl + ' + keyCodeToLabel(code.substring(5));
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num' + code.slice(6);
  return code;
}

export default function SettingsPanel({ das, arr, sdf, onDASChange, onARRChange, onSDFChange, inputHandler }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('handling'); // 'handling' or 'keys'
  const [bindings, setBindings] = useState({});
  const [listeningFor, setListeningFor] = useState(null); // { action, index } or null

  // Load bindings from input handler
  useEffect(() => {
    if (inputHandler) {
      setBindings(inputHandler.getBindings());
    }
  }, [inputHandler, isOpen]);

  // Listen for key press when rebinding
  useEffect(() => {
    if (!listeningFor) return;

    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isModifierOnly = ['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight', 'AltLeft', 'AltRight'].includes(e.code);
      if (isModifierOnly) return; // Wait for the actual key

      let newCode = e.code;
      if (e.ctrlKey) newCode = 'Ctrl+' + newCode;

      const { action, index } = listeningFor;

      setBindings(prev => {
        const updated = { ...prev };
        
        // Remove this key from any other action to prevent overlaps
        for (const act of Object.keys(updated)) {
          if (updated[act]) {
            updated[act] = updated[act].filter(k => k !== newCode);
          }
        }

        // Set the new key for the target action (replacing any old keys)
        updated[action] = [newCode];

        // Apply to input handler immediately
        if (inputHandler) {
          inputHandler.setBindings(updated);
        }

        return updated;
      });

      setListeningFor(null);
      if (document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [listeningFor, inputHandler]);

  const handleReset = () => {
    onDASChange(DEFAULT_DAS);
    onARRChange(DEFAULT_ARR);
    onSDFChange(DEFAULT_SDF);
  };

  const handleResetKeys = () => {
    const defaults = {
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
    setBindings(defaults);
    if (inputHandler) inputHandler.setBindings(defaults);
  };

  if (!isOpen) {
    return (
      <button className="settings-toggle" onClick={() => setIsOpen(true)}>
        ⚙ Settings
      </button>
    );
  }

  return (
    <div className="panel settings-panel">
      {/* Header */}
      <div className="panel-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Settings</span>
        <button
          onClick={() => { setIsOpen(false); setListeningFor(null); }}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px' }}
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'handling' ? 'active' : ''}`}
          onClick={() => setActiveTab('handling')}
        >
          Handling
        </button>
        <button
          className={`settings-tab ${activeTab === 'keys' ? 'active' : ''}`}
          onClick={() => setActiveTab('keys')}
        >
          Keys
        </button>
      </div>

      {/* Handling Tab */}
      {activeTab === 'handling' && (
        <div className="settings-body">
          <div className="setting-field">
            <label>DAS (ms)</label>
            <input
              type="number"
              value={das}
              min={0}
              max={500}
              onChange={(e) => onDASChange(Number(e.target.value))}
            />
          </div>

          <div className="setting-field">
            <label>ARR (ms)</label>
            <input
              type="number"
              value={arr}
              min={0}
              max={200}
              onChange={(e) => onARRChange(Number(e.target.value))}
            />
          </div>

          <div className="setting-field">
            <label>SDF (1-41, 41=∞)</label>
            <input
              type="number"
              value={sdf}
              min={1}
              max={41}
              onChange={(e) => onSDFChange(Number(e.target.value))}
            />
          </div>

          <button className="settings-reset" onClick={handleReset}>
            Reset to Default
          </button>
        </div>
      )}

      {/* Keys Tab */}
      {activeTab === 'keys' && (
        <div className="settings-body">
          <div className="keybind-list">
            {Object.entries(ACTION_LABELS).map(([action, label]) => (
              <div className="keybind-row" key={action}>
                <span className="keybind-label">{label}</span>
                <div className="keybind-keys">
                  <span
                    className={`keybind-key ${listeningFor?.action === action ? 'listening' : ''}`}
                    onClick={() => setListeningFor({ action, index: 0 })}
                  >
                    {listeningFor?.action === action
                      ? '...'
                      : (bindings[action] && bindings[action].length > 0 ? keyCodeToLabel(bindings[action][0]) : 'None')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="settings-reset" onClick={handleResetKeys}>
            Reset Keys to Default
          </button>
        </div>
      )}
    </div>
  );
}

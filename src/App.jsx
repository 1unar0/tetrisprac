// ============================================================
// App.jsx — Main Application
// Sets up game loop, connects logic to React components.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState } from './logic/GameState.js';
import { InputHandler } from './logic/InputHandler.js';
import { DEFAULT_DAS, DEFAULT_ARR, DEFAULT_SDF } from './logic/constants.js';

import BoardRenderer from './components/BoardRenderer.jsx';
import HoldDisplay from './components/HoldDisplay.jsx';
import NextQueue from './components/NextQueue.jsx';
import GameStats from './components/GameStats.jsx';
import MobileControls from './components/MobileControls.jsx';
import SettingsPanel from './components/SettingsPanel.jsx';

import './styles/index.css';
import './styles/layout.css';

export default function App() {
  // Refs for game instances (survive across re-renders)
  const gameRef = useRef(null);
  const inputRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // React state for rendering (updated every frame from game state)
  const [renderState, setRenderState] = useState(null);

  // Settings state
  const [das, setDAS] = useState(DEFAULT_DAS);
  const [arr, setARR] = useState(DEFAULT_ARR);
  const [sdf, setSDF] = useState(DEFAULT_SDF);

  // Initialize game and input handler
  useEffect(() => {
    const game = new GameState();
    const input = new InputHandler(game);
    gameRef.current = game;
    inputRef.current = input;

    // Set initial render state
    setRenderState(game.getState());

    // Game loop
    const loop = (timestamp) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Update input (DAS/ARR processing)
      input.update(deltaTime);

      // Update game state (gravity, lock delay)
      game.update(deltaTime);

      // Push state to React for rendering
      setRenderState(game.getState());

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    // Cleanup
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      input.destroy();
    };
  }, []);

  // Sync settings to input handler
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setDAS(das);
      inputRef.current.setARR(arr);
      inputRef.current.setSDF(sdf);
    }
  }, [das, arr, sdf]);

  // Handle restart
  const handleRestart = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.reset();
      setRenderState(gameRef.current.getState());
    }
  }, []);

  if (!renderState) return null;

  return (
    <div className="game-container">
      {/* Left Panel: Hold + Stats */}
      <div className="left-panel">
        <HoldDisplay
          pieceType={renderState.holdPiece}
          isLocked={renderState.holdUsed}
        />
        <GameStats
          lines={renderState.linesCleared}
          level={renderState.level}
          score={renderState.score}
          time={renderState.elapsedTime}
          piecesPlaced={renderState.piecesPlaced}
        />
      </div>

      {/* Center: Board */}
      <div className="center-panel">
        <div className="board-wrapper">
          <BoardRenderer gameState={renderState} />
          {renderState.lastActionText && !renderState.gameOver && (
            <div className="action-text-overlay" style={{ whiteSpace: 'pre-wrap' }}>
              {renderState.lastActionText}
            </div>
          )}
          {renderState.gameOver && (
            <div className="game-over-overlay">
              <h2>Game Over</h2>
              <p>Press R to restart</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Next Queue */}
      <div className="right-panel">
        <NextQueue pieces={renderState.nextPieces} />
      </div>

      {/* Settings (top-right corner) */}
      <SettingsPanel
        das={das}
        arr={arr}
        sdf={sdf}
        onDASChange={setDAS}
        onARRChange={setARR}
        onSDFChange={setSDF}
        inputHandler={inputRef.current}
      />

      {/* Mobile Controls (hidden on desktop) */}
      <MobileControls inputHandler={inputRef.current} />
    </div>
  );
}

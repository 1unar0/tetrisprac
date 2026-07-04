// ============================================================
// BoardRenderer.jsx — Renders the 10x20 Tetris board on Canvas
// Draws: grid lines, locked blocks, active piece, ghost piece
// ============================================================

import { useRef, useEffect } from 'react';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PIECE_SHAPES,
  PIECE_COLORS,
} from '../logic/constants.js';
import '../styles/board.css';

const CELL_SIZE = 30;
const GRID_LINE_WIDTH = 1;

export default function BoardRenderer({ gameState }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;

    const ctx = canvas.getContext('2d');
    const width = BOARD_WIDTH * CELL_SIZE;
    const height = BOARD_HEIGHT * CELL_SIZE;

    // Set canvas dimensions (accounting for DPI)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Draw checkerboard grid
    ctx.fillStyle = '#161616';
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        if ((row + col) % 2 === 0) {
          ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    const { grid, currentPiece, currentCol, currentRow, currentRotation, ghostRow } = gameState;

    // Draw locked blocks from grid
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      for (let col = 0; col < BOARD_WIDTH; col++) {
        const color = grid[row]?.[col];
        if (color) {
          drawBlock(ctx, col, BOARD_HEIGHT - 1 - row, color);
        }
      }
    }

    // Draw ghost piece
    if (currentPiece && ghostRow !== null && ghostRow !== undefined) {
      const ghostColor = PIECE_COLORS[currentPiece];
      const shape = PIECE_SHAPES[currentPiece][currentRotation];
      for (const [dr, dc] of shape) {
        const drawRow = BOARD_HEIGHT - 1 - (ghostRow + dr);
        const drawCol = currentCol + dc;
        if (drawRow >= 0 && drawRow < BOARD_HEIGHT && drawCol >= 0 && drawCol < BOARD_WIDTH) {
          drawGhostBlock(ctx, drawCol, drawRow, ghostColor);
        }
      }
    }

    // Draw active piece
    if (currentPiece) {
      const pieceColor = PIECE_COLORS[currentPiece];
      const shape = PIECE_SHAPES[currentPiece][currentRotation];
      for (const [dr, dc] of shape) {
        const drawRow = BOARD_HEIGHT - 1 - (currentRow + dr);
        const drawCol = currentCol + dc;
        if (drawRow >= 0 && drawRow < BOARD_HEIGHT && drawCol >= 0 && drawCol < BOARD_WIDTH) {
          drawBlock(ctx, drawCol, drawRow, pieceColor);
        }
      }
    }
  }, [gameState]);

  return (
    <canvas
      ref={canvasRef}
      className="board-canvas"
      style={{
        width: `${BOARD_WIDTH * CELL_SIZE}px`,
        height: `${BOARD_HEIGHT * CELL_SIZE}px`,
      }}
    />
  );
}

/**
 * Draw a solid block (Blockfish style - pure flat color).
 */
function drawBlock(ctx, col, row, color) {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  ctx.fillStyle = color;
  // Draw full cell without inset so pieces look connected
  ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
}

/**
 * Draw a ghost block (Blockfish style - hollow outline).
 */
function drawGhostBlock(ctx, col, row, color) {
  const x = col * CELL_SIZE;
  const y = row * CELL_SIZE;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  // Inner stroke to stay within the cell
  ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
}

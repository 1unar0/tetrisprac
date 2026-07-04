// ============================================================
// PiecePreview.jsx — Renders a single piece in a small canvas
// Used by HoldDisplay and NextQueue components.
// ============================================================

import { useRef, useEffect } from 'react';
import { PIECE_SHAPES, PIECE_COLORS } from '../logic/constants.js';

const PREVIEW_CELL = 24; // Larger cell size for previews, similar to board

export default function PiecePreview({ pieceType, cellSize = PREVIEW_CELL }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // 4x4 bounding box for piece previews
    const size = 4 * cellSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, size, size);

    if (!pieceType) return;

    const shape = PIECE_SHAPES[pieceType][0]; // Always show rotation state 0
    const color = PIECE_COLORS[pieceType];

    // Calculate centering offset
    const cols = shape.map(([, c]) => c);
    const rows = shape.map(([r]) => r);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const pieceW = maxCol - minCol + 1;
    const pieceH = maxRow - minRow + 1;
    const offsetX = Math.floor((4 - pieceW) / 2) - minCol;
    // Map dr to (maxRow - dr) to flip vertically (since canvas y goes down, but our dr goes up)
    // Mapped row values range from 0 to pieceH - 1
    const offsetY = Math.floor((4 - pieceH) / 2);

    // Draw each block
    for (const [dr, dc] of shape) {
      const invertedDr = maxRow - dr;
      const x = (dc + offsetX) * cellSize;
      const y = (invertedDr + offsetY) * cellSize;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }, [pieceType, cellSize]);

  return <canvas ref={canvasRef} className="piece-preview-canvas" />;
}

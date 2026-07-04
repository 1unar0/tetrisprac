// ============================================================
// HoldDisplay.jsx — Shows the held piece
// ============================================================

import PiecePreview from './PiecePreview.jsx';
import '../styles/panels.css';

export default function HoldDisplay({ pieceType, isLocked }) {
  return (
    <div className={`panel hold-display ${isLocked ? 'locked' : ''}`}>
      <div className="panel-title">Hold</div>
      <div className="piece-preview">
        <PiecePreview pieceType={pieceType} />
      </div>
    </div>
  );
}

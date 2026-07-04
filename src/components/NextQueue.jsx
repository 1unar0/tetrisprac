// ============================================================
// NextQueue.jsx — Shows the next 5 upcoming pieces
// ============================================================

import PiecePreview from './PiecePreview.jsx';
import '../styles/panels.css';

export default function NextQueue({ pieces }) {
  return (
    <div className="panel next-queue">
      <div className="panel-title">Next</div>
      {(pieces || []).map((pieceType, index) => (
        <div className="piece-preview" key={index}>
          <PiecePreview pieceType={pieceType} />
        </div>
      ))}
    </div>
  );
}

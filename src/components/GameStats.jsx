// ============================================================
// GameStats.jsx — Displays lines, level, time, pieces placed
// ============================================================

import '../styles/panels.css';

export default function GameStats({ lines, level, score, time, piecesPlaced }) {
  // Format elapsed time (ms) to MM:SS
  const totalSeconds = Math.floor((time || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="panel stats-display">
      <div className="stat-row">
        <div className="stat-label">Lines</div>
        <div className="stat-value">{lines || 0}</div>
      </div>
      <div className="stat-row">
        <div className="stat-label">Level</div>
        <div className="stat-value">{level || 0}</div>
      </div>
      <div className="stat-row">
        <div className="stat-label">Score</div>
        <div className="stat-value">{score || 0}</div>
      </div>
      <div className="stat-row">
        <div className="stat-label">Pieces</div>
        <div className="stat-value">{piecesPlaced || 0}</div>
      </div>
      <div className="stat-row">
        <div className="stat-label">Time</div>
        <div className="stat-value">{timeStr}</div>
      </div>
    </div>
  );
}

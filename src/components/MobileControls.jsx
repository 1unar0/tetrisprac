// ============================================================
// MobileControls.jsx — On-screen touch buttons for mobile
// Supports touch start/end for DAS/ARR integration.
// ============================================================

import '../styles/controls.css';

export default function MobileControls({ inputHandler }) {
  if (!inputHandler) return null;

  // Helper to create touch handlers for movement keys (DAS/ARR)
  const holdHandlers = (action) => ({
    onTouchStart: (e) => {
      e.preventDefault();
      inputHandler.startHolding(action);
    },
    onTouchEnd: (e) => {
      e.preventDefault();
      inputHandler.stopHolding(action);
    },
    onTouchCancel: (e) => {
      e.preventDefault();
      inputHandler.stopHolding(action);
    },
  });

  // Helper for instant actions (no hold behavior)
  const tapHandler = (action) => ({
    onTouchStart: (e) => {
      e.preventDefault();
      inputHandler.triggerAction(action);
    },
  });

  return (
    <div className="mobile-controls">
      <div className="controls-row">
        {/* Left side: Movement */}
        <div className="controls-left">
          <button className="ctrl-btn" {...holdHandlers('moveLeft')}>
            <span className="ctrl-btn-label">◀</span>
          </button>
          <button className="ctrl-btn" {...holdHandlers('moveRight')}>
            <span className="ctrl-btn-label">▶</span>
          </button>
          <button className="ctrl-btn" {...holdHandlers('softDrop')}>
            <span className="ctrl-btn-label">▼</span>
          </button>
        </div>

        {/* Right side: Actions */}
        <div className="controls-right">
          <button className="ctrl-btn" {...tapHandler('rotateCCW')}>
            <span className="ctrl-btn-label">↺</span>
          </button>
          <button className="ctrl-btn accent" {...tapHandler('rotateCW')}>
            <span className="ctrl-btn-label">↻</span>
          </button>
          <button className="ctrl-btn wide" {...tapHandler('hardDrop')}>
            <span className="ctrl-btn-label">DROP</span>
          </button>
          <button className="ctrl-btn" {...tapHandler('hold')}>
            <span className="ctrl-btn-label">HOLD</span>
          </button>
        </div>
      </div>
    </div>
  );
}

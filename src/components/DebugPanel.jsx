export default function DebugPanel({ data, status, renderFps }) {
  const hand = data?.primary
  const metric = (value, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '—'
  return <aside className="debug-panel" aria-label="Hand tracking debug data">
    <div className="debug-heading"><span>TRACKING / DEBUG</span><span>PRESS D TO CLOSE</span></div>
    <div className="debug-feature"><span>HAND 01</span><strong>{hand?.gesture || 'SEARCHING'}</strong><small>{hand ? `${Math.round(hand.confidence * 100)}% heuristic confidence` : status}</small></div>
    <div className="debug-grid">
      <span>RENDER FPS</span><b>{renderFps || 0}</b>
      <span>TRACK FPS</span><b>{data?.fps || 0}</b>
      <span>DETECTED HANDS</span><b>{data?.hands.length || 0}</b>
      <span>PALM X</span><b>{metric(hand?.center.x)}</b>
      <span>PALM Y</span><b>{metric(hand?.center.y)}</b>
      <span>PINCH DISTANCE</span><b>{metric(hand?.pinchDistance)}</b>
      <span>HAND VELOCITY</span><b>{metric(hand?.velocity)} /s</b>
      <span>PALM SCALE</span><b>{metric(hand?.scale)}</b>
    </div>
    <p>Pose confidence is a geometric estimate, not a MediaPipe classifier score.</p>
  </aside>
}

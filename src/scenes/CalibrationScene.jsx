import { GESTURES } from '../utils/gestureDetection'

const STEPS = [
  { gesture: GESTURES.OPEN, name: 'OPEN PALM', hint: 'Spread your fingers toward the camera.' },
  { gesture: GESTURES.PINCH, name: 'PINCH', hint: 'Touch thumb and index finger together.' },
  { gesture: GESTURES.FIST, name: 'MAKE A FIST', hint: 'Close your hand gently.' },
]

export { STEPS }

export default function CalibrationScene({ step, ready, data, error, onRetry, onContinue }) {
  const complete = step >= STEPS.length
  return <section className="calibration-screen" aria-label="Camera calibration">
    <div className="scene-kicker">01 / CAMERA CALIBRATION <span>GESTURE//SPACE</span></div>
    <div className="calibration-content">
      <div className={`hand-diagram ${data?.primary ? 'is-detected' : ''}`} aria-hidden="true">
        <svg viewBox="0 0 240 300" fill="none"><path d="M55 247c-19-24-28-45-38-74-4-12 3-20 13-18 9 2 18 18 26 28V68c0-12 15-17 22-8 3 4 4 8 4 13v78-110c0-15 22-17 24-1l2 110V33c0-16 22-18 25-2l2 122V50c0-16 22-15 24 0l2 112V76c0-15 21-15 23 0v92c0 38-11 62-29 79-15 15-29 18-50 18h-27c-18 0-31-6-43-18Z" stroke="currentColor" strokeWidth="1.2"/><path d="M25 177c38-29 81-41 130-27m-99 34c45-17 88-12 127 3M81 74l2 104m24-132 3 114m24-124 2 126m22-109 1 114" stroke="currentColor" strokeOpacity=".24" strokeWidth="1"/><circle cx="83" cy="175" r="3" fill="currentColor"/><circle cx="110" cy="160" r="3" fill="currentColor"/><circle cx="136" cy="161" r="3" fill="currentColor"/><circle cx="159" cy="166" r="3" fill="currentColor"/></svg>
        <span className="diagram-cross cross-one">+</span><span className="diagram-cross cross-two">+</span>
      </div>
      <div className="calibration-copy">
        <div className="eyebrow">SYSTEM / INPUT ALIGNMENT</div>
        <h2>{error ? 'CAMERA OFFLINE' : complete ? 'GESTURE\nCALIBRATED' : ready ? 'SHOW\nYOUR HAND' : 'CONNECTING\nTO CAMERA'}</h2>
        <p>{error || (complete ? 'Your hand is ready to shape the field.' : ready ? STEPS[step].hint : 'Allow camera access. Your video stays on this device.')}</p>
        <div className="calibration-steps">{STEPS.map((item, index) => <div key={item.name} className={index < step ? 'done' : index === step ? 'current' : ''}><span>0{index + 1}</span><b>{item.name}</b><i>{index < step ? '✓' : index === step ? '●' : '—'}</i></div>)}</div>
        {error && <button className="text-action" onClick={onRetry}>RETRY CAMERA ↗</button>}
        {complete && <button className="text-action" onClick={onContinue}>ENTER PARTICLE FIELD ↗</button>}
      </div>
    </div>
    <div className="calibration-footer">{data?.primary ? 'HAND DETECTED' : 'SEARCHING FOR HAND'} <span>KEEP HAND WITHIN FRAME</span></div>
  </section>
}

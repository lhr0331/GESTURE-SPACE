import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import CameraPreview from './components/CameraPreview'
import GestureCursor from './components/GestureCursor'
import DebugPanel from './components/DebugPanel'
import SceneTransition from './components/SceneTransition'
import IntroScene from './scenes/IntroScene'
import CalibrationScene, { STEPS } from './scenes/CalibrationScene'

const GestureTracker = lazy(() => import('./components/GestureTracker'))
const ParticleScene = lazy(() => import('./scenes/ParticleScene'))

export default function App() {
  const [scene, setScene] = useState('intro')
  const [started, setStarted] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [stream, setStream] = useState(null)
  const [debug, setDebug] = useState(false)
  const [data, setData] = useState(null)
  const [step, setStep] = useState(0)
  const [trackerKey, setTrackerKey] = useState(0)
  const [renderFps, setRenderFps] = useState(0)
  const handDataRef = useRef(null)
  const sceneRef = useRef('intro')
  const calibrationRef = useRef({ step: 0, holdStart: 0 })

  function changeScene(next) { sceneRef.current = next; setScene(next) }

  const onFrame = useCallback((next, updateUi) => {
    handDataRef.current = next
    if (updateUi) setData(next)
    if (sceneRef.current !== 'calibration' || !next.primary) {
      calibrationRef.current.holdStart = 0
      return
    }
    const calibration = calibrationRef.current
    if (calibration.step >= STEPS.length) return
    if (next.primary.gesture !== STEPS[calibration.step].gesture) {
      calibration.holdStart = 0
      return
    }
    if (!calibration.holdStart) calibration.holdStart = next.at
    if (next.at - calibration.holdStart < 450) return
    calibration.step += 1
    calibration.holdStart = 0
    setStep(calibration.step)
    if (calibration.step === STEPS.length) {
      window.setTimeout(() => { sceneRef.current = 'field'; setScene('field') }, 1500)
    }
  }, [])
  const onReady = useCallback(() => { setReady(true); setError('') }, [])
  const onError = useCallback(message => { handDataRef.current = null; setData(null); setError(message); setReady(false) }, [])
  const onStream = useCallback(next => setStream(next), [])
  const onRenderFps = useCallback(value => setRenderFps(value), [])

  useEffect(() => {
    function onKey(event) {
      if (event.key.toLowerCase() === 'd') setDebug(value => !value)
      if (event.shiftKey && event.key.toLowerCase() === 'f' && sceneRef.current === 'calibration') {
        sceneRef.current = 'field'; setScene('field')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function enter() {
    setStarted(true)
    setRenderFps(0)
    changeScene('calibration')
  }
  function retry() {
    setError(''); setReady(false); setTrackerKey(value => value + 1)
  }
  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 760px), (pointer: coarse) and (max-width: 1024px)').matches

  return <main className={`experience scene-${scene}`}>
    <div className="ambient-grid" aria-hidden="true" />
    <div className="screen-grain" aria-hidden="true" />
    {(scene === 'intro' || scene === 'field') && <Suspense fallback={null}><ParticleScene intro={scene === 'intro'} handDataRef={handDataRef} onFps={onRenderFps} /></Suspense>}
    {scene === 'intro' && <IntroScene onEnter={enter} />}
    {scene === 'calibration' && <CalibrationScene step={step} ready={ready} data={data} error={error} onRetry={retry} onContinue={() => changeScene('field')} />}
    {scene === 'field' && <section className="field-ui" aria-label="Particle field">
      <div className="scene-kicker">02 / PARTICLE FIELD <span>GESTURE//SPACE</span></div>
      <div className="field-side-label">FORM / RESPONSE / SPACE</div>
      <div className="field-bottom">
        <div><span className="eyebrow">YOUR HAND SHAPES THE FIELD</span><h2>TOUCH THE<br />UNSEEN.</h2></div>
        <div className="field-legend"><span>01 / MOVE — SHIFT THE ROSE</span><span>02 / OPEN — EXPAND</span><span>03 / FIST — COMPRESS</span><span>04 / PINCH + MOVE — ROTATE</span></div>
      </div>
      {error && <div className="field-error">{error} <button onClick={retry}>RETRY ↗</button></div>}
    </section>}
    {started && <Suspense fallback={null}><GestureTracker key={trackerKey} active onFrame={onFrame} onReady={onReady} onError={onError} onStream={onStream} /></Suspense>}
    {started && <CameraPreview stream={stream} handDataRef={handDataRef} debug={debug} visible={scene === 'calibration' || debug} />}
    {started && <GestureCursor handDataRef={handDataRef} active={scene === 'field'} />}
    {started && <div className={`tracking-status ${data?.primary ? 'detected' : ''}`}><i />{data?.primary ? 'HAND DETECTED' : ready ? 'SEARCHING FOR HAND' : 'CONNECTING CAMERA'}</div>}
    {started && debug && <DebugPanel data={data} status={error || 'Searching for hand'} renderFps={renderFps} />}
    <div className="debug-hint">D / DEBUG</div>
    {mobile && <div className="mobile-notice"><strong>GESTURE//SPACE</strong><span>Desktop experience recommended.</span><small>Use Chrome or Edge on a computer with a webcam.</small></div>}
    <SceneTransition scene={scene} />
  </main>
}

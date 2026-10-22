import { useEffect, useRef } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { classifyHand, createGestureSmoother } from '../utils/gestureDetection'

const WASM_ROOT = `${import.meta.env.BASE_URL}wasm`
const MODEL_PATH = `${import.meta.env.BASE_URL}models/hand_landmarker.task`

export default function GestureTracker({ active, onFrame, onReady, onError, onStream }) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (!active) return undefined
    let cancelled = false
    let stream
    let landmarker
    let animationId
    let failed = false
    let previousVideoTime = -1
    let previousAt = 0
    let previousCenter = null
    let previousPoseAt = 0
    let lastUiAt = 0
    let frameCount = 0
    let fpsAt = performance.now()
    let fps = 0
    const smoothGesture = createGestureSmoother()

    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera requires localhost or a secure HTTPS page.')
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 540 }, frameRate: { ideal: 30, max: 30 } },
        })
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return }
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        onStream(stream)

        const vision = await FilesetResolver.forVisionTasks(WASM_ROOT)
        const options = {
          baseOptions: { modelAssetPath: MODEL_PATH, delegate: 'GPU' },
          runningMode: 'VIDEO', numHands: 2,
          minHandDetectionConfidence: 0.58,
          minHandPresenceConfidence: 0.55,
          minTrackingConfidence: 0.5,
        }
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, options)
        } catch {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            ...options, baseOptions: { ...options.baseOptions, delegate: 'CPU' },
          })
        }
        if (cancelled) { landmarker.close(); return }
        onReady()

        function detect(now) {
          if (cancelled || failed) return
          animationId = requestAnimationFrame(detect)
          const video = videoRef.current
          if (!video || video.readyState < 2 || video.currentTime === previousVideoTime) return
          // Cap synchronous inference at 30 Hz so the Three.js render loop stays responsive.
          if (now - previousAt < 30) return
          previousVideoTime = video.currentTime
          previousAt = now

          let result
          try { result = landmarker.detectForVideo(video, now) }
          catch (error) { failed = true; onError(`Hand tracking stopped: ${error.message}`); return }
          frameCount += 1
          if (now - fpsAt >= 1000) { fps = Math.round(frameCount * 1000 / (now - fpsAt)); frameCount = 0; fpsAt = now }
          const hands = result.landmarks.map((points, index) => {
            const pose = classifyHand(points)
            return { ...pose, landmarks: points, handedness: result.handedness[index]?.[0]?.categoryName || 'Hand' }
          })
          // Largest hand is the primary controller. This avoids left/right identity swaps.
          hands.sort((a, b) => b.scale - a.scale)
          const primary = hands[0]
          if (primary) {
            primary.gesture = smoothGesture(primary.gesture)
            const dt = Math.max(0.016, Math.min(0.12, (now - (previousPoseAt || now)) / 1000))
            primary.velocity = previousCenter ? Math.hypot(primary.center.x - previousCenter.x, primary.center.y - previousCenter.y) / dt : 0
            previousCenter = { ...primary.center }
            previousPoseAt = now
          } else {
            smoothGesture(null)
            previousCenter = null
            previousPoseAt = 0
          }
          const data = { hands, primary, fps, at: now }
          onFrame(data, now - lastUiAt > 95)
          if (now - lastUiAt > 95) lastUiAt = now
        }
        animationId = requestAnimationFrame(detect)
      } catch (error) {
        if (!cancelled) onError(error.name === 'NotAllowedError'
          ? 'Camera access was denied. Allow this site to use your camera and reload.'
          : error.name === 'NotFoundError'
            ? 'No webcam was found. Connect a camera and try again.'
            : `Camera or model could not start: ${error.message}`)
      }
    }
    start()
    return () => {
      cancelled = true
      cancelAnimationFrame(animationId)
      landmarker?.close()
      stream?.getTracks().forEach(track => track.stop())
      onStream(null)
    }
  }, [active, onError, onFrame, onReady, onStream])

  return <video ref={videoRef} className="tracking-video" muted playsInline aria-hidden="true" />
}

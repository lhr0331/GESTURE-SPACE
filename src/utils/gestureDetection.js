import { clamp, distance, extendedFingers, palmCenter, palmScale } from './handMath.js'

export const GESTURES = {
  OPEN: 'OPEN PALM',
  FIST: 'FIST',
  PINCH: 'PINCH',
  POINT: 'POINT',
  NEUTRAL: 'NEUTRAL',
}

export function classifyHand(points) {
  const center = palmCenter(points)
  const scale = Math.max(0.025, palmScale(points))
  const pinchDistance = distance(points[4], points[8]) / scale
  const fingers = extendedFingers(points)
  const extended = fingers.filter(Boolean).length
  const pinchAwayFromPalm = distance(points[8], center) / scale > .85
  let gesture = GESTURES.NEUTRAL
  let confidence = 0.55

  // A natural pinch may curl the other fingers; its contact stays above the palm.
  if (pinchDistance < 0.43 && (extended > 0 || pinchAwayFromPalm)) {
    gesture = GESTURES.PINCH
    confidence = clamp((0.43 - pinchDistance) / 0.35 + 0.65, 0.65, 0.98)
  } else if (extended === 0) {
    gesture = GESTURES.FIST
    confidence = 0.88
  } else if (extended >= 4) {
    gesture = GESTURES.OPEN
    confidence = 0.90
  } else if (fingers[0] && !fingers[1] && !fingers[2] && !fingers[3]) {
    gesture = GESTURES.POINT
    confidence = 0.83
  }

  return { center, scale, pinchDistance, fingers, gesture, confidence, indexTip: points[8] }
}

// A three-frame vote removes single-frame pose glitches without a noticeable delay.
export function createGestureSmoother() {
  const history = []
  return (candidate) => {
    if (!candidate) {
      history.length = 0
      return GESTURES.NEUTRAL
    }
    history.push(candidate)
    if (history.length > 3) history.shift()
    if (history.length < 2) return candidate
    const counts = new Map()
    history.forEach(value => counts.set(value, (counts.get(value) || 0) + 1))
    return [...counts].sort((a, b) => b[1] - a[1])[0][0]
  }
}

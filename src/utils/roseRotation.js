import { clamp, lerp } from './handMath.js'

// Tracking arrives at ~30 Hz while rendering may be faster. Each pose is consumed once.
export function createRoseRotationController() {
  let yaw = 0
  let pitch = 0
  let yawVelocity = 0
  let pitchVelocity = 0
  let previous = null

  return {
    update(pinching, point, at) {
      if (!pinching || !point) {
        previous = null
        return false
      }
      if (!previous) {
        previous = { x: point.x, y: point.y, at }
        yawVelocity = 0
        pitchVelocity = 0
        return true
      }
      if (at <= previous.at) return true

      const seconds = clamp((at - previous.at) / 1000, .016, .12)
      // Webcam display is mirrored: decreasing camera X means moving right on screen.
      const yawDelta = (previous.x - point.x) * 8
      const pitchDelta = (point.y - previous.y) * 5.2
      yaw += yawDelta
      pitch = clamp(pitch + pitchDelta, -.9, .9)
      yawVelocity = lerp(yawVelocity, clamp(yawDelta / seconds, -6, 6), .55)
      pitchVelocity = lerp(pitchVelocity, clamp(pitchDelta / seconds, -4, 4), .55)
      previous = { x: point.x, y: point.y, at }
      return true
    },
    step(seconds, pinching) {
      if (!pinching) {
        yaw += yawVelocity * seconds
        pitch = clamp(pitch + pitchVelocity * seconds, -.9, .9)
        const drag = Math.exp(-5 * seconds)
        yawVelocity *= drag
        pitchVelocity *= drag
        if (Math.abs(yawVelocity) < .003) yawVelocity = 0
        if (Math.abs(pitchVelocity) < .003) pitchVelocity = 0
      }
      return { yaw, pitch }
    },
  }
}

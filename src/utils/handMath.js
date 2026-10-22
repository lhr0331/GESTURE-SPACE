export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
export const lerp = (a, b, t) => a + (b - a) * t

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function palmCenter(points) {
  const ids = [0, 5, 9, 13, 17]
  return ids.reduce((center, id) => {
    center.x += points[id].x / ids.length
    center.y += points[id].y / ids.length
    return center
  }, { x: 0, y: 0 })
}

// Apparent palm width is a useful, deliberately approximate distance-to-camera signal.
export function palmScale(points) {
  return distance(points[5], points[17])
}

export function extendedFingers(points) {
  const fingers = [[5, 6, 8], [9, 10, 12], [13, 14, 16], [17, 18, 20]]
  return fingers.map(([mcp, pip, tip]) => {
    const straightness = distance(points[tip], points[mcp]) / Math.max(0.001, distance(points[pip], points[mcp]))
    return straightness > 1.52 && distance(points[tip], points[0]) > distance(points[pip], points[0]) * 1.16
  })
}

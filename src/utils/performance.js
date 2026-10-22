export function particleBudget() {
  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 4
  return cores <= 4 || memory <= 4 ? 4000 : 7600
}

export function pixelRatio() {
  return Math.min(window.devicePixelRatio || 1, 1.75)
}

import { useEffect, useRef } from 'react'

export default function GestureCursor({ handDataRef, active }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!active) return undefined
    let frame
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    function tick() {
      frame = requestAnimationFrame(tick)
      const primary = handDataRef.current?.primary
      if (!ref.current) return
      if (!primary) { ref.current.style.opacity = '0'; return }
      x += ((1 - primary.indexTip.x) * innerWidth - x) * 0.25
      y += (primary.indexTip.y * innerHeight - y) * 0.25
      ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      ref.current.style.opacity = '1'
      ref.current.dataset.gesture = primary.gesture
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, handDataRef])
  return <div ref={ref} className="gesture-cursor" aria-hidden="true"><i /><b /></div>
}

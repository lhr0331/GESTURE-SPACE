import { useEffect, useRef } from 'react'

const BONES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]

export default function CameraPreview({ stream, handDataRef, debug, visible }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.srcObject = stream || null
    if (stream) video.play().catch(() => {})
  }, [stream, visible])

  useEffect(() => {
    if (!visible || !debug) return undefined
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    let frame
    function draw() {
      frame = requestAnimationFrame(draw)
      if (!canvas || !ctx) return
      const width = canvas.clientWidth * devicePixelRatio
      const height = canvas.clientHeight * devicePixelRatio
      if (width && height && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width; canvas.height = height
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const video = videoRef.current
      const sourceWidth = video?.videoWidth || 960
      const sourceHeight = video?.videoHeight || 540
      const coverScale = Math.max(canvas.width / sourceWidth, canvas.height / sourceHeight)
      const offsetX = (canvas.width - sourceWidth * coverScale) / 2
      const offsetY = (canvas.height - sourceHeight * coverScale) / 2
      const px = point => ({ x: offsetX + point.x * sourceWidth * coverScale, y: offsetY + point.y * sourceHeight * coverScale })
      const hands = handDataRef.current?.hands || []
      hands.forEach((hand, index) => {
        const points = hand.landmarks
        ctx.strokeStyle = index === 0 ? 'rgba(232, 215, 172, .92)' : 'rgba(175, 188, 188, .8)'
        ctx.lineWidth = Math.max(1, width / 330)
        BONES.forEach(([a, b]) => {
          const start = px(points[a]); const end = px(points[b])
          ctx.beginPath()
          ctx.moveTo(start.x, start.y)
          ctx.lineTo(end.x, end.y)
          ctx.stroke()
        })
        points.forEach(point => {
          const position = px(point)
          ctx.beginPath()
          ctx.fillStyle = '#f3ebd8'
          ctx.arc(position.x, position.y, Math.max(1.5, width / 170), 0, Math.PI * 2)
          ctx.fill()
        })
      })
    }
    frame = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frame)
  }, [debug, handDataRef, visible])

  if (!visible) return null
  return <div className="camera-preview" aria-label="Live camera preview">
    <div className="preview-media">
      <video ref={videoRef} muted playsInline autoPlay />
      <canvas ref={canvasRef} className={debug ? 'landmark-canvas' : 'landmark-canvas hidden'} />
    </div>
    <div className="preview-caption"><span>CAM 01 / LIVE</span><span>{debug ? 'LANDMARKS ON' : 'PRIVATE VIEW'}</span></div>
  </div>
}

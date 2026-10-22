import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { clamp, lerp } from '../utils/handMath'
import { GESTURES } from '../utils/gestureDetection'
import { particleBudget, pixelRatio } from '../utils/performance'
import { createRoseRotationController } from '../utils/roseRotation'

const vertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aKind;
  attribute float aProgress;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vDepth;
  varying float vKind;
  uniform float uTime;
  uniform float uSpread;
  uniform float uCompression;
  uniform float uBloom;
  uniform vec2 uCenter;
  void main() {
    vec3 p = position;
    float petal = 1.0 - step(1.5, aKind);
    float dust = step(3.5, aKind);
    float opening = 1.0 + (uBloom - 1.0) * aProgress * petal;
    p.x *= mix(1.0, opening * uSpread * uCompression, petal);
    p.y = mix(p.y, .18 + (p.y - .18) * (1.0 + (uBloom - 1.0) * aProgress * .2), petal);
    float flutter = sin(uTime * .8 + aPhase * 6.283 + aProgress * 4.0);
    p.x += flutter * mix(.012, .15, dust);
    p.y += cos(uTime * .57 + aPhase * 5.0) * mix(.012, .12, dust);
    p.z += flutter * mix(.045, .23, dust);
    p.xy += uCenter;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(13.0, aSize * (29.0 / max(1.0, -mv.z)));
    vColor = aColor;
    vDepth = clamp((p.z + 5.0) / 9.0, 0.0, 1.0);
    vKind = aKind;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vDepth;
  varying float vKind;
  void main() {
    vec2 uv = gl_PointCoord - .5;
    float radius = length(uv);
    float core = smoothstep(.25, .015, radius);
    float halo = smoothstep(.5, .04, radius) * .34;
    float alpha = (core + halo) * (.38 + vDepth * .62);
    if (vKind > 3.5) alpha *= .22;
    if (alpha < .012) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`

const PETAL_LAYERS = [
  { petals: 7, baseR: .36, tipR: 2.45, baseY: -.04, tipY: 1.88, width: .64, curl: .52, phase: .15 },
  { petals: 8, baseR: .24, tipR: 1.92, baseY: .2, tipY: 2.42, width: .7, curl: .28, phase: .43 },
  { petals: 6, baseR: .13, tipR: 1.2, baseY: .55, tipY: 2.83, width: .82, curl: .12, phase: .12 },
  { petals: 5, baseR: .07, tipR: .69, baseY: .91, tipY: 3.17, width: .91, curl: .02, phase: .58 },
]

function makeRose(count) {
  let seed = 0xf10a2026
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0
    return (seed >>> 0) / 4294967296
  }
  const positions = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const phases = new Float32Array(count)
  const kinds = new Float32Array(count)
  const progress = new Float32Array(count)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const group = i / count
    let x, y, z, size, kind, tip = 0, r, g, b

    if (group < .76) {
      const layerIndex = group < .22 ? 0 : group < .49 ? 1 : group < .7 ? 2 : 3
      const layer = PETAL_LAYERS[layerIndex]
      const petalIndex = i % layer.petals
      const u = Math.pow(random(), .83)
      const lip = i % 11 === 0
      const seam = i % 9 === 0
      const across = seam ? (random() < .5 ? -1 : 1) * (.88 + random() * .12) : random() * 2 - 1
      const surfaceU = lip ? .9 + random() * .1 : u
      const angle = petalIndex * Math.PI * 2 / layer.petals + layer.phase
        + across * layer.width * (.12 + .88 * Math.sin(surfaceU * 1.55))
        + surfaceU * (layerIndex % 2 ? -.13 : .12)
      const radius = layer.baseR + (layer.tipR - layer.baseR) * Math.pow(surfaceU, .88)
      x = Math.sin(angle) * radius
      z = Math.cos(angle) * radius
      y = layer.baseY + (layer.tipY - layer.baseY) * surfaceU
        - layer.curl * Math.pow(surfaceU, 4)
        + Math.sin(Math.PI * surfaceU) * (1 - across * across) * .17
        - Math.abs(across) * Math.pow(surfaceU, 3) * .22
      const front = clamp((Math.cos(angle) + .35) / 1.35)
      const highlight = lip || seam ? .17 : 0
      const brightness = .48 + front * .4 + random() * .18 + highlight
      const inner = layerIndex / 3
      r = clamp((.72 + inner * .2) * brightness)
      g = clamp((.045 + inner * .05 + highlight * .65) * brightness)
      b = clamp((.11 + inner * .07 + highlight * .48) * brightness)
      size = 1.65 + random() * 2.1 + (lip || seam ? .65 : 0)
      kind = 0
      tip = surfaceU
    } else if (group < .84) {
      // A rising spiral of particles gives the bud a rolled, rose-like center.
      const u = random()
      const angle = u * Math.PI * 11 + (random() - .5) * .35
      const radius = .08 + u * .39
      x = Math.sin(angle) * radius
      z = Math.cos(angle) * radius + .32
      y = .8 + u * 2.18
      size = 1.8 + random() * 2.8
      kind = 1
      tip = u
      r = .7 + random() * .25
      g = .09 + random() * .17
      b = .13 + random() * .14
    } else if (group < .91) {
      const sepal = i % 4 === 0
      if (sepal) {
        const u = random()
        const angle = (i % 5) * Math.PI * 2 / 5
        const radius = .1 + u * .58
        x = Math.sin(angle) * radius
        z = Math.cos(angle) * radius
        y = -.21 + u * .88 - u * u * .3
      } else {
        const u = random()
        const angle = random() * Math.PI * 2
        const stemX = Math.sin(u * Math.PI * 1.25) * .16 - u * .27
        x = stemX + Math.cos(angle) * (.045 + random() * .03)
        z = Math.sin(angle) * .06
        y = -.17 - u * 4.18
      }
      size = 1.7 + random() * 1.8
      kind = 2
      r = .15 + random() * .18
      g = .29 + random() * .22
      b = .12 + random() * .08
    } else if (group < .97) {
      const leaf = i % 2
      const u = random()
      const across = random() * 2 - 1
      const side = leaf ? 1 : -1
      const baseY = leaf ? -2.63 : -1.82
      const width = Math.pow(Math.sin(Math.PI * u), .7) * .45
      const stemU = (-baseY - .17) / 4.18
      const stemX = Math.sin(stemU * Math.PI * 1.25) * .16 - stemU * .27
      x = stemX + side * u * 1.32
      y = baseY + u * (leaf ? -.2 : .4) + across * width
      z = .08 + across * .15 + Math.sin(Math.PI * u) * .14
      size = 1.5 + random() * 1.8
      kind = 3
      r = .11 + random() * .14
      g = .27 + random() * .26
      b = .11 + random() * .1
    } else {
      x = (random() - .5) * 12
      y = (random() - .5) * 9
      z = (random() - .5) * 7 - 1
      size = 1 + random() * 2
      kind = 4
      r = .82; g = .48; b = .52
    }

    if (kind <= 1 || (kind === 2 && i % 4 === 0)) {
      // Tip the blossom toward one side while leaving the stem in profile.
      const tilt = -.22
      const tiltedX = x * Math.cos(tilt) + y * Math.sin(tilt)
      const tiltedY = y * Math.cos(tilt) - x * Math.sin(tilt)
      x = tiltedX
      y = tiltedY
    }

    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
    sizes[i] = size
    phases[i] = random()
    kinds[i] = kind
    progress[i] = tip
    colors[i * 3] = r
    colors[i * 3 + 1] = g
    colors[i * 3 + 2] = b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  geometry.setAttribute('aKind', new THREE.BufferAttribute(kinds, 1))
  geometry.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  return geometry
}

export default function ParticleScene({ handDataRef, intro = false, onFps }) {
  const mountRef = useRef(null)
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return undefined
    let width = mount.clientWidth
    let height = mount.clientHeight
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(pixelRatio())
    renderer.setSize(width, height)
    renderer.setClearColor(0x08090a, 0)
    mount.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, width / height, .1, 100)
    camera.position.set(0, .1, 15)
    camera.lookAt(0, 0, 0)
    const uniforms = {
      uTime: { value: 0 },
      uSpread: { value: intro ? .85 : 1 },
      uCompression: { value: 1 },
      uBloom: { value: intro ? .86 : 1 },
      uCenter: { value: new THREE.Vector2(0, 0) },
    }
    const count = intro ? Math.min(3800, particleBudget()) : particleBudget()
    const geometry = makeRose(count)
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
    const rose = new THREE.Points(geometry, material)
    scene.add(rose)
    const rotation = createRoseRotationController()
    const clock = new THREE.Clock()
    let frame
    let lastRender = 0
    let fpsAt = performance.now()
    let rendered = 0
    let pointerX = 0
    let pointerY = 0
    function onPointer(event) {
      pointerX = (event.clientX / innerWidth - .5) * .8
      pointerY = (.5 - event.clientY / innerHeight) * .6
    }
    function resize() {
      width = mount.clientWidth; height = mount.clientHeight
      camera.aspect = width / height; camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }
    window.addEventListener('resize', resize)
    if (intro) window.addEventListener('pointermove', onPointer)

    function animate(now) {
      frame = requestAnimationFrame(animate)
      if (now - lastRender < 15.5) return
      lastRender = now
      const dt = Math.min(.05, clock.getDelta())
      uniforms.uTime.value += dt
      const hand = !intro && handDataRef.current?.primary
      const pinching = hand?.gesture === GESTURES.PINCH
      const targetX = hand && !pinching ? (0.5 - hand.center.x) * 9 : pinching ? uniforms.uCenter.value.x : pointerX
      const targetY = hand && !pinching ? (0.5 - hand.center.y) * 5.5 : pinching ? uniforms.uCenter.value.y : pointerY
      const moveRate = .055
      uniforms.uCenter.value.x = lerp(uniforms.uCenter.value.x, targetX, moveRate)
      uniforms.uCenter.value.y = lerp(uniforms.uCenter.value.y, targetY, moveRate)
      const landmarks = hand?.landmarks
      const pinchPoint = pinching && landmarks
        ? { x: (landmarks[4].x + landmarks[8].x) * .5, y: (landmarks[4].y + landmarks[8].y) * .5 }
        : null
      rotation.update(pinching, pinchPoint, handDataRef.current?.at)
      const orientation = rotation.step(dt, pinching)
      const depthSpread = hand ? clamp(1 + (hand.scale - .15) * 2.2, .78, 1.45) : 1
      const gestureSpread = hand?.gesture === GESTURES.OPEN ? 1.15 : hand?.gesture === GESTURES.FIST ? .82 : 1
      uniforms.uSpread.value = lerp(uniforms.uSpread.value, intro ? .85 : depthSpread * gestureSpread, .038)
      const bloom = intro ? .88 : hand?.gesture === GESTURES.OPEN ? 1.32 : hand?.gesture === GESTURES.FIST ? .67 : 1
      uniforms.uBloom.value = lerp(uniforms.uBloom.value, bloom, .045)
      uniforms.uCompression.value = lerp(uniforms.uCompression.value, hand?.gesture === GESTURES.FIST ? .89 : 1, .075)
      // Idle sway sits on top of the orientation left by the last pinch.
      rose.rotation.z = Math.sin(uniforms.uTime.value * .38) * .028
      const smoothing = 1 - Math.exp(-12 * dt)
      rose.rotation.y = lerp(rose.rotation.y, orientation.yaw + Math.sin(uniforms.uTime.value * .23) * .035, smoothing)
      rose.rotation.x = lerp(rose.rotation.x, orientation.pitch, smoothing)
      renderer.render(scene, camera)
      rendered += 1
      if (now - fpsAt >= 1000) {
        onFps?.(Math.round(rendered * 1000 / (now - fpsAt)))
        rendered = 0; fpsAt = now
      }
    }
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
      geometry.dispose(); material.dispose(); renderer.dispose()
      renderer.domElement.remove()
    }
  }, [handDataRef, intro, onFps])
  return <div className={`particle-stage ${intro ? 'particle-stage-intro' : ''}`} ref={mountRef} aria-hidden="true" />
}

# GESTURE//SPACE

Interactive Digital Space Controlled by Your Hands. This repository is the **first runnable stage**: introduction, webcam calibration, real-time hand landmarks and gesture data, and a colored side-view rose made from GPU particles.

## Run on Windows

Use Node.js 20.19+ and a current Chrome or Edge browser with a webcam. In VS Code, open this folder and run:

```powershell
npm install
npm run dev
```

Open the localhost address printed by Vite. Click **ENTER EXPERIENCE**, then allow camera access. The MediaPipe hand model and WASM assets are served from this project. Webcam frames remain in the browser; the app does not upload them.

```powershell
npm test
npm run build
```

## Test the first-stage interactions

1. **Open palm** — spread all fingers. Hold for about half a second to clear calibration step 1. In the particle field, the flower opens.
2. **Pinch** — bring thumb and index tip together while other fingers remain relaxed or extended. Hold to clear step 2. In the particle field, move your pinched fingers left/right to rotate the rose horizontally and up/down to tilt it. Release for a short inertial spin.
3. **Fist** — close all fingers. Hold to clear step 3. The petals fold inward.
4. **Move hand** — while not pinching, move left/right and up/down. The flower center follows with inertia. Move closer/farther to change its overall spread.

An extended index finger is also classified as **POINT** in Debug Mode. It has no scene action in this first stage.

The calibration advances automatically after those three gestures. Press **D** to show or hide the debug panel and 21 landmarks on the camera preview. Debug reports render FPS, tracking FPS, hand count, pose, heuristic confidence, palm position, palm scale, pinch distance, and movement speed. **Shift+F** skips calibration into the particle field for development checks.

If permission was denied, allow camera access in the browser site settings, then use **RETRY CAMERA**. Camera APIs require localhost or HTTPS; opening `index.html` via `file://` will not work.

## Source layout

- `src/components/GestureTracker.jsx` — webcam, MediaPipe, video inference loop.
- `src/components/CameraPreview.jsx` — live preview and 21-point debug overlay.
- `src/components/GestureCursor.jsx` — hand-driven cursor.
- `src/components/DebugPanel.jsx` — live diagnostics.
- `src/scenes/IntroScene.jsx` and `CalibrationScene.jsx` — entry and guided hand setup.
- `src/scenes/ParticleScene.jsx` — layered side-view rose, curved petals, bud, sepals, stem and leaves, rendered with Three.js BufferGeometry and a point shader. The field uses 4,000 particles on lower-spec devices and 7,600 otherwise.
- `src/utils/gestureDetection.js`, `handMath.js`, `performance.js` — geometry, pose classification, device budget.
- `public/models/hand_landmarker.task` — official MediaPipe Hand Landmarker model bundle.
- `public/wasm/` — matching MediaPipe WASM runtime, copied from the installed package.

The later Energy Orb, Gesture Paint, Portal, swipe actions, sound design, and two-hand portal interaction are planned for subsequent stages. The first stage deliberately focuses on validating the camera-to-3D pipeline.

MediaPipe reference: https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js

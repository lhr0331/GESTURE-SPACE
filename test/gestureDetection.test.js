import test from 'node:test'
import assert from 'node:assert/strict'
import { classifyHand, createGestureSmoother, GESTURES } from '../src/utils/gestureDetection.js'

const openHand = [
  [.5,.9],[.4,.8],[.32,.7],[.27,.6],[.2,.52],
  [.43,.67],[.40,.52],[.39,.39],[.38,.28],
  [.5,.64],[.5,.48],[.5,.34],[.5,.2],
  [.57,.67],[.59,.53],[.6,.41],[.61,.29],
  [.64,.72],[.68,.6],[.69,.5],[.7,.41],
].map(([x,y]) => ({ x, y, z: 0 }))

function withTips(tips) {
  const points = openHand.map(point => ({ ...point }))
  for (const [index, point] of Object.entries(tips)) points[index] = { ...point, z: 0 }
  return points
}

test('recognizes an extended palm', () => {
  assert.equal(classifyHand(openHand).gesture, GESTURES.OPEN)
})

test('recognizes pinch when thumb and index meet', () => {
  assert.equal(classifyHand(withTips({ 4: openHand[8] })).gesture, GESTURES.PINCH)
})

test('a closed fist takes precedence over coincident thumb and index tips', () => {
  const fist = withTips({ 4: {x:.43,y:.7}, 8: {x:.43,y:.7}, 12: {x:.5,y:.68}, 16: {x:.57,y:.71}, 20: {x:.64,y:.75} })
  assert.equal(classifyHand(fist).gesture, GESTURES.FIST)
})

test('a pinch still works when the other fingers are curled', () => {
  const pinch = withTips({
    4: { x: .44, y: .43 }, 8: { x: .44, y: .43 },
    12: { x: .5, y: .68 }, 16: { x: .57, y: .71 }, 20: { x: .64, y: .75 },
  })
  assert.equal(classifyHand(pinch).gesture, GESTURES.PINCH)
})

test('recognizes index pointing for debug data', () => {
  const point = withTips({ 4: {x:.24,y:.58}, 12: {x:.5,y:.68}, 16: {x:.57,y:.71}, 20: {x:.64,y:.75} })
  assert.equal(classifyHand(point).gesture, GESTURES.POINT)
})

test('one frame of pose noise does not change the stable gesture', () => {
  const smooth = createGestureSmoother()
  smooth(GESTURES.OPEN)
  smooth(GESTURES.OPEN)
  assert.equal(smooth(GESTURES.FIST), GESTURES.OPEN)
})

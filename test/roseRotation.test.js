import test from 'node:test'
import assert from 'node:assert/strict'
import { createRoseRotationController } from '../src/utils/roseRotation.js'

test('pinch begins without a rotation jump, then moves the rose on both axes', () => {
  const rotation = createRoseRotationController()
  rotation.update(true, { x: .5, y: .5 }, 1000)
  assert.deepEqual(rotation.step(.016, true), { yaw: 0, pitch: 0 })
  rotation.update(true, { x: .3, y: .6 }, 1050)
  const moved = rotation.step(.016, true)
  assert.ok(moved.yaw > 1)
  assert.ok(moved.pitch > .4)
  // The same camera frame must not be applied twice by the faster render loop.
  rotation.update(true, { x: .3, y: .6 }, 1050)
  assert.deepEqual(rotation.step(.016, true), moved)
})

test('release adds damped inertia and vertical rotation remains bounded', () => {
  const rotation = createRoseRotationController()
  rotation.update(true, { x: .5, y: .2 }, 1000)
  rotation.update(true, { x: .4, y: .8 }, 1040)
  const held = rotation.step(.016, true)
  assert.equal(held.pitch, .9)
  rotation.update(false, null, 1080)
  const released = rotation.step(.05, false)
  assert.ok(released.yaw > held.yaw)
  assert.equal(released.pitch, .9)
})

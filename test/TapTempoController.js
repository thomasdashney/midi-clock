/* eslint-env mocha */

const TapTempoController = require('../lib/TapTempoController')
const BeatClock = require('../lib/BeatClock')
const EventEmitter = require('events')
const sinon = require('sinon')
const _ = require('lodash')
const { assert } = require('chai')

class MockClock extends EventEmitter {
  tick (payload) {
    this.emit('tick', payload)
  }
}

describe('TapTempoController', () => {
  beforeEach(() => {
    this.clock = new MockClock()
    this.controller = new TapTempoController(this.clock)
  })
  describe('tap', () => {
    let resetBeatNextSyncSpy
    beforeEach(() => {
      resetBeatNextSyncSpy = sinon.spy(this.controller.beatClock, 'resetBeatNextSync')
    })

    describe('first call', () => {
      beforeEach(() => this.controller.tap())
      it('resets the beat counter on next sync', () => {
        sinon.assert.calledOnce(resetBeatNextSyncSpy)
      })
      it('flags that it just started tapping', () => {
        assert.isTrue(this.controller.justStartedTapping)
      })
    })

    describe('subsequent calls', () => {
      beforeEach(() => {
        this.controller.tap()
        resetBeatNextSyncSpy.reset()
        this.controller.tap()
      })
      it('does not reset the beat counter', () => {
        sinon.assert.notCalled(resetBeatNextSyncSpy)
      })
    })
  })

  it('calls onTick on every clock tick', () => {
    // need to stub before instantiation
    const onTickSpy = sinon.spy(TapTempoController.prototype, 'onTick')
    const controller = new TapTempoController(this.clock)
    const payload = { sync: true }
    this.clock.tick(payload)
    sinon.assert.calledOnce(onTickSpy)
    sinon.assert.calledWith(onTickSpy, payload)
    onTickSpy.restore()
    controller // make standard happy
  })

  it('wraps the clock in a beat clock', () => {
    assert.instanceOf(this.controller.beatClock, BeatClock)
    assert.equal(this.controller.beatClock.clock, this.clock)
  })

  describe('onTick', () => {
    context('started tapping', () => {
      beforeEach(() => this.controller.tap())
      it('increments ticksSinceBeatOne every tick following beat one', () => {
        this.controller.onTick({})
        assert.notOk(this.controller.tickSinceBeatOne)
        this.controller.onTick({ beat: true })
        assert.equal(this.controller.ticksSinceBeatOne, 0)
        _.times(1000, tickNum => {
          this.controller.onTick({})
          assert.equal(this.controller.ticksSinceBeatOne, tickNum + 1)
        })
      })
    })
  })
})

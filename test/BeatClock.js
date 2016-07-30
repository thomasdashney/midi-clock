/* eslint-env mocha */

const BeatClock = require('../lib/BeatClock')
const EventEmitter = require('events')
const sinon = require('sinon')
const _ = require('lodash')
const { standards } = require('../lib/constants')
const { assert } = require('chai')

const SYNCS_PER_BEAT = standards.SYNCS_PER_SIXTEENTH * 4 // beats per sixteenth

class MockClock extends EventEmitter {
  tick (payload = {}) {
    this.emit('tick', payload)
  }
}

describe('BeatClock', () => {
  beforeEach(() => {
    this.clock = new MockClock()
    this.beatClock = new BeatClock(this.clock)
    this.tickSpy = sinon.spy()
    this.beatClock.on('tick', this.tickSpy)
  })

  const sync = { sync: true }

  it('re-broadcasts clock ticks', () => {
    const numTicks = 6
    _.times(6, this.clock.tick.bind(this.clock))
    sinon.assert.callCount(this.tickSpy, numTicks)
  })

  describe('resetBeatNextSync', () => {
    it('adds beat=true to the next sync tick payload', () => {
      this.clock.tick(sync)
      sinon.assert.calledWith(this.tickSpy, sync)
      this.beatClock.resetBeatNextSync()
      this.clock.tick(sync)
      sinon.assert.calledWith(this.tickSpy, _.merge({ beat: true }, sync))
    })

    it('resets the syncsSinceLastBeat counter', () => {
      const initialCounterValue = 49
      this.beatClock.syncsSinceLastBeat = initialCounterValue
      this.beatClock.resetBeatNextSync()
      assert.equal(this.beatClock.syncsSinceLastBeat, initialCounterValue)
      this.clock.tick(sync)
      assert.equal(this.beatClock.syncsSinceLastBeat, 0)
    })
  })

  it('adds beat=true at regular sync intervals', () => {
    _.times(5, () => {
      _.times(SYNCS_PER_BEAT - 1, () => {
        this.clock.tick(sync)
        sinon.assert.calledWith(this.tickSpy, sync)
        this.tickSpy.reset()
      })
      this.clock.tick(sync)
      sinon.assert.calledWith(this.tickSpy, _.merge({ beat: true }, sync))
      this.tickSpy.reset()
    })
  })
})

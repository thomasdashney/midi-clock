/* eslint-env mocha */

const TapTempoController = require('../lib/TapTempoController')
const BeatClock = require('../lib/BeatClock')
const EventEmitter = require('events')
const sinon = require('sinon')
const _ = require('lodash')
const { assert } = require('chai')
const { standards } = require('../lib/constants')

class MockClock extends EventEmitter {
  tick (payload) {
    this.emit('tick', payload)
  }
}

describe('TapTempoController', () => {
  beforeEach(() => {
    this.now = new Date()
    this.naturalClock = sinon.useFakeTimers(this.now.getTime())
    this.clock = new MockClock()
    this.controller = new TapTempoController(this.clock)
  })

  afterEach(() => this.naturalClock.restore())

  describe('tap', () => {
    let resetBeatNextSyncSpy
    beforeEach(() => {
      resetBeatNextSyncSpy = sinon.spy(this.controller.beatClock, 'resetBeatNextSync')
    })

    it('it sets a lastTap object', () => {
      this.controller.tap()
      assert.deepEqual(this.controller.lastTap, {
        time: this.now
      })
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
      const targetBeat = 12462
      const timeSinceLastBeat = 4125
      const ticksUntilTargetBeat = 500

      beforeEach(() => {
        // initial tap
        this.controller.tap()
        resetBeatNextSyncSpy.reset()

        this.controller.ticksSinceBeatOne = targetBeat - ticksUntilTargetBeat
        sinon.stub(this.controller, 'getTargetBeat').returns(targetBeat)
        sinon.stub(this.controller, 'getTimeSinceLastBeat').returns(timeSinceLastBeat)
      })
      it('does not reset the beat counter', () => {
        this.controller.tap()
        sinon.assert.notCalled(resetBeatNextSyncSpy)
      })

      it('sets the anchor beat to the next target beat', () => {
        this.controller.tap()
        assert.equal(this.controller.anchor.beat, targetBeat)
      })

      it(['sets the clock bpm so that the target beat will be reached in the',
          'same time since the last beat'].join(' '), () => {
        const ticksPerMs = ticksUntilTargetBeat / timeSinceLastBeat
        const expectedBpm = ticksPerMs * standards.MILLISECONDS_PER_MINUTE * (1 / standards.TICKS_PER_BEAT)
        this.controller.tap()
        assert.equal(this.clock.bpm, expectedBpm)
      })

      it('sets the anchor bpm', () => {
        const ticksPerMs = standards.TICKS_PER_BEAT / timeSinceLastBeat
        const expectedBpm = ticksPerMs * standards.MILLISECONDS_PER_MINUTE * (1 / standards.TICKS_PER_BEAT)
        this.controller.tap()
        assert.equal(this.controller.anchor.bpm, expectedBpm)
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

      it('tracks the the time that the last two beats occurred at', () => {
        const firstBeatTime = new Date()
        this.controller.onTick({ beat: true })
        assert.deepEqual(this.controller.beatTimeHistory, [firstBeatTime])
        this.controller.onTick({})
        assert.deepEqual(this.controller.beatTimeHistory, [firstBeatTime])
        const timeBetweenBeats = 400
        this.naturalClock.tick(timeBetweenBeats)
        this.controller.onTick({ beat: true })
        const secondBeatTime = new Date()
        assert.deepEqual(this.controller.beatTimeHistory, [firstBeatTime, secondBeatTime])
      })
    })
  })

  describe('getTargetBeat', () => {
    context('almost reached a beat', () => {
      let nextBeat
      beforeEach(() => {
        const lastBeat = standards.TICKS_PER_BEAT * 6
        nextBeat = lastBeat + standards.TICKS_PER_BEAT
        const currentTick = lastBeat + ((nextBeat - lastBeat) / 2)
        this.controller.ticksSinceBeatOne = currentTick
      })

      it('returns the beat after next', () => {
        assert.equal(this.controller.getTargetBeat(), nextBeat + standards.TICKS_PER_BEAT)
      })
    })

    context('just passed a beat', () => {
      let nextBeat
      beforeEach(() => {
        const lastBeat = standards.TICKS_PER_BEAT * 6
        nextBeat = lastBeat + standards.TICKS_PER_BEAT
        const currentTick = lastBeat + ((nextBeat - lastBeat) / 2) - 1
        this.controller.ticksSinceBeatOne = currentTick
      })

      it('returns the next beat', () => {
        assert.equal(this.controller.getTargetBeat(), nextBeat)
      })
    })
  })

  describe('getTimeSinceLastBeat', () => {
    const timeSinceLastTap = 400
    beforeEach(() => {
      this.controller.lastTap = {
        time: new Date(new Date().getTime() - timeSinceLastTap)
      }
    })

    context('no anchor beat', () => {
      it('returns the time since the last tap', () => {
        assert.equal(this.controller.getTimeSinceLastBeat(), timeSinceLastTap)
      })
    })

    context('with anchor beat', () => {
      beforeEach(() => {
        this.controller.anchor = { beat: standards.TICKS_PER_BEAT * 8 }
      })

      context('the anchor beat was less than a beat ago', () => {
        beforeEach(() => {
          this.controller.ticksSinceBeatOne = this.controller.anchor.beat + standards.TICKS_PER_BEAT - 1
        })
        it('returns the time since the last tap', () => {
          assert.equal(this.controller.getTimeSinceLastBeat(), timeSinceLastTap)
        })
      })

      context('the anchor beat was at least a beat ago', () => {
        const timeSinceLastBeat = 400
        const timeSinceBeatBeforeLast = 900
        beforeEach(() => {
          this.controller.ticksSinceBeatOne = this.controller.anchor.beat + standards.TICKS_PER_BEAT
          const now = new Date()
          this.controller.beatTimeHistory = [
            new Date(now.getTime() - timeSinceBeatBeforeLast),
            new Date(now.getTime() - timeSinceLastBeat)]
        })

        context('just passed a beat', () => {
          it('returns the time of the beat before last', () => {
            assert.equal(this.controller.getTimeSinceLastBeat(), timeSinceBeatBeforeLast)
          })
        })
        context('almost reached a beat', () => {
          beforeEach(() => {
            this.controller.ticksSinceBeatOne += (standards.TICKS_PER_BEAT / 2) + 1
          })
          it('returns the time of the last beat', () => {
            assert.equal(this.controller.getTimeSinceLastBeat(), timeSinceLastBeat)
          })
        })
      })
    })
  })
})

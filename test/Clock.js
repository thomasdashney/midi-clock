/* eslint-env mocha */

const sinon = require('sinon')
const { assert } = require('chai')
const Clock = require('../lib/Clock')
const { standards } = require('../lib/constants')
const _ = require('lodash')

describe('Clock', () => {
  beforeEach(() => {
    this.now = new Date()
    this.naturalClock = sinon.useFakeTimers(this.now.getTime())
  })

  it('defaults to 120 bpm', () => {
    const clock = new Clock()
    assert.equal(clock.bpm, 120)
  })

  context('when running', () => {
    beforeEach(() => {
      this.clock = new Clock()
      this.ticked = sinon.spy()
      this.clock.on('tick', this.ticked)
    })

    it('repeatedly ticks every at an interval', () => {
      this.clock.millisecondsBetweenTicks = 5

      this.clock.start()
      sinon.assert.calledOnce(this.ticked)
      this.ticked.reset()

      const numExpectedTicks = 4
      this.naturalClock.tick(this.clock.millisecondsBetweenTicks * numExpectedTicks)

      sinon.assert.callCount(this.ticked, numExpectedTicks)
    })

    it('sets interval based on the bpm', () => {
      const bpm1 = 50
      this.clock.bpm = bpm1
      let ticksPerMillisecond = standards.TICKS_PER_BEAT * bpm1 / standards.MILLISECONDS_PER_MINUTE
      let millisecondsBetweenTicks = 1 / ticksPerMillisecond
      assert.equal(this.clock.millisecondsBetweenTicks, millisecondsBetweenTicks)

      const bpm2 = 120
      this.clock.bpm = bpm2
      ticksPerMillisecond = standards.TICKS_PER_BEAT * bpm2 / standards.MILLISECONDS_PER_MINUTE
      millisecondsBetweenTicks = 1 / ticksPerMillisecond
      assert.equal(this.clock.millisecondsBetweenTicks, millisecondsBetweenTicks)
    })

    it('corrects timing errors by compensating drift', () => {
      let delayedtick

      // mock setTimeout so we can send the timeout when desired
      sinon.stub(global, 'setTimeout', function (func, time) {
        delayedtick = func
      })
      this.clock.millisecondsBetweenTicks = 10
      this.clock.start()
      sinon.assert.calledOnce(this.ticked)
      this.ticked.reset()

      sinon.assert.calledOnce(global.setTimeout)
      assert.equal(this.clock.timeUntilNextTick, 10)

      // tick too long
      this.naturalClock.tick(11)
      sinon.assert.notCalled(this.ticked)
      // finally call the cb
      delayedtick()
      sinon.assert.calledOnce(this.ticked)
      assert.equal(this.clock.timeUntilNextTick, 9)

      global.setTimeout.restore()
    })

    it('emits sync=true every 4 ticks', () => {
      this.clock.millisecondsBetweenTicks = 10

      _.times(2, () => {
        _.times(3, () => {
          this.clock.tick()
          sinon.assert.calledOnce(this.ticked)
          sinon.assert.calledWith(this.ticked, {})
          this.ticked.reset()
        })

        this.clock.tick()
        sinon.assert.calledOnce(this.ticked)
        sinon.assert.calledWith(this.ticked, { sync: true })
        this.ticked.reset()
      })
    })
  })
})

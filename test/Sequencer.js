/* eslint-env mocha */

const EventEmitter = require('events')
const { assert } = require('chai')
const _ = require('lodash')

const Sequencer = require('../lib/Sequencer')

class MockClock extends EventEmitter {
  tick () {
    this.emit('tick')
  }
}

describe('Sequencer', () => {
  beforeEach(() => {
    this.clock = new MockClock()
    this.sequencer = new Sequencer(this.clock)
  })

  context('when playing', () => {
    beforeEach(() => this.sequencer._status = Sequencer.PLAYING)
    it('increments the position on every clock tick', () => {
      assert.equal(this.sequencer._position, 0)
      this.clock.tick()
      assert.equal(this.sequencer._position, 1)
      this.clock.tick()
      assert.equal(this.sequencer._position, 2)
    })
  })

  context('when paused', () => {
    beforeEach(() => this.sequencer._status = Sequencer.PAUSED)
    it('does not increment the position on clock ticks', () => {
      assert.equal(this.sequencer._position, 0)
      this.clock.tick()
      assert.equal(this.sequencer._position, 0)
    })
  })

  describe('start', () => {
    context('when paused', () => {
      beforeEach(() => this.sequencer._status = Sequencer.PAUSED)
      it('starts the sequencer at position 0 at the next clock sync', () => {
        this.sequencer._position = 50
        this.sequencer.start()
        assert.equal(this.sequencer.status, Sequencer.PAUSED)
        this.sequencer.sync()
        assert.equal(this.sequencer.status, Sequencer.PLAYING)
        assert.equal(this.sequencer._position, 0)
      })
    })

    context('when playing', () => {
      beforeEach(() => this.sequencer._status = Sequencer.PLAYING)
      it('continues playing and resets the position to 0 at the next sync', () => {
        this.sequencer._position = 50
        _.times(3, this.sequencer.sync.bind(this.sequencer))
        this.sequencer.start()
        assert.equal(this.sequencer.status, Sequencer.PLAYING)
        assert.equal(this.sequencer._position, 50)
        this.sequencer.sync()
        assert.equal(this.sequencer._position, 0)
      })
    })
  })

  describe('continue', () => {
    context('when paused', () => {
      beforeEach(() => this.sequencer._status = Sequencer.PAUSED)
      it('continues incrementing position on next clock tick', () => {
        this.sequencer._position = 50
        this.clock.tick()
        assert.equal(this.sequencer._position, 50)
        this.sequencer.continue()
        assert.equal(this.sequencer.status, Sequencer.PLAYING)
      })
    })
  })

  describe('stop', () => {
    context('when playing', () => {
      beforeEach(() => this.sequencer._status = Sequencer.PAUSED)
      it('stops the sequencer and maintains position', () => {
        this.sequencer._position = 50
        this.sequencer.stop()
        assert.equal(this.sequencer._status, Sequencer.PAUSED)
        assert.equal(this.sequencer._position, 50)
      })
    })
  })
})

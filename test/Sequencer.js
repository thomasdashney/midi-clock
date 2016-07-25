/* eslint-env mocha */

const EventEmitter = require('events')
const { assert } = require('chai')
const _ = require('lodash')

const Sequencer = require('../lib/Sequencer')

class MockClock extends EventEmitter { }

describe('Sequencer', () => {
  beforeEach(() => {
    this.sequencer = new Sequencer(new MockClock())
  })

  context('when playing', () => {
    beforeEach(() => this.sequencer._status = Sequencer.PLAYING)
    it('increments the position every 6 syncs', () => {
      assert.equal(this.sequencer.position, 0)
      _.times(6, this.sequencer.sync.bind(this.sequencer))
      assert.equal(this.sequencer.position, 1)
      _.times(6, this.sequencer.sync.bind(this.sequencer))
      assert.equal(this.sequencer.position, 2)
    })
  })

  describe('start', () => {
    context('when paused', () => {
      beforeEach(() => this.sequencer._status = Sequencer.PAUSED)
      it('starts the sequencer at position 0 at the next clock sync', () => {
        this.sequencer.position = 50
        this.sequencer.start()
        assert.equal(this.sequencer.status, Sequencer.PAUSED)
        this.sequencer.sync()
        assert.equal(this.sequencer.status, Sequencer.PLAYING)
        assert.equal(this.sequencer.position, 0)
        _.times(6, this.sequencer.sync.bind(this.sequencer))
        assert.equal(this.sequencer.position, 1)
      })
    })

    context('when playing', () => {
      beforeEach(() => this.sequencer._status = Sequencer.PLAYING)
      it('continues playing and resets the position to 0 at the next sync', () => {
        this.sequencer.position = 50
        _.times(3, this.sequencer.sync.bind(this.sequencer))
        this.sequencer.start()
        assert.equal(this.sequencer.status, Sequencer.PLAYING)
        assert.equal(this.sequencer.position, 50)
        this.sequencer.sync()
        assert.equal(this.sequencer.position, 0)
      })
    })
  })

  describe('continue', () => {
    context('when paused', () => {
      beforeEach(() => this.sequencer._status = Sequencer.PAUSED)
      it('continues incrementing position at next sync', () => {
        this.sequencer.position = 50
        this.sequencer.continue()
        assert.equal(this.sequencer.status, Sequencer.PLAYING)
        _.times(5, this.sequencer.sync.bind(this.sequencer))
        assert.equal(this.sequencer.position, 50)
        this.sequencer.sync()
        assert.equal(this.sequencer.position, 51)
      })
    })
  })

  describe('stop', () => {
    context('when playing', () => {
      beforeEach(() => this.sequencer._status = Sequencer.PAUSED)
      it('stops the sequencer and maintains position', () => {
        this.sequencer.position = 50
        this.sequencer.stop()
        assert.equal(this.sequencer._status, Sequencer.PAUSED)
        assert.equal(this.sequencer.position, 50)
      })
    })
  })
})

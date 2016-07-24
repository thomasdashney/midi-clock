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

  describe('start', () => {
    context('when paused', () => {
      it('starts the sequencer at position 0 at the next clock sync', () => {
        this.sequencer.position = 50
        this.sequencer.start()
        assert.equal(this.sequencer.status, Sequencer.PENDING)
        this.sequencer.sync()
        assert.equal(this.sequencer.status, Sequencer.PLAYING)
        assert.equal(this.sequencer.position, 0)
        _.times(6, this.sequencer.sync.bind(this.sequencer))
        assert.equal(this.sequencer.position, 1)
      })
    })
  })
})

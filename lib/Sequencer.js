const EventEmitter = require('events')
const { standards } = require('./constants')
const _ = require('lodash')

const classConstants = {
  PAUSED: 0,
  PLAYING: 1
}

function processClockTick () {
  this.ticksSinceLastSync++
  if (this.ticksSinceLastSync === this.ticksPerSync) {
    sync.call(this)
    this.ticksSinceLastSync = 0
  }
}

function sync () {
  this.emit('sync')
}

class Sequencer extends EventEmitter {
  constructor (clock) {
    super()
    this.clock = clock
    this._status = Sequencer.PAUSED
    this.position = 0
    this.ticksSinceLastSync = 0
    const SYNCS_PER_BEAT = standards.SYNCS_PER_SIXTEENTH * standards.SIXTEENTHS_PER_BEAT
    this.ticksPerSync = standards.TICKS_PER_BEAT * (1 / SYNCS_PER_BEAT)

    clock.on('tick', processClockTick.bind(this))
  }

  /**
   * Public Methods
   */
  start () {
    this._status = Sequencer.PLAYING
    this.emit('started')
  }
  stop () {
    this._status = Sequencer.PAUSED
    this.emit('stopped')
  }
  continue () {
    this._status = Sequencer.PLAYING
    this.emit('continued')
  }
  get status () { return this._status }
}

// export these for testing
const privateMethods = {
  processClockTick,
  sync
}

_.assign(Sequencer, classConstants, { private: privateMethods })

module.exports = Sequencer

const EventEmitter = require('events')
const constants = require('./constants')
const _ = require('lodash')

const seqConstants = {
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

const privateMethods = {
  processClockTick,
  sync
}

class Sequencer extends EventEmitter {
  constructor (clock) {
    super()
    this.clock = clock
    this._status = Sequencer.PAUSED
    this.position = 0
    this.ticksSinceLastSync = 0
    const SYNCS_PER_BEAT = constants.SYNCS_PER_SIXTEENTH * constants.SIXTEENTHS_PER_BEAT
    this.ticksPerSync = constants.TICKS_PER_BEAT * (1 / SYNCS_PER_BEAT)

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
    this._status = Sequencer.STOPPED
    this.emit('stopped')
  }
  continue () {
    this._status = Sequencer.PLAYING
    this.emit('continued')
  }
  status () { return this._status }
}

_.assign(Sequencer, seqConstants, privateMethods)

module.exports = Sequencer

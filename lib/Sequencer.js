const EventEmitter = require('events')
const { standards } = require('./constants')
const _ = require('lodash')

const classConstants = {
  PAUSED: Symbol('PAUSED'),
  PLAYING: Symbol('PLAYING'),
  PENDING: Symbol('PENDING')
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

    clock.on('tick', this.processClockTick.bind(this))
  }

  /**
   * Public Methods
   */
  start () {
    if (this.status === Sequencer.PAUSED) {
      this._status = Sequencer.PENDING
    }
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

  /**
   * Private Methods
   */
  processClockTick () {
    this.ticksSinceLastSync++
    if (this.ticksSinceLastSync === this.ticksPerSync) {
      this.sync()
      this.ticksSinceLastSync = 0
    }
  }

  sync () {
    if (this.status === Sequencer.PENDING) {
      this._status = Sequencer.PLAYING
      this.position = 0
      this.syncsSinceLastPosition = 0
    } else if (this.status === Sequencer.PLAYING) {
      this.syncsSinceLastPosition++
      if (this.syncsSinceLastPosition === 6) {
        this.syncsSinceLastPosition = 0
        this.position++
      }
    }
    this.emit('sync')
  }
}

_.assign(Sequencer, classConstants)

module.exports = Sequencer

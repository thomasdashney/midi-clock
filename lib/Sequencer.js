const EventEmitter = require('events')
const { standards } = require('./constants')
const _ = require('lodash')

const classConstants = {
  PAUSED: Symbol('PAUSED'),
  PLAYING: Symbol('PLAYING')
}

class Sequencer extends EventEmitter {
  constructor (clock) {
    super()
    this.clock = clock
    this._status = Sequencer.PAUSED
    this._position = 0
    const SYNCS_PER_BEAT = standards.SYNCS_PER_SIXTEENTH * standards.SIXTEENTHS_PER_BEAT
    this.ticksPerSync = standards.TICKS_PER_BEAT * (1 / SYNCS_PER_BEAT)
    this.ticksSinceLastSync = 0
    this.position = 0

    clock.on('tick', this.processClockTick.bind(this))
  }

  /**
   * Public Methods
   */
  start () {
    this.pendingRestart = true
    this.emit('started')
  }
  stop () {
    this._status = Sequencer.PAUSED
    this.syncsSinceLastPosition = 0
    this.emit('stopped')
  }
  continue () {
    if (this.status === Sequencer.PAUSED) {
      this._status = Sequencer.PLAYING
    }
    this.emit('continued')
  }
  get status () { return this._status }

  /**
   * Called each time a clock ticks
   * Syncs up every this.ticksPerSync
   */
  processClockTick () {
    this.ticksSinceLastSync++
    if (this.ticksSinceLastSync === this.ticksPerSync) {
      this.sync()
      this.ticksSinceLastSync = 0
    }
  }

  /**
   * Emits a "sync" event so midi devices can sync up
   * If playing, will advance position every 6 syncs
   */
  sync () {
    if (this.status === Sequencer.PLAYING) {
      if (this.pendingRestart) {
        this.moveToStart()
      } else {
        this.syncsSinceLastPosition++
        if (this.syncsSinceLastPosition === 6) { // TODO replace 6 with a constant
          this.position++
        }
      }
    } else if (this.status === Sequencer.PAUSED && this.pendingRestart) {
      this.moveToStart()
      this._status = Sequencer.PLAYING
    }

    this.emit('sync')
  }

  moveToStart () {
    this.pendingRestart = false
    this.position = 0
  }

  set position (position) {
    this._position = position
    this.syncsSinceLastPosition = 0
  }

  get position () { return this._position }
}

_.assign(Sequencer, classConstants)

module.exports = Sequencer

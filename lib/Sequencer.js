const EventEmitter = require('events')
const { standards } = require('./constants')
const _ = require('lodash')

const classConstants = {
  PAUSED: 0,
  PLAYING: 1
}

class Sequencer extends EventEmitter {
  constructor (clock) {
    super()
    this.clock = clock
    this._status = Sequencer.PAUSED
    this.ticksPerSongPosition = this.ticksPerSync * standards.SYNCS_PER_SIXTEENTH
    this._position = 0

    clock.on('tick', this.processClockTick.bind(this))
  }

  /**
   * Public Methods
   */
  start () {
    this.emit('started')
    this.pendingStart = true // wait until next clock sync
  }
  stop () {
    this._status = Sequencer.PAUSED
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
  processClockTick (payload) {
    if (payload.sync) {
      this.sync()
    }
    // TODO: play any notes, etc. here
    if (this.status === Sequencer.PLAYING) {
      this.incrementPosition() // for next time
    }
  }

  /**
   * Emits a "sync" event so midi devices can sync up
   * If playing, will advance position every 6 syncs
   */
  sync () {
    if (this.pendingStart) {
      this.moveToStart()
      if (this.status === Sequencer.PAUSED) {
        this._status = Sequencer.PLAYING
      }
    }
  }

  moveToStart () {
    this.pendingStart = false
    this._position = 0
  }

  incrementPosition () {
    this._position++
  }

  /**
   * Position setters and getters represent # of sixteenth notes since position 0
   */
  set position (newPosition) {
    this.emit('position', newPosition)
    this._position = newPosition * this.ticksPerSongPosition
  }
  get position () { return Math.floor(this._position * this.ticksPerSongPosition) }
}

_.assign(Sequencer, classConstants)

module.exports = Sequencer

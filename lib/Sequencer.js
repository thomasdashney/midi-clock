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
    const SYNCS_PER_BEAT = standards.SYNCS_PER_SIXTEENTH * standards.SIXTEENTHS_PER_BEAT
    this.ticksPerSync = standards.TICKS_PER_BEAT * (1 / SYNCS_PER_BEAT)
    this.ticksPerSongPosition = this.ticksPerSync * standards.SYNCS_PER_SIXTEENTH
    this.ticksSinceLastSync = 0
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
  processClockTick () {
    this.ticksSinceLastSync++
    if (this.ticksSinceLastSync === this.ticksPerSync) {
      this.sync()
      this.ticksSinceLastSync = 0
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

    this.emit('sync')
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

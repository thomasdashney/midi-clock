const EventEmitter = require('events')
const constants = require('./constants')

class Sequencer extends EventEmitter {
  constructor (clock) {
    super()
    this.clock = clock
    this.isRunning = false
    this.ticksSinceLastSync = 0
    const SYNCS_PER_BEAT = constants.SYNCS_PER_SIXTEENTH * constants.SIXTEENTHS_PER_BEAT
    this.ticksPerSync = constants.TICKS_PER_BEAT * (1 / SYNCS_PER_BEAT)

    clock.on('tick', this.processClockTick.bind(this))
  }

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
    this.emit('sync')
  }

  /**
   * Public Methods
   */
  start () {
    this.isRunning = true
    this.emit('started')
  }
  stop () {
    this.isRunning = false
    this.emit('stopped')
  }
  continue () {
    this.isRunning = true
    this.emit('continued')
  }
}

module.exports = Sequencer

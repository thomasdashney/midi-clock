const { standards } = require('./constants')
const EventEmitter = require('events')

const SYNCS_PER_BEAT = standards.SYNCS_PER_SIXTEENTH * 4 // beats per sixteenth

/**
 * Wraps the clock, emitting a tick with additional parameters
 */
class BeatClock extends EventEmitter {
  constructor (clock) {
    super()
    this.syncsSinceLastBeat = 0
    clock.on('tick', this.processTick.bind(this))
  }
  /**
   * Process a tick received
   * Emits a new tick, adding beat=true to the payload if
   *   - it has been SYNCS_PER_BEAT since the last beat, or
   *   - it had an external request to start the sync on the next beat (pendingSyncReset)
   */
  processTick (payload) {
    if (payload.sync) {
      if (this.pendingSyncReset) {
        payload.beat = true
        this.pendingSyncReset = false
        this.syncsSinceLastBeat = 0
      } else {
        this.syncsSinceLastBeat++
        if (this.syncsSinceLastBeat === SYNCS_PER_BEAT) {
          payload.beat = true
          this.syncsSinceLastBeat = 0
        }
      }
    }

    this.emit('tick', payload)
  }
  resetBeatNextSync () {
    this.pendingSyncReset = true
  }
}

module.exports = BeatClock

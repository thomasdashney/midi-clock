const EventEmitter = require('events')
const { standards } = require('./constants')

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
  processTick (payload) {
    if (payload.sync) {
      this.syncsSinceLastBeat++
      if (this.syncsSinceLastBeat === SYNCS_PER_BEAT) {
        payload.beat = true
        this.syncsSinceLastBeat = 0
      }
    }

    this.emit('tick', payload)
  }
}

class TapClock {
  constructor (clock) {
    this.clock = clock
    this.beatClock = new BeatClock(clock)
    this.beatClock.on('tick', this.onTick.bind(this))
  }
  tap () {
  }
  onTick (payload) {
  }
}

module.exports = TapClock

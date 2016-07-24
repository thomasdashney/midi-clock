const EventEmitter = require('events')
const { standards } = require('./constants')

const DEFAULT_BPM = 120

class Clock extends EventEmitter {
  constructor () {
    super()
    this.bpm = DEFAULT_BPM
    this.isRunning = false
  }
  set bpm (bpm) {
    this._bpm = bpm
    const ticksPerMillisecond = standards.TICKS_PER_BEAT * this.bpm / standards.MILLISECONDS_PER_MINUTE
    this.millisecondsBetweenTicks = 1 / ticksPerMillisecond
  }
  get bpm () { return this._bpm }
  start () {
    this.isRunning = true
    this.tick()
  }
  stop () {
    this.isRunning = false
    this.lastTickedAt = null
  }
  tick () {
    this.emit('tick')

    const now = new Date()
    if (this.lastTickedAt) {
      // compensate javascript timing inaccuracies
      const timeSinceLastTick = now - this.lastTickedAt
      const drift = timeSinceLastTick - this.timeUntilNextTick
      this.timeUntilNextTick = this.millisecondsBetweenTicks - drift
    } else {
      this.timeUntilNextTick = this.millisecondsBetweenTicks
    }
    this.lastTickedAt = now

    if (this.isRunning) {
      setTimeout(this.tick.bind(this), this.timeUntilNextTick)
    }
  }
}

module.exports = Clock

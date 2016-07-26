const EventEmitter = require('events')
const { standards } = require('./constants')

const DEFAULT_BPM = 120

class Clock extends EventEmitter {
  constructor (startBpm = DEFAULT_BPM) {
    super()
    this.bpm = startBpm
    this.ticksSinceLastSync = 0
    this.isRunning = false

    const SYNCS_PER_BEAT = standards.SYNCS_PER_SIXTEENTH * standards.SIXTEENTHS_PER_BEAT
    this.ticksPerSync = standards.TICKS_PER_BEAT * (1 / SYNCS_PER_BEAT)
  }
  set bpm (bpm) {
    this._bpm = bpm
    const ticksPerMillisecond = standards.TICKS_PER_BEAT * this.bpm / standards.MILLISECONDS_PER_MINUTE
    this.millisecondsBetweenTicks = 1 / ticksPerMillisecond
  }
  get bpm () { return this._bpm }
  start () {
    this.isRunning = true
    this.ticksSinceLastSync = 0
    this.tick()
  }
  stop () {
    this.isRunning = false
    this.lastTickedAt = null
  }
  tick () {
    let isSyncTick = false

    this.ticksSinceLastSync++
    if (this.ticksSinceLastSync === this.ticksPerSync) {
      isSyncTick = true
      this.ticksSinceLastSync = 0
    }

    this.emit('tick', isSyncTick)

    const now = new Date()
    if (this.lastTickedAt) {
      // compensate javascript timing inaccuracies
      const timeSinceLastTick = now - this.lastTickedAt
      const drift = timeSinceLastTick - (this.timeUntilNextTick || 0)
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

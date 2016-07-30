const { standards } = require('./constants')
const BeatClock = require('./BeatClock')
const _ = require('lodash')

const MS_PER_MINUTE = 60000
const MAX_BEAT_HISTORY_LENGTH = 10
const HALFWAY_POINT = standards.TICKS_PER_BEAT / 2

class TapTempoController {
  constructor (clock) {
    this.clock = clock
    this.beatClock = new BeatClock(clock)
    this.beatClock.on('tick', this.onTick.bind(this))
    this.beatTimeHistory = []
  }

  /**
   * Need to find:
   * - the target beat that we're trying to reach
   *   - if early beat
   *     - the beat after next
   *   - else
   *     - if the next beat is > half a beat away, choose that beat
   *     - if the next beat is < half a beat away, choose the next beat
   *
   * - how long until that beat should be reached
   *   - calculate when the next beat should occur by subtracting time between this tap and last tap
   *   - use remaining ticks until target beat
   *   - calculate bpm required to tick the remaining ticks and reach the target time
   *
   * - what tempo we want to be at when we get there
   * 		- 'targetBpm'
   */

  ticksSinceLastBeat () {
    return this.ticksSinceBeatOne % standards.TICKS_PER_BEAT
  }

  getTargetBeat () {
    const ticksSinceLastBeat = this.ticksSinceLastBeat()
    const nextBeat = this.ticksSinceBeatOne - ticksSinceLastBeat + standards.TICKS_PER_BEAT

    if (ticksSinceLastBeat < HALFWAY_POINT) {
      return nextBeat
    } else {
      return nextBeat + standards.TICKS_PER_BEAT
    }
  }

  getTimeSinceLastBeat () {
    let lastBeatAt
    if (!this.anchor || (this.anchor && this.ticksSinceBeatOne < this.anchor + standards.TICKS_PER_BEAT)) {
      lastBeatAt = this.lastTap.time
    } else {
      if (this.ticksSinceLastBeat() < HALFWAY_POINT) {
        lastBeatAt = _.nth(this.beatTimeHistory, -2)
      } else {
        lastBeatAt = _.nth(this.beatTimeHistory, -1)
      }
    }

    return new Date().getTime() - lastBeatAt.getTime()
  }

  getNumTicksUntilBeat (beat) {
    return beat - this.ticksSinceBeatOne
  }

  tap () {
    const now = new Date()

    if (this.lastTap) {
      const ticksSinceLastBeat = this.ticksSinceBeatOne % standards.TICKS_PER_BEAT

      let ticksUntilNextBeat
      if (ticksSinceLastBeat < standards.TICKS_PER_BEAT) {
        // too early
        ticksUntilNextBeat = standards.TICKS_PER_BEAT - this.ticksSinceLastBeat + standards.TICKS_PER_BEAT
      } else {
        ticksUntilNextBeat = standards.TICKS_PER_BEAT - (this.ticksSinceLastBeat % standards.TICKS_PER_BEAT)
      }

      const msBetweenBeats = now.getTime() - this.lastTap.time
      const msUntilNextTick = msBetweenBeats
      const bpm = (ticksUntilNextBeat / msUntilNextTick) * (1 / standards.TICKS_PER_BEAT) * (MS_PER_MINUTE / 1)
      this.clock.bpm = bpm
      // console.log('ticks since beat one', this.ticksSinceBeatOne)
      // console.log('ticks since last beat', ticksSinceLastBeat)
      // console.log('ms between beats', msBetweenBeats)
      // console.log('ticks until next beat', ticksUntilNextBeat)
      // console.log('ms until next tick', msUntilNextTick)
      // console.log('bpm', bpm)
    } else {
      this.beatClock.resetBeatNextSync() // start the beat at the first tap
      this.justStartedTapping = true
      this.hasTapped = true
    }

    this.lastTap = {
      time: now
    }
  }
  onTick (payload) {
    if (this.justStartedTapping && payload.beat) { // right after first tap
      this.ticksSinceBeatOne = 0
      this.justStartedTapping = false
    } else if (this.ticksSinceBeatOne !== undefined && this.hasTapped) {
      this.ticksSinceBeatOne++
    }

    if (payload.beat) {
      if (this.beatTimeHistory.length >= MAX_BEAT_HISTORY_LENGTH) {
        this.beatTimeHistory = _.tail(this.beatTimeHistory)
      }
      this.beatTimeHistory.push(new Date())
    }
  }
}

module.exports = TapTempoController

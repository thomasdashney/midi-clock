const EventEmitter = require('events')

class Sequencer extends EventEmitter {
  constructor () {
    super()
    this.isRunning = false
  }
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

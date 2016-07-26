const EventEmitter = require('events')

class MidiOutput extends EventEmitter {
  constructor (port, name) {
    super()
    this.port = port
    this.name = name
    this.port.on('message', this.onMessageReceived.bind(this))
  }

  onMessageReceived (deltaTime, message) {
    this.emit('message', deltaTime, message)
  }

  destroy () {
    this.port.closePort()
  }
}

module.exports = MidiOutput

const Output = require('./Output')

class MidiOutput extends Output {
  constructor (port, name) {
    super()
    this.port = port
    this.name = name
  }

  send (message) {
    this.port.sendMessage(message)
  }

  destroy () {
    this.port.closePort()
  }
}

module.exports = MidiOutput

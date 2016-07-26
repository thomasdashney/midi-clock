const Input = require('./Input')

class MidiInput extends Input {
  constructor (port, name) {
    super()
    this.port = port
    this.name = name
    this.port.on('message', (deltaTime, message) => {
      this.emit('message', { deltaTime, message })
    })
  }

  destroy () {
    this.port.closePort()
  }
}

module.exports = MidiInput

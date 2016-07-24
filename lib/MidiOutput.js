class MidiOutput {
  constructor (port, name) {
    this.port = port
    this.name = name
  }

  send (message) {
    this.port.sendMessage(message)
  }
}

module.exports = MidiOutput

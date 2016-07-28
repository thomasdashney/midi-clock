class Connector {
  constructor (input, output) {
    this.input = input
    this.output = output
    this.input.on('message', this.onMessage.bind(this))
  }
  onMessage (payload) {
    if (this.processor) {
      this.processor(payload, this.output.send.bind(this.output))
    } else {
      this.output.send(payload)
    }
  }
  addProcessor (processor) {
    this.processor = processor
  }
  removeProcessor () {
    this.processor = null
  }
  destroy () {
    this.input.removeListener('message', this.onMessage.bind(this))
  }
}

module.exports = Connector

class Connector {
  constructor (input, output) {
    this.input = input
    this.output = output
    this.input.on('message', payload => {
      if (this.processor) {
        this.processor(payload, this.output.send.bind(this.output))
      } else {
        this.output.send(payload)
      }
    })
  }
  addProcessor (processor) {
    this.processor = processor
  }
  removeProcessor () {
    this.processor = null
  }
}

module.exports = Connector

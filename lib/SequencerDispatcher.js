const _ = require('lodash')
const Sequencer = require('./Sequencer')
const messages = require('./midiMessages')

/**
 * Dispatches sequencer events to MIDI outputs
 */
class SequencerDispatcher {
  constructor (sequencer, outputs = []) {
    this.sequencer = sequencer
    this._outputs = outputs
  }
  set outputs (outputs = []) {
    const updatedOutputs = _.xor(this.outputs, outputs)
    this._outputs = outputs
    const syncMessage = this.sequencer.status === Sequencer.PLAYING ? messages.SEQ_START : messages.SEQ_STOP
    updatedOutputs.forEach(output => output.send([syncMessage]))
  }
  get outputs () {
    return this._outputs
  }
  sendToOutputs (message) {
    this._outputs.forEach(output => output.send(message))
  }
  listen () {
    const seqMessages = {
      sync: messages.TIMING_CLOCK,
      started: messages.SEQ_START,
      stopped: messages.SEQ_STOP,
      continued: messages.SEQ_CONTINUE
    }
    _.forEach(seqMessages, (message, event) => {
      this.sequencer.on(event, () => {
        this.sendToOutputs([message])
      })
    })
  }
}

module.exports = SequencerDispatcher

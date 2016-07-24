const _ = require('lodash')
const Sequencer = require('./Sequencer')
const { midiMessages } = require('./constants')

/**
 * Dispatches sequencer events to MIDI outputs
 */
class SequencerDispatcher {
  constructor (sequencer, outputs = []) {
    this.sequencer = sequencer
    this._outputs = outputs
  }
  set outputs (outputs = []) {
    const newOutputs = _.difference(outputs, this.outputs)
    const syncMessage = this.sequencer.status === Sequencer.PLAYING ? midiMessages.SEQ_START : midiMessages.SEQ_STOP
    newOutputs.forEach(output => output.send([syncMessage]))

    if (this.sequencer.status === Sequencer.PLAYING) {
      const oldOutputs = _.difference(this.outputs, outputs)
      oldOutputs.forEach(output => output.send([midiMessages.SEQ_STOP]))
    }

    this._outputs = outputs
  }
  get outputs () {
    return this._outputs
  }
  sendToOutputs (message) {
    this._outputs.forEach(output => output.send(message))
  }
  listen () {
    const seqMessages = {
      sync: midiMessages.TIMING_CLOCK,
      started: midiMessages.SEQ_START,
      stopped: midiMessages.SEQ_STOP,
      continued: midiMessages.SEQ_CONTINUE
    }
    _.forEach(seqMessages, (message, event) => {
      this.sequencer.on(event, () => {
        this.sendToOutputs([message])
      })
    })
  }
}

module.exports = SequencerDispatcher

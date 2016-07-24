const midi = require('midi')
const { output: Output } = midi
const _ = require('lodash')
const MidiOutput = require('./MidiOutput')

// the way the midi api works, we'll need initial master "ports" to query ports
// it's weird
// https://github.com/justinlatimer/node-midi
const masterOutput = new Output()

let outputPorts

module.exports = {
  getOutputPorts: () => {
    if (!outputPorts) {
      outputPorts = _.times(masterOutput.getPortCount(), portNum => {
        const newPort = new Output()
        newPort.openPort(portNum)
        return new MidiOutput(newPort, masterOutput.getPortName(portNum))
      })
    }
    return outputPorts
  }
}

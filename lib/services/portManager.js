const midi = require('midi')
const { output: Output } = midi
const _ = require('lodash')
const MidiOutput = require('../MidiOutput')

// the way the midi api works, we'll need initial master "ports" to query ports
// it's weird
// https://github.com/justinlatimer/node-midi
const masterOutput = new Output()

let outputPorts = []
let virtualPorts = []

function portName (index) {
  return masterOutput.getPortName(index)
}

function buildPort (index) {
  const newPort = new Output()
  newPort.openPort(index)
  return new MidiOutput(newPort, portName(index))
}

module.exports = {
  getOutputPorts: () => {
    const visiblePorts = _.times(masterOutput.getPortCount(), portNum => {
      return {
        index: portNum,
        name: portName(portNum)
      }
    })

    // remove old ports
    _.remove(outputPorts, port => !_.find(visiblePorts, { name: port.name }))
      .forEach(port => port.destroy())

    // add new ones since last time
    const newPorts = _.filter(visiblePorts, port => {
      return !_.find(outputPorts, { name: port.name })
    }).map(port => buildPort(port.index))
    outputPorts = outputPorts.concat(newPorts)

    return outputPorts.concat(virtualPorts)
  },

  createVirtualOutputPort: (name = 'Virtual Sequencer Output') => {
    const newPort = new Output()
    newPort.openVirtualPort(name)
    virtualPorts.push(new MidiOutput(newPort, name))
  }
}

const midi = require('midi')
const { output: Output, input: Input } = midi
const _ = require('lodash')
const MidiInput = require('../MidiInput')
const MidiOutput = require('../MidiOutput')

// the way the midi api works, we'll need initial master "ports" to query ports
// it's weird
// https://github.com/justinlatimer/node-midi
const masterPorts = {
  input: new Input(),
  output: new Output()
}

const types = {
  input: Input,
  output: Output
}

const wrappers = {
  input: MidiInput,
  output: MidiOutput
}

let ports = {
  input: [],
  output: []
}

let virtualOutputs = []

function portName (type, index) {
  const masterPort = masterPorts[type]
  return masterPort.getPortName(index)
}

function buildPort (type, index) {
  const newPort = new types[type]()
  newPort.openPort(index)
  return new wrappers[type](newPort, portName(type, index))
}

function getPorts (type) {
  const masterPort = masterPorts[type]
  const visiblePorts = _.times(masterPort.getPortCount(), portNum => {
    return {
      index: portNum,
      name: portName(type, portNum)
    }
  })

  // remove old ports
  _.remove(ports[type], port => !_.find(visiblePorts, { name: port.name }))
    .forEach(port => port.destroy())

  // add new ones since last time
  const newPorts = _.filter(visiblePorts, port => {
    return !_.find(ports[type], { name: port.name })
  }).map(port => buildPort(type, port.index))
  ports[type] = ports[type].concat(newPorts)

  return ports[type].concat(virtualOutputs)
}

module.exports = {
  getOutputPorts: () => getPorts('output'),
  getInputPorts: () => getPorts('input'),

  createVirtualOutputPort: (name = 'Virtual Sequencer Output') => {
    const newPort = new Output()
    newPort.openVirtualPort(name)
    virtualOutputs.push(new MidiOutput(newPort, name))
  }
}

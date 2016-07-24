/**
 * Entry-point for command-line version
 */

const { portManager } = require('./src/services')
const fs = require('fs')

// load configurations
const virtualPortNamesPath = __dirname + '/config/virtualPorts.js'
if (fs.existsSync(virtualPortNamesPath)) {
  require(virtualPortNamesPath).forEach(portManager.createVirtualOutputPort)
}

// core
const Clock = require('./src/Clock')
const clock = new Clock()
clock.start()

const Sequencer = require('./src/sequencer')
const sequencer = new Sequencer(clock)

const SequencerDispatcher = require('./src/SequencerDispatcher')
const sequencerDispatcher = new SequencerDispatcher(sequencer)
sequencerDispatcher.listen()

// cli
const CLI = require('./src/cli')
const cli = new CLI({ clock, sequencer, sequencerDispatcher })
cli.start()

/**
 * Entry-point for command-line version
 */

const portManager = require('./lib/portManager')
const fs = require('fs')

// load configurations
const virtualPortNamesPath = __dirname + '/config/virtualPorts.js'
if (fs.existsSync(virtualPortNamesPath)) {
  require(virtualPortNamesPath).forEach(portManager.createVirtualOutputPort)
}

// core
const Clock = require('./lib/Clock')
const clock = new Clock()
clock.start()

const Sequencer = require('./lib/sequencer')
const sequencer = new Sequencer(clock)

const SequencerDispatcher = require('./lib/SequencerDispatcher')
const sequencerDispatcher = new SequencerDispatcher(sequencer)
sequencerDispatcher.listen()

// cli
const CLI = require('./lib/cli')
const cli = new CLI({ clock, sequencer, sequencerDispatcher })
cli.start()

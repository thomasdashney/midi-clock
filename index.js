/**
 * Entry-point for command-line version
 */

const { portManager } = require('./lib/services')
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

const TapTempoController = require('./lib/TapTempoController')
const tapTempoController = new TapTempoController(clock)

const Sequencer = require('./lib/sequencer')
const sequencer = new Sequencer(clock)

const MidiDispatcher = require('./lib/MidiDispatcher')
const midiDispatcher = new MidiDispatcher({ sequencer, clock })
midiDispatcher.listen()

// cli
const CLI = require('./lib/cli')
const cli = new CLI({ clock, tapTempoController, sequencer, midiDispatcher })
cli.start()

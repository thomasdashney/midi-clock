/**
 * Entry-point for command-line version
 */

const portManager = require('./lib/portManager')
const messages = require('./lib/midiMessages')
const vorpal = require('vorpal')()
const fs = require('fs')
const cmd = () => vorpal.activeCommand
const _ = require('lodash')

// load configurations
const virtualPortNamesPath = __dirname + '/config/virtualPorts.js'
if (fs.existsSync(virtualPortNamesPath)) {
  require(virtualPortNamesPath).forEach(portManager.createVirtualOutputPort)
}

let outputs = []

function sendToOutputs (message) {
  outputs.forEach(output => output.send(message))
}

const Clock = require('./lib/Clock')
const clock = new Clock()
clock.start()
clock.on('tick', tick => {
  sendToOutputs([messages.SEQ_TICK])
})

const Sequencer = require('./lib/sequencer')
const sequencer = new Sequencer()
const sequencerEvents = {
  started: () => sendToOutputs([messages.SEQ_START]),
  stopped: () => sendToOutputs([messages.SEQ_STOP]),
  continued: () => sendToOutputs([messages.SEQ_CONTINUE])
}
_.forEach(sequencerEvents, (action, event) => sequencer.on(event, action))

const configurations = [
  {
    name: 'Clock Forwards',
    configure: done => {
      const outputPorts = portManager.getOutputPorts()
      cmd().prompt({
        type: 'checkbox',
        name: 'outputs',
        message: 'Select MIDI ports to forward the clock to',
        choices: _.map(outputPorts, port => {
          return {
            name: port.name,
            value: port,
            checked: _.includes(outputs, port)
          }
        })
      }).then(results => {
        const updatedOutputs = _.xor(outputs, results.outputs)
        outputs = results.outputs
        const syncMessage = sequencer.isRunning ? messages.SEQ_START : messages.SEQ_STOP
        updatedOutputs.forEach(output => output.send([syncMessage]))
        done()
      })
    }
  }
]

vorpal
  .command('config', 'Set midi routings, etc')
  .action((args, done) => {
    cmd().prompt({
      type: 'list',
      name: 'config',
      message: 'What do you want to configure?',
      choices: _.map(configurations, 'name')
    }).then(results => {
      const configuration = _.find(configurations, { name: results.config })
      configuration.configure(done)
    })
  })

const sequencerCommands = {
  start: sequencer.start,
  stop: sequencer.stop,
  continue: sequencer.continue
}

_.forEach(sequencerCommands, (seqFn, command) => {
  vorpal
    .command(command, `${_.upperFirst(command)} the sequencer`)
    .action((args, done) => {
      seqFn.call(sequencer)
      done()
    })
})

vorpal
  .command('bpm <bpm>', 'Sets the bpm of the sequencer')
  .action((args, done) => {
    clock.bpm = args.bpm
    done()
  })

vorpal
  .delimiter('sequencer >')
  .show()

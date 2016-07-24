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

const Clock = require('./lib/Clock')
const clock = new Clock()
clock.start()

const Sequencer = require('./lib/sequencer')
const sequencer = new Sequencer()
sequencer.on('started', () => outputs.forEach(output => output.send([messages.SEQ_START])))
sequencer.on('stopped', () => outputs.forEach(output => output.send([messages.SEQ_STOP])))

clock.on('tick', tick => {
  outputs.forEach(output => output.send([messages.SEQ_TICK]))
})

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

vorpal
  .command('start', 'Starts the sequencer')
  .action((args, done) => {
    sequencer.start()
    done()
  })

vorpal
  .command('stop', 'Stops the sequencer')
  .action((args, done) => {
    sequencer.stop()
    done()
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

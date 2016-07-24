/**
 * Entry-point for command-line version
 */

const portManager = require('./lib/portManager')
const messages = require('./lib/midiMessages')
const vorpal = require('vorpal')()
const cmd = () => vorpal.activeCommand
const _ = require('lodash')

const Clock = require('./lib/Clock')
const clock = new Clock()
clock.start()

let clockOutputs = []
clock.on('tick', () => {
  clockOutputs.forEach(output => output.send([messages.SEQ_TICK]))
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
            checked: _.includes(clockOutputs, port)
          }
        })
      }).then(results => {
        clockOutputs = results.outputs
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
    clockOutputs.forEach(output => output.send([messages.SEQ_START]))
    done()
  })

vorpal
  .command('stop', 'Stops the sequencer')
  .action((args, done) => {
    clockOutputs.forEach(output => output.send([messages.SEQ_STOP]))
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

const vorpal = require('vorpal')()
const _ = require('lodash')
const portManager = require('../portManager')
const cmd = () => vorpal.activeCommand

class CLI {
  /**
   * Requires:
   *   - clock
   *   - sequencer
   *   - sequencerDispatcher
   */
  constructor (options) {
    _.assign(this, options)
  }
  start () {
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
                checked: _.includes(this.sequencerDispatcher.outputs, port)
              }
            })
          }).then(results => {
            this.sequencerDispatcher.outputs = results.outputs
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
          configuration.configure.call(this, done)
        })
      })

    const sequencerCommands = {
      start: this.sequencer.start,
      stop: this.sequencer.stop,
      continue: this.sequencer.continue
    }

    _.forEach(sequencerCommands, (seqFn, command) => {
      vorpal
        .command(command, `${_.upperFirst(command)} the sequencer`)
        .action((args, done) => {
          seqFn.call(this.sequencer)
          done()
        })
    })

    vorpal
      .command('bpm <bpm>', 'Sets the bpm of the clock')
      .action((args, done) => {
        this.clock.bpm = args.bpm
        done()
      })

    vorpal
      .delimiter('sequencer >')
      .show()
  }
}

module.exports = CLI

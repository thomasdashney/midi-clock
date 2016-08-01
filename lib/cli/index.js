const vorpal = require('vorpal')()
const _ = require('lodash')
const { portManager } = require('../services')
const cmd = () => vorpal.activeCommand
const Connector = require('../Connector')

/**
 * TODO: refactor
 */
class CLI {
  /**
   * Requires:
   *   - clock
   *   - tapTempoController
   *   - sequencer
   *   - midiDispatcher
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
                checked: _.includes(this.midiDispatcher.outputs, port)
              }
            })
          }).then(results => {
            this.midiDispatcher.outputs = results.outputs
            done()
          })
        }
      },
      {
        name: 'MIDI Clock Input',
        configure: done => {
          const inputPorts = portManager.getInputPorts()
          cmd().prompt({
            type: 'list',
            name: 'input',
            message: 'Select MIDI input port',
            choices: _.map(inputPorts, port => {
              return {
                name: port.name,
                value: port
              }
            })
          }).then(results => {
            const { input } = results
            input.once('message', payload => {
              const { message: chosenMessage } = payload
              if (this.tapOutput) {
                this.tapOutput.destroy()
              }
              this.tapOutput = {
                tapTempoController: this.tapTempoController,
                send: payload => {
                  this.tapTempoController.tap()
                }
              }
              this.tapConnector = new Connector(input, this.tapOutput)
              // filter everything but the message
              this.tapConnector.addProcessor((payload, next) => {
                if (_.isEqual(payload.message, chosenMessage)) {
                  next(payload)
                }
              })
              done()
            })
          })
        }
      }
    ]

    vorpal
      .command('config', 'Set midi routings, etc')
      .action((args, done) => {
        cmd().prompt({
          type: 'list',
          name: 'configFn',
          message: 'What do you want to configure?',
          choices: _.map(configurations, config => {
            return { name: config.name, value: config.configure }
          })
        }).then(result => result.configFn.call(this, done))
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
      .command('position <position>', 'Sets the position of the sequencer')
      .action((args, done) => {
        this.sequencer.position = args.position
        done()
      })

    vorpal
      .delimiter('clock >')
      .show()

    vorpal
      .command('t', 'Taps the sequencer')
      .action((args, done) => {
        this.tapTempoController.tap()
        done()
      })
  }
}

module.exports = CLI

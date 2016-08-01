# MIDI-Clock and Tap Tempo #

Experimentation with MIDI clock and tap tempo in javascript

## Installation
From the command line:
`git clone https://github.com/thomasdashney/midi-clock.git`
`cd midi-clock`
`npm install`

## Usage
* `npm start`
* From here, the clock starts running at 120 bpm (default)
* `config` command:
  * `Clock Forwards` choose MIDI outputs to forward the clock to
  * `Set Tap Input` selects a MIDI input port
    * *After this*, press the button that you want to use for tap tempo. Every subsequent tap sets the tempo via tap intervals.
* `bpm <bpm>` change the bpm of the clock
* `start` start the sequencer (only forwards message to clock outputs)
* `stop` stop the sequencer (only forwards message to clock outputs)
* `continue` continue the sequencer (only forwards message to clock outputs
* `position <position #>` Sets the position of the sequencer
* `help` lists existing commands


## Running tests
`npm test`

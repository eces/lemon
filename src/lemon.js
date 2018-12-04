/**
 * EventEmitter
 */
require('debugs/init')
const debug = require('debug')('lemon:test')

const EventEmitter = require('events')
class LemonEventEmitter extends EventEmitter {
  constructor() {
    super()
    this.lemonized = true
  }
}
module.exports = LemonEventEmitter
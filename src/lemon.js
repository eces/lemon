/**
 * EventEmitter
 */
const EventEmitter = require('events')
class LemonEventEmitter extends EventEmitter {
  constructor() {
    super()
    this.lemonized = true
  }
}
module.exports = LemonEventEmitter
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

  use(middleware) {

  }
  use(scope, middleware) {

  }
  emit(eventName, ...args) {
    return super.emit(eventName, ...args)
  }
  on(eventName, listener) {
    return super.on(eventName, listener)
  }
}
module.exports = LemonEventEmitter
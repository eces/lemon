/**
 * EventEmitter
 */
require('debugs/init')
const debug = require('debug')('lemon:ee')
const isFunction = require('lodash/isFunction')

class LemonError extends Error {}

const EventEmitter = require('events')
class LemonEventEmitter extends EventEmitter {

  constructor() {
    super()
    this.lemonized = true
    this.has_backend = false
    this.backend_connected = false
    this.on('error', error => {
      if (this.listeners('error').length === 0) {
        debug(error)
      }
    })
    this.on('backend connected', error => {
      this.backend_connected = true
    })
  }

  use(...args) {
    if (args.length === 1) {
      // scope
      const middleware = args[0]
      if (!isFunction(middleware)) 
        throw new LemonError('middleware not function')
      middleware(this)
    } else {
      // scope, middleware
    } 
  }
  emit(eventName, ...args) {
    return super.emit(eventName, ...args)
  }
  on(eventName, listener) {
    return super.on(eventName, listener)
  }
}

module.exports = LemonEventEmitter
module.exports.Redis = require('./redis')
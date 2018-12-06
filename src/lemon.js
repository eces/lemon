/**
 * EventEmitter
 */
require('debugs/init')
const debug = require('debug')('lemon')
const debugScope = require('debug')('lemon:scope')
const debugEmit = require('debug')('lemon:emit')
const debugOn = require('debug')('lemon:on')
const isFunction = require('lodash/isFunction')
const crypto = require('crypto')

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
    this.on('message', ({channel_name, event_name, json}) => {
      debugScope('>final reach', `${channel_name}:${event_name}`, json)
      super.emit(`${channel_name}:${event_name}`, json)
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
  emit(event_name, ...args) {
    if (this.channel_name) {
      const channel_name = this.channel_name
      this.channel_name = undefined
      debugEmit(`emit to ${channel_name}`)
      
      if (this.rsmq) {
        debugEmit('use rsmq')
        const json = JSON.stringify(args[0])
        debugEmit('enqueue with ', { channel_name, event_name, json })
        this.emit('enqueue', { channel_name, event_name, json })
      } else {
        return super.emit(event_name, ...args)
      }
    } else {
      return super.emit(event_name, ...args)
    }
  }
  on(event_name, listener) {
    if (this.channel_name) {
      const channel_name = this.channel_name
      this.channel_name = undefined
      debugOn(`on of ${channel_name}`)

      super.on(`${channel_name}:${event_name}`, listener)

      if (this.rsmq) {
        debugOn('use rsmq')
        debugOn(`${channel_name}:${event_name} listener`)
        this.emit('listen', {channel_name})
      }
    } else {
      return super.on(event_name, listener)
    }
  }

  /**
   * 
   * selector
   */
  to(channel_name) {
    this.channel_name = crypto.createHash('sha1')
      .update(channel_name).digest('hex')
    return this
  }
  of(channel_name) {
    return this.to(channel_name)
  }

  purge() {
    const channel_name = this.channel_name
    this.channel_name = undefined
    super.emit('purge', channel_name)
  }
}

module.exports = LemonEventEmitter
module.exports.Redis = require('./redis')
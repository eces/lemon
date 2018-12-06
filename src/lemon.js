/**
 * EventEmitter
 */
require('debugs/init')
const debug = require('debug')('lemon:ee')
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
    this.on('message', (channel_name, event_name, message) => {
      this.emit(`${channel_name}:${event_name}`, message)
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
    if (this.channel_name) {
      debug(`emit to ${this.channel_name}`)
      
      // todo enqueue

      this.channel_name = undefined
      return false
    } else {
      return super.emit(eventName, ...args)
    }
  }
  on(event_name, listener) {
    if (this.channel_name) {
      debug(`on of ${this.channel_name}`)
      const channel_name = this.channel_name
      if (this.rsmq) {
        debug('use rsmq')
        const that = this
        this.rsmq.createQueue({qname: channel_name}, (err, r) => {
          if (err && err.name != 'queueExists') {
            return that.emit('error', err)
          }
          if (r === 1) {
            debug(`queue created ${channel_name}`)
          }
          this.emit('listen', {channel_name})

          return super.on(`${channel_name}:${event_name}`, listener)
        })
      }
      this.channel_name = undefined
      return false
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
}

module.exports = LemonEventEmitter
module.exports.Redis = require('./redis')
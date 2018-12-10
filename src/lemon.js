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
    this.cname_table = {}
    this.on('error', error => {
      if (this.listeners('error').length === 0) {
        debug(error)
      }
    })
    this.on('backend connected', error => {
      this.backend_connected = true
    })
    this.on('message', ({id, channel_name, event_name, json}, done) => {
      debugScope('> final reach', `${this.cname(channel_name)}:${event_name}`, json)
      const _id = id
      super.emit(`${channel_name}:${event_name}`, json, () => {
        const id = _id
        this.emit('ack', {channel_name, id})
        done()
      })
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
  // emit(event_name, ...args) {
  //   if (this.channel_name) {
  //     const channel_name = this.channel_name
  //     this.channel_name = undefined
  //     debugEmit(`emit to ${this.cname(channel_name)}`)
      
  //     if (this.rsmq) {
  //       const json = JSON.stringify(args[0])
  //       this.emit('enqueue', { channel_name, event_name, json })
  //     } else {
  //       return super.emit(event_name, ...args)
  //     }
  //   } else {
  //     return super.emit(event_name, ...args)
  //   }
  // }
  // on(event_name, listener) {
  //   if (this.channel_name) {
  //     const channel_name = this.channel_name
  //     this.channel_name = undefined
  //     debugOn(`on of ${this.cname(channel_name)}`)

  //     super.on(`${channel_name}:${event_name}`, listener)

  //     if (this.rsmq) {
  //       debugOn(`${this.cname(channel_name)}:${event_name} listener`)
  //       this.emit('listen', {channel_name})
  //     }
  //   } else {
  //     return super.on(event_name, listener)
  //   }
  // }
  publish(event_name, _json, opt = {}) {
    const target = this.parse_target(event_name)
    if (target.scope === null) {
      return super.emit(event_name, ...args)
    } 
    
    const cname = target.scope
    debugEmit(`emit to ${cname}`)

    if (this.rsmq) {
      const json = JSON.stringify(_json)
      const channel_name = this.qname(cname)
      this.emit('enqueue', { channel_name, event_name: target.message, json }, opt)
    } else {
      return super.emit(event_name, ...args)
    }
  }
  subscribe(event_name, listener) {
    const target = this.parse_target(event_name)
    if (target.scope === null) {
      return super.on(event_name, listener)
    } 
    
    const cname = target.scope
    const channel_name = this.qname(cname)
    debugOn(`on of ${cname}`)

    super.on(`${channel_name}:${target.message}`, listener)

    if (this.rsmq) {
      debugOn(`${cname}:${target.message} listener`)
      this.emit('listen', {channel_name})
    }
  }

  /**
   * 
   * selector
   */
  to(channel_name) {
    this.channel_name = crypto.createHash('sha1')
      .update(channel_name).digest('hex')
    this.cname_table[this.channel_name] = channel_name
    return this
  }
  of(channel_name) {
    return this.to(channel_name)
  }

  purge(cname) {
    super.emit('purge', this.qname(cname))
  }

  cname(qname) {
    return this.cname_table[qname] || '(?)'
  }
  qname(cname) {
    const qname = crypto.createHash('sha1')
      .update(cname).digest('hex')
    this.cname_table[qname] = cname
    return qname
  }
  parse_target(name) {
    if (name[0] !== '@') {
      return {
        prefix: null,
        scope: null,
        message: name,
      }
    }
    const p = String(name).split(' ')
    return {
      prefix: '@',
      scope: p[0],
      message: p.slice(1).join(' '),
    }
  }
}

module.exports = LemonEventEmitter
module.exports.Redis = require('./redis')
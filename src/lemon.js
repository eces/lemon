/**
 * EventEmitter
 */
require('debugs/init')
const debug = require('debug')('lemon')
const debugScope = require('debug')('lemon:scope')
const debugEmit = require('debug')('lemon:emit')
const debugOn = require('debug')('lemon:on')
const isFunction = require('lodash/isFunction')
const isObject = require('lodash/isObject')
const crypto = require('crypto')
const duration = require('parse-duration')

class LemonError extends Error {}

const EventEmitter = require('events')
class LemonEventEmitter extends EventEmitter {

  constructor() {
    super()
    this.lemonized = true
    this.has_backend = false
    this.backend_connected = false
    this.cname_table = {}
    this.scope_table = {}
    this.proxy_table = {}
    this.proxy_subscribed_table = {}
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
      if (isFunction(middleware)) {
        middleware(this)
      } else if (isObject(middleware) && middleware.name && middleware.postuse) {
        middleware.postuse(this)
      } else {
        throw new LemonError('middleware invalid')
      }
    } else {
      // scope, middleware
      const scope = args[0]
      const middleware = args[1]
      if (isObject(middleware) && middleware.lemonized) {
        this.proxy_table[scope] = middleware
      } else if (isObject(middleware) && middleware.name && middleware.postuse) {
        middleware.postuse(this)
        this.scope_table[scope] = middleware.name
      } else {
        throw new LemonError('middleware invalid')
      }
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
    
    const middleware = this.scope_table[target.scope]
    if (middleware) {
      debugEmit(`route to middleware:${middleware}`)
      const json = JSON.stringify(_json)
      const channel_name = this.qname(cname)
      this.publish(`@${middleware} enqueue`, { channel_name, event_name: target.message, json }, opt)
      
      return
    }

    const proxy = this.proxy_table[target.scope]
    if (proxy) {
      if (this.proxy_subscribed_table[event_name]) {
        // already subscribed
        return
      }
      this.subscribe(event_name, (data, done) => {
        proxy.publish(event_name, data)
        done()
      })
      this.proxy_subscribed_table[event_name] = true

      return
    }

    if (this.has_backend) {
      const json = JSON.stringify(_json)
      const channel_name = this.qname(cname)
      this.emit('enqueue', { channel_name, event_name: target.message, json }, this.parse_option(opt))
    } else {
      return super.emit(event_name, ...args)
    }
  }
  subscribe(event_name, listener, opt = {}) {
    const target = this.parse_target(event_name)
    if (target.scope === null) {
      return super.on(event_name, listener)
    } 
    
    const cname = target.scope
    const channel_name = this.qname(cname)
    debugOn(`on of ${cname}`)

    super.on(`${channel_name}:${target.message}`, listener)

    if (this.has_backend) {
      debugOn(`${cname}:${target.message} listener`)
      this.emit('listen', {channel_name}, this.parse_option(opt))
    }
    this.emit('subscribe channel added', cname)
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
  parse_option(opt) {
    if (opt.vt) {
      if (isFinite(+opt.vt)) {
        // ok
      } else {
        opt.vt = duration(opt.vt)
      }
    }
    if (opt.delay) {
      if (isFinite(+opt.delay)) {
        // ok
      } else {
        opt.delay = duration(opt.delay)
      }
    }
    return opt
  }
}

module.exports = LemonEventEmitter
module.exports.Redis = require('./redis')
// module.exports.RegistryClient = require('./registry-client')
// module.exports.RegistryServer = require('./registry-server')
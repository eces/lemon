const RSMQ = require('rsmq')
const debug = require('debug')('lemon:redis')
const debugEmit = require('debug')('lemon:emit')
const debugOn = require('debug')('lemon:on')

const Redis = (_options) => {
  const options = Object.assign({
    ns: 'lemon',
    realtime: true,
  }, _options)
  const qname = 'lemon'
  const vt = 3
  const delay = 1

  return (that) => {
    const Redis = require('ioredis')
    const redis = new Redis(options)

    const rsmq = new RSMQ(options)
    const listening_table = {}
    redis.on('message', (subscribe_key, message) => {
      const count = +message || 0
      const [,,channel] = subscribe_key.split(':')
      debug('on message', subscribe_key)
      for (let i=0; i<message; i++) {
        debug(i)
        that.emit('dequeue', channel)
      }
    })
    
    that.rsmq = rsmq
    that.has_backend = true
    that.on('purge', (channel_name) => {
      debug(`events purged on ${channel_name}`)
      const qname = channel_name
      that.rsmq.deleteQueue({qname}, (err, r) => {
        if (err) {
          that.emit('error', err)
        }
      })
    })

    const promised_queue = (channel_name, callback) => {
      that.rsmq.createQueue({ qname: channel_name }, (err, r) => {
        if (err && err.name != 'queueExists') {
          return that.emit('error', err)
        }
        if (r === 1) {
          debugOn(`queue created ${channel_name}`)
        }
        callback()
      })
    }

    that.on('listen', ({channel_name}) => {
      if (listening_table[channel_name]) {
        return
      }
      
      promised_queue(channel_name, () => {
        const _channel_name = channel_name
        debugOn(`events listening on ${options.ns}:rt:${_channel_name}`)
        redis.subscribe(`${options.ns}:rt:${_channel_name}`, (err, count) => {
          if (err) {
            that.emit('error', err)
            return 
          }
          listening_table[channel_name] = true
          debugOn(`emit ${_channel_name}:ready`)
          that.emit(`${_channel_name}:ready`)

          debugOn(`try dequeue for ${_channel_name}`)
          that.emit('dequeue', _channel_name)
        })
      })
      // that.rsmq.createQueue({qname: channel_name}, (err, r) => {
      //   if (err && err.name != 'queueExists') {
      //     return that.emit('error', err)
      //   }
      //   if (r === 1) {
      //     debugOn(`queue created ${channel_name}`)
      //   }

      //   const _channel_name = channel_name
      //   debugOn(`events listening on ${options.ns}:rt:${_channel_name}`)
      //   redis.subscribe(`${options.ns}:rt:${_channel_name}`, (err, count) => {
      //     if (err) {
      //       that.emit('error', err)
      //       return 
      //     }
      //     listening_table[channel_name] = true
      //     debugOn(`emit ${_channel_name}:ready`)
      //     that.emit(`${_channel_name}:ready`)
          
      //     debugOn(`try dequeue for ${_channel_name}`)
      //     that.emit('dequeue', _channel_name)
      //   })
      // })

    })
    that.on('dequeue', (channel_name) => {
      debugOn('dequeue with ', channel_name)
      that.rsmq.receiveMessage({
        qname: channel_name,
        vt: 3,
      }, (err, {message}) => {
        if (err) {
          that.emit('error', err)
        }
        debugOn(channel_name, ' >> ', message)
        if (!message) return
        
        const [event_name, encoded] = JSON.parse(message)
        const json = JSON.parse(encoded)
        that.emit('message', {channel_name, event_name, json})
      })
    })
    that.emit('backend connected')
    
    that.on('enqueue', ({channel_name, event_name, json}) => {
      const qname = channel_name
      const message = JSON.stringify([event_name, json])
      promised_queue(channel_name, () => {
        debugEmit(`enqueue`, { qname, message })
        that.rsmq.sendMessage({ qname, message }, (err, r) => {
          if (err) {
            return that.emit('error', err)
          }
          debugEmit('enqueued', r)
        })
      })
      // const message = JSON.stringify([event_name, json])
      // debugEmit(`enqueue`, { qname, message })
      // that.rsmq.sendMessage({qname, message}, (err, r) => {
      //   if (err) {
      //     return that.emit('error', err)
      //   }
      //   debugEmit('enqueued', r)
      // })
    })
  }
}

module.exports = Redis
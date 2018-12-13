const RSMQ = require('rsmq')
const debug = require('debug')('lemon:redis')
const debugEmit = require('debug')('lemon:emit')
const debugOn = require('debug')('lemon:on')

const Redis = (_options) => {
  const options = Object.assign({
    ns: 'lemon',
    realtime: true,
    vt: 3,
    delay: 1,
  }, _options)

  return (that) => {
    const Redis = require('ioredis')
    const redis = new Redis(options)
    
    const rsmq = new RSMQ(options)
    const listening_table = {}
    redis.on('message', (subscribe_key, message) => {
      const count = +message || 0
      const [,,channel_name] = subscribe_key.split(':')
      debug('on message', that.cname(channel_name))
      setTimeout(() => {
        that.emit('dequeue', channel_name)
      }, 1000)
    })
    
    that.rsmq = rsmq
    that.has_backend = true
    that.on('purge', (channel_name) => {
      debug(`events purged on ${that.cname(channel_name)}`)
      const qname = channel_name
      that.rsmq.deleteQueue({qname}, (err, r) => {
        if (err) {
          that.emit('error', err)
        }
      })
    })
    that.on('ack', ({channel_name, id}) => {
      debug(`events ack on ${that.cname(channel_name)}`)
      const qname = channel_name
      that.rsmq.deleteMessage({qname, id}, (err, r) => {
        if (err) {
          that.emit('error', err)
          return
        }
      })
    })
    that.on('update channel status', ({channel_name}, callback = null) => {
      const qname = that.qname(channel_name)
      that.rsmq.getQueueAttributes({qname}, (err, r) => {
        if (callback) {
          return callback(err, r)
        } else {
          that.emit('channel status updated', err, {
            VisibilityTimeout: r.vt,
            Delay: r.delay,
            ReceiveCount: r.totalrecv,
            SentCount: r.totalsent,
            MessagesAvailable: r.msgs - r.hiddenmsgs,
            MessagesInFlight: r.hiddenmsgs,
          })
        }
      })
    })
    that.on('update queue status', (callback = null) => {
      that.rsmq.listQueues((err, r) => {
        if (callback) {
          return callback(err, r)
        } else {
          const queues = r.map( qname => {
            return {
              name: that.cname(qname),
              id: qname,
            }
          })
          that.emit('queue status updated', err, {
            queues,
          })
        }
      })
    })

    const promised_queue = (channel_name, callback) => {
      that.rsmq.createQueue({ qname: channel_name }, (err, r) => {
        if (err && err.name != 'queueExists') {
          return that.emit('error', err)
        }
        if (r === 1) {
          debugOn(`queue created ${that.cname(channel_name)}`)
        }
        that.rsmq.setQueueAttributes({
          qname: channel_name,
          vt: options.vt,
          delay: options.delay,
        }, (err, r) => {
          if (err) {
            that.emit('error', err)
          }
          callback()
        })
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
          // that.on(`${_channel_name}:ready`, () => {
          //   setInterval(() => {
          //     debug('scheduled dequeue on', _channel_name)
          //     that.emit('dequeue', _channel_name)
          //   }, options.vt * 1000 * 5)
          // })
          that.emit(`${_channel_name}:ready`)

          debugOn(`try dequeue for ${that.cname(_channel_name)}`)
          that.emit('dequeue', _channel_name)
        })
      })
    })
    that.on('dequeue', (channel_name) => {
      debugOn('dequeue with', that.cname(channel_name))
      that.rsmq.receiveMessage({
        qname: channel_name,
        vt: options.vt,
      }, (err, {id, message}) => {
        if (err) {
          that.emit('error', err)
        }
        if (!id) return
        debugOn(that.cname(channel_name), ':', message)
        
        const [event_name, encoded] = JSON.parse(message)
        const json = JSON.parse(encoded)
        that.emit('message', {id, channel_name, event_name, json}, () => {
          that.emit('dequeue', channel_name)
        })
      })
    })
    that.emit('backend connected')
    
    that.on('enqueue', ({channel_name, event_name, json}, opt) => {
      const qname = channel_name
      const message = JSON.stringify([event_name, json])
      promised_queue(channel_name, () => {
        debugEmit(`enqueue`, { qname, message, delay: opt.delay, })
        that.rsmq.sendMessage({ qname, message, delay: opt.delay, }, (err, r) => {
          if (err) {
            return that.emit('error', err)
          }
          // debugEmit('enqueued', r)
        })
      })
    })
  }
}

module.exports = Redis
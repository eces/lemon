const RSMQ = require('rsmq')
const debug = require('debug')('lemon:ee')

const Redis = (_options) => {
  const options = _options
  const qname = 'lemon'
  const vt = 3
  const delay = 1

  return (that) => {
    const Redis = require('ioredis')
    const redis = new Redis(options)

    const rsmq = new RSMQ(options)
    rsmq.createQueue({qname}, (err, r1) => {
      if (err.name != 'queueExists') {
        return that.emit('error', err)
      }
      rsmq.setQueueAttributes({
        qname,
        vt,
        delay,
      }, (err, r2) => {
        if (err) {
          return that.emit('error', err)
        }
        that.rsmq = rsmq
        that.has_backend = true
        that.on('purge', () => {
          debug(`events purged on ${this.channel_name}`)
        })
        that.on('listen', ({channel_name}) => {
          const _channel_name = channel_name
          debug(`events listening on ${_channel_name}`)
          redis.subscribe(`${options.ns}:rt:${_channel_name}`, (err, count) => {
            debug('count ', count)
            that.emit('dequeue', _channel_name)
          })
        })
        that.on('dequeue', (channel_name) => {
          that.rsmq.receiveMessage({
            qname: channel_name,
          }, (message) => {
            if (message === null) return
            
            debug('message', message)
            const [event_name, json] = JSON.parse(message)
            that.emit('message', {channel_name, event_name, json})
          })
        })
        that.emit('backend connected')
      })
    })
  }
}

module.exports = Redis
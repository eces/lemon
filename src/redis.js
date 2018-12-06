const RSMQ = require('rsmq')
const debug = require('debug')('lemon:ee')

const Redis = (_options) => {
  const options = _options
  const qname = 'lemon'
  const vt = 3
  const delay = 1

  return (that) => {
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
        that.emit('backend connected')
      })
    })
  }
}

module.exports = Redis
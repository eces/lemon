const debug = require('debug')('lemon:registry-client')
const WebSocket = require('ws')

const RegistryClient = (_address, _options) => {
  const options = Object.assign({
    
  }, _options)
  const address = _address

  return {
    name: 'RegistryClient',
    postuse: (that) => {
      that.ws = new WebSocket(address, options)
      that.ws.on('open', () => {
        that.emit('registry connected')
      })
      that.ws.on('message', (data) => {
        debug('on message', data)
        const [message, opt] = JSON.parse(data)
        debug('ws message', [message, opt])
        if (message == 'enqueue done') {
          const channel_name = opt.channel_name
          const id = opt.id
          that.emit('ack', {
            channel_name, id
          })
        }
      })

      that.subscribe('@RegistryClient enqueue', (data, done) => {
        that.ws.send(JSON.stringify(['enqueue', data]))
      })

      that.on('RegistryClient:enqueue', ({channel_name, event_name, json}, opt) => {
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

      that.on('subscribe channel added', (cname) => {
        debug('subscribe channel added')
        const qname = that.qname(cname)
        that.ws.send(JSON.stringify(['subscribe channel added', {cname, qname}]))
      })


      return
    }
  }
}

module.exports = RegistryClient
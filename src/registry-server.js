const debug = require('debug')('lemon:registry-server')
const WebSocket = require('ws')
const uuid = require('uuid/v4')

function RegistryServer(_options) {
  const options = Object.assign({
    server: {},
    port: 30000,
  }, _options)

  return (that) => {
    that.channels = {}
    that.connections = {}
    that.wss = new WebSocket.Server(options.server)
    that.wss.on('open', () => {
      debug('wss open')
    })
    that.wss.on('connection', (ws) => {
      debug('on connection')
      ws.uuid = uuid()
      that.connections[ws.uuid] = ws

      ws.send(JSON.stringify(['pong']))

      ws.on('message', (data) => {
        const [message, opt] = JSON.parse(data)
        debug('wss message', [message, opt])
        if (message == 'subscribe channel added') {
          if(!channels[opt.qname]) {
            channels[opt.qname] = []
          }
        }
      })
    })
    return
  }
}

module.exports = RegistryServer
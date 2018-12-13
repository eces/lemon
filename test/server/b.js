require('debugs/init')

const debug = require('debug')('lemon:b')
const express = require('express')
const http = require('http')
const app = express()

const Lemon = require('../../index.js')
const api = new Lemon({
  vt: 3,
  delay: 1,
})
api.use(Lemon.Redis({
  host: '127.0.0.1',
  port: 6379,
  ns: 'test.server.lemon',
}))
api.on('error', error => {
  debug(error)
})

api.subscribe('@user last activity', (message, done) => {
  debug('last activity:', message)
  done()
})

setInterval(() => {
  api.emit('update channel status', {channel_name: '@user'})
}, 1000)
api.on('channel status updated', (err, r) => {
  debug('channel status updated', err, r.MessagesAvailable, r.MessagesInFlight)
})

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'It works!',
  })
})

const server = http.createServer(app)
server.listen(8002)

debug('http://localhost:8002')
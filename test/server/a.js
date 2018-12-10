require('debugs/init')

const debug = require('debug')('lemon:a')
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

app.get('/', (req, res) => {
  api.publish('@user last activity', {action:'page viewed ' + new Date})
  res.status(200).json({
    message: '...',
  })
})

const server = http.createServer(app)
server.listen(8001)

debug('http://localhost:8001')
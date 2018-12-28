import test from 'ava'

require('debugs/init')
const debug = require('debug')('lemon:test')

const Lemon = require('../index.js')

test.cb('test status', t => {
  t.plan(1)

  const api = new Lemon({
    vt: 3,
    delay: 1,
  })
  api.use(Lemon.Redis({
    host: '127.0.0.1',
    port: 6379,
    ns: 'test.lemon.setTimeout',
  }))
  api.on('error', error => {
    t.fail(error)
  })

  api.purge('@user')

  api.subscribe('@user notified', (d, next) => {
    debug('>>>> @user notified')
    next()
  })

  api.publish('@user notified', {}, {
    delay: 3000
  })
  api.publish('@user notified', {}, {
    delay: 6000
  })

  setInterval(() => {
    api.emit('update channel status', {channel_name: '@user'})
  }, 1000)
  api.on('channel status updated', (err, r) => {
    debug('channel status updated', err, r.MessagesAvailable, r.MessagesInFlight)
  })
  
  // api.publish('@global get redis status')

  setTimeout(() => {
    t.fail('timeout')
  }, 5000)
})


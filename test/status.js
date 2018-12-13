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
    ns: 'test.lemon.status',
    vt: 3,
    delay: 1,
  }))
  api.on('error', error => {
    t.fail(error)
  })

  api.subscribe('@user created', (d) => {
    debug('@user created')
  })

  debug(33)
  api.emit('update queue status')
  api.on('queue status updated', (err, r) => {
    debug('queue status updated', err, r)
    t.pass()
  })
  
  // api.publish('@global get redis status')

  setTimeout(() => {
    t.fail('timeout')
  }, 5000)
})


import test from 'ava'

require('debugs/init')
const debug = require('debug')('lemon:test')
const Promise = require('bluebird')

const LemonEventEmitter = require('../index.js')
const LemonRedis = LemonEventEmitter.Redis({
  host: '127.0.0.1',
  port: 6379,
  ns: 'lemon-multi',
  vt: 3,
  delay: 1,
})

test.cb('user -> {notify, stat} manager', t => {
  t.plan(2)
  let count = 0

  const notifyManager = new LemonEventEmitter()
  notifyManager.on('error', error => {
    t.fail(error)
  })
  notifyManager.use(LemonRedis)
  
  const statManager = new LemonEventEmitter()
  statManager.on('error', error => {
    t.fail(error)
  })
  statManager.use(LemonRedis)
  
  
  
  const api = new LemonEventEmitter()
  api.on('error', error => {
    t.fail(error)
  })
  api.use(LemonRedis)

  // clean
  api.purge('@user')

  // user created
  api.publish('@user created', {
    id: 1000,
    name: 'Hans',
  }, {delay: 1})
  
  // user updated
  api.publish('@user balance updated', {
    id: 1000,
  }, {delay: 1})

  setInterval(() => {
    api.emit('update channel status', {channel_name: '@user'})
  }, 1000)
  api.on('channel status updated', (err, r) => {
    debug('channel status updated', err, r.MessagesAvailable, r.MessagesInFlight)
  })

  setTimeout(() => {
    notifyManager.subscribe('@user created', ({id, name}, done) => {
      t.pass()
      debug(`send email: ID=${id} Name=${name}`)
      
      done()
      if (++count > 1) t.end()
    })
    
    notifyManager.subscribe('@user balance updated', ({id}, done) => {
      t.pass()
      debug(`query sum of current balance: ID=${id}`)
      
      done()
      if (++count > 1) t.end()
    })
  }, 100)
  

  setTimeout(() => {
    t.fail('timeout')
  }, 5000)
})



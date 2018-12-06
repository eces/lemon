import test from 'ava'

require('debugs/init')
const debug = require('debug')('lemon:test')
const Promise = require('bluebird')

const LemonEventEmitter = require('../index.js')
const LemonRedis = LemonEventEmitter.Redis({
  host: '127.0.0.1',
  port: 6379,
  ns: 'lemon-multi',
})

test.cb.skip('user -> {notify, stat} manager', t => {
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
  api.to('@user').purge()

  // user created
  api.to('@user').emit('created', {
    id: 1000,
    name: 'Hans',
  })
  
  // user updated
  api.to('@user').emit('balance updated', {
    id: 1000,
  })
  
  notifyManager.of('@user').on('created', ({id, name}) => {
    debug(`send email: ID=${id} Name=${name}`)
  })
  
  notifyManager.of('@user').on('balance updated', ({id}) => {
    debug(`query sum of current balance: ID=${id}`)
  })

  setTimeout(() => {
    t.fail('timeout')
  }, 5000)
})



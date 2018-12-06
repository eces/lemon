import test from 'ava'

require('debugs/init')
const debug = require('debug')('lemon:test')
const Promise = require('bluebird')

const LemonEventEmitter = require('../index.js')

test('init', async t => {
  const api = new LemonEventEmitter()
  t.is(api.lemonized, true)
  t.pass()
})

test('throw away', async t => {
  const api = new LemonEventEmitter()
  t.plan(2)
  api.on('hey', r => {
    t.is(r, 'data')
  })
  const hadListener = api.emit('hey', 'data')
  t.is(hadListener, true)
})

test('invalid middleware', async t => {
  const api = new LemonEventEmitter()
  t.throws(() => {
    api.use('??')
  })
  t.pass()
})

test.cb('use redis', (t) => {
  const api = new LemonEventEmitter()
  api.on('error', error => {
    t.fail(error)
    t.end()
  })
  api.on('backend connected', () => {
    t.pass()
    t.end()
  })

  api.use(LemonEventEmitter.Redis({
    host: '127.0.0.1',
    port: 6379,
    ns: 'lemon',
  }))
  
  setTimeout(() => {
    t.fail('timeout')
    t.end()
  }, 1000)
})

test('plain emit', async t => {
  const api = new LemonEventEmitter()
  api.on('plain', () => {
    t.pass()
  })
  api.emit('plain')
})

// api.to('@admin').emit('...')
// api.of('/namespace').emit('...')


// // redis PUB SUB POLL 
// // rsmq 

// ee

// .emit -> enqueue 
// deqyeye -> .on 
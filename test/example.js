import test from 'ava'

require('debugs/init')
const debug = require('debug')('lemon:test')

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
  }, 1000)
})

const api = new LemonEventEmitter()

test.cb('init redis', (t) => {
  api.use(LemonEventEmitter.Redis({
    host: '127.0.0.1',
    port: 6379,
    ns: 'lemon',
  }))
  api.on('error', error => {
    t.fail(error)
    t.end()
  })
  api.on('backend connected', () => {
    t.pass()
    t.end()
  })
})

test('plain emit', async t => {
  api.on('plain', () => {
    t.pass()
  })
  api.emit('plain')
})

test('scoped emit', async t => {
  api.to('@mailer').emit('send sms')
  api.emit('send sms')
  t.pass()
})

test('scoped on', async t => {
  t.plan(2)
  api.to('@mailer').on('send sms', () => {
    t.pass()
  })
  api.to('@mailer').emit('send sms')
  t.pass()
})

test('scoped events purge', async t => {
  api.to('@mailer').on('backend purged', () => {
    t.pass()
  })
  api.to('@mailer').emit('purge')
})

// test('scope emit', async t => {
//   api.on('plain', () => {
//     t.pass()
//   })
//   api.emit('plain')
//   api.emit('')
// })

// api.to('@admin').emit('...')
// api.of('/namespace').emit('...')


// // redis PUB SUB POLL 
// // rsmq 

// ee

// .emit -> enqueue 
// deqyeye -> .on 
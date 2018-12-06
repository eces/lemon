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

const api = new LemonEventEmitter()

test.before('init redis', async (t) => {
  api.on('error', error => {
    t.fail(error)
  })
  api.on('backend connected', () => {
    t.pass()
  })

  api.use(LemonEventEmitter.Redis({
    host: '127.0.0.1',
    port: 6379,
    ns: 'lemon',
  }))

  await Promise.delay(3000)
  
  setTimeout(() => {
    t.fail('timeout')
  }, 1000)
})


test('plain emit', async t => {
  api.on('plain', () => {
    t.pass()
  })
  api.emit('plain')
})

test('scoped emit', async t => {
  t.true(api.channel_name === undefined)
  api.to('@mailer')
  t.true(api.channel_name !== undefined)
  api.to('@mailer').emit('send sms')
  t.true(api.channel_name === undefined)
  t.pass()
})

test.cb('scoped on', (t) => {
  api.to('@mailer').on('send sms', (d) => {
    debug('>>recv')
    t.is(d, 'request body')
    t.pass()
    t.end()
  })
  debug('>>sent')
  api.to('@mailer').emit('send sms')

  setTimeout(() => {
    t.fail('timeout')
    t.end()
  }, 1000)
})

// test('scoped events purge', async t => {
//   api.to('@mailer').on('backend purged', () => {
//     t.pass()
//   })
//   api.to('@mailer').emit('purge')
// })

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
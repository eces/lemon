import test from 'ava'

require('debugs/init')
const debug = require('debug')('lemon:test')
const Promise = require('bluebird')

const LemonEventEmitter = require('../index.js')

const api = new LemonEventEmitter()

test.before( async (t) => {
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

test.beforeEach('purge', t => {
  // api.to('@scope.on.gentle').purge()
})

test.afterEach('info', t => {
  // debug(api.cname)
})

test('scoped emit', async t => {
  t.true(api.channel_name === undefined)
  api.to('@scope.emit')
  t.true(api.channel_name !== undefined)
  api.to('@scope.emit').emit('send sms')
  t.true(api.channel_name === undefined)
  t.pass()
})

test.cb('with ready scoped on', (t) => {
  t.plan(2)

  api.to('@scope.on.gentle').purge()
  api.to('@scope.on.gentle').on('ready', () => {
    const text = 'Hello 💩'
    let recv = 0

    api.to('@scope.on.gentle').on('send sms', (d) => {
      t.is(d, text)
      if (++recv == 2) {
        t.end()
      }
    })
    api.to('@scope.on.gentle').emit('send sms', text)
    setTimeout(() => {
      api.to('@scope.on.gentle').emit('send sms', text)
    }, 500);
    
  })
  setTimeout(() => {
    t.fail('timeout')
    t.end()
  }, 3000)
})

test.cb('without ready scoped on', (t) => {
  api.to('@scope.on.cool').purge()
  
  const text = 'Hello 💩'
  api.to('@scope.on.cool').emit('send sms', text)
  api.to('@scope.on.cool').on('send sms', (d) => {
    t.is(d, text)
    t.end()
  })

  setTimeout(() => {
    t.fail('timeout')
    t.end()
  }, 3000)
})

import test from 'ava'

require('debugs/init')
const debug = require('debug')('lemon:test')
const Promise = require('bluebird')

const LemonEventEmitter = require('../index.js')

const api = new LemonEventEmitter({
  vt: 1,
  delay: 0,
})

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

// test('scoped emit', async t => {
//   t.true(api.channel_name === undefined)
//   api.to('@scope.emit')
//   t.true(api.channel_name !== undefined)
//   api.to('@scope.emit').emit('send sms')
//   t.true(api.channel_name === undefined)
//   t.pass()
// })

test.only.cb('with ready scoped on', (t) => {
  t.plan(2)

  api.purge('@scope.on.gentle')
  api.subscribe('@scope.on.gentle ready', () => {
    const text = 'Hello 💩'
    let recv = 0

    api.subscribe('@scope.on.gentle send sms', (d, done) => {
      t.is(d, text)
      done()
      if (++recv == 2) {
        t.end()
      }
    })
    api.publish('@scope.on.gentle send sms', text)
    setTimeout(() => {
      api.publish('@scope.on.gentle send sms', text)
    }, 500);
    
  })
  setTimeout(() => {
    t.fail('timeout')
    t.end()
  }, 5000)
})

test.cb('without ready scoped on', (t) => {
  api.purge('@scope.on.cool')
  
  const text = 'Hello 💩'
  api.publish('@scope.on.cool send sms', text)
  api.subscribe('@scope.on.cool send sms', (d, done) => {
    t.is(d, text)
    t.end()
    done()
  })

  setTimeout(() => {
    t.fail('timeout')
    t.end()
  }, 5000)
})

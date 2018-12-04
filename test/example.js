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

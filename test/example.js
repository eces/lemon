import test from 'ava'

require('debugs/init')
const debug = require('debug')('lemon:test')

const LemonEventEmitter = require('../index.js')

test('init', async t => {
  const api = new LemonEventEmitter()
  t.is(api.lemonized, true)
  t.pass()
})
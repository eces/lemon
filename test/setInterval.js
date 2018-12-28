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
    ns: 'test.lemon.setInterval',
  }))
  api.on('error', error => {
    t.fail(error)
  })

  const _option = {}
  const option = (key, value) => {
    if (value) {
      _option[key] = value
      return this
    } else {
      return _option[key]
    }
  }

  api.purge('@find-block-5s')
  
  option('eth.block.active', 'Y')

  debug('\n[sub]\n')
  api.subscribe('@find-block-5s eth', (d, next) => {
    if (option('eth.block.active') !== 'Y') {
      debug('>> @eth block. Terminated')
      return next()
    }
    if (option('eth.block.active_message_id') !== d.active_message_id) {
      debug('>> @eth block. Invalidated')
      return next()
    }
    debug('>> @eth block PROCESSING .... await for next')
  }, {
    vt: '5 seconds',
  })

  debug('\n[pub]\n')
  option('eth.block.active_message_id', '1000')
  api.publish('@find-block-5s eth', {
    active_message_id: '1000',
  }, {
    delay: '3s'
  })

  setInterval(() => {
    debug('\n[active mesage id]\n')
    option('eth.block.active_message_id', '2000')
  }, 13000)
  setInterval(() => {
    debug('\n[new pub]\n')
    api.publish('@find-block-5s eth', {
      active_message_id: '2000',
    })
  }, 20000)
  setInterval(() => {
    debug('\n[active false]\n')
    option('eth.block.active', 'N')
  }, 25000)


  setInterval(() => {
    api.emit('update channel status', {channel_name: '@find-block-5s'})
  }, 1000)
  api.on('channel status updated', (err, r) => {
    debug('channel status updated', err, r.MessagesAvailable, r.MessagesInFlight)
  })
  
  // api.publish('@global get redis status')

  setTimeout(() => {
    t.fail('timeout')
  }, 5000)
})


import test from 'ava'

require('debugs/init')
const debug = require('debug')('lemon:test')

const Lemon = require('../index.js')

// const private_api = new Lemon({
//   vt: 3,
//   delay: 1,
// })
// private_api.use(Lemon.Redis({
//   host: '127.0.0.1',
//   port: 6379,
//   ns: 'test.lemon.private',
//   vt: 3,
//   delay: 1,
// }))

// const public_api = new Lemon({
//   vt: 3,
//   delay: 1,
// })
// public_api.use('@mailer', Lemon.Registry({
//   host: '127.0.0.1',
//   port: 30000,
// }))

// test.cb('registry server start', t => {
//   const api = new Lemon({
//     vt: 3,
//     delay: 1,
//   })
//   api.use(Lemon.Redis({
//     host: '127.0.0.1',
//     port: 6379,
//     ns: 'test.lemon.registry',
//     vt: 3,
//     delay: 1,
//   }))
//   api.use(Lemon.RegistryServer({
//     server: {
//       port: 30000,
//     }
//   }))
//   api.use('@mailer', Lemon.RegistryClient('ws://127.0.0.1:30000', {}))

//   api.on('registry connected', () => {
//     api.subscribe('@mailer send sms', ({text}, done) => {
//       debug('subscribe @mailer send sms:', text)
//       done()
//     })
//   })

//   api.publish('@mailer send sms', {
//     text: 'hello',
//   })

//   setTimeout(() => {
//     t.fail('timeout')
//   }, 5000)
// })


test.cb('global queue', t => {
  const private_api = new Lemon({
    vt: 3,
    delay: 1,
  })
  private_api.use(Lemon.Redis({
    host: '127.0.0.1',
    port: 6379,
    ns: 'test.lemon.private',
    vt: 3,
    delay: 1,
  }))
  
  const public_api = new Lemon({
    vt: 3,
    delay: 1,
  })
  public_api.use(Lemon.Redis({
    host: '127.0.0.1',
    port: 6380,
    ns: 'test.lemon.public',
    vt: 3,
    delay: 1,
  }))

  private_api.subscribe('@mailer send sms', (data, done) => {
    public_api.publish('@mailer send sms', data)
    done()
  })
  
  private_api.publish('@mailer send sms', {
    text: 'hello',
  })

  public_api.subscribe('@mailer send sms', (data, done) => {
    debug('public_api >>>')
  })

  setTimeout(() => {
    t.fail('timeout')
  }, 5000)
})


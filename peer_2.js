import { CoreIdExtension } from '../mapeo-core-next/sync/CoreIdExtension.js'
import { CoreIdCache } from '../mapeo-core-next/sync/CoreIdCache.js'
import { Sqlite } from './node_modules/@mapeo/mapeo-core-next/lib/sqlite.js'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import {randomBytes} from 'node:crypto'

const store = new Corestore('./store_2')
const sqlite = new Sqlite()
const coreIdCache = new CoreIdCache(sqlite)

// SWARM
const topic = Buffer.alloc(32).fill('szgy')
const swarm = new Hyperswarm()

// create master core to register extension in
const masterCoreKey = Buffer.alloc(32).fill("example-master-core");
const masterCore =  store.get({key:masterCoreKey})
await masterCore.ready()

// instance extension to sync auth
const coreIdExtension = new CoreIdExtension(masterCore, coreIdCache)
coreIdExtension.share('auth', (msg,peer) => {
  msg.map(({namespace, coreIds}) => {
    console.log(`getting ${coreIds} \nto ${namespace}`)
    // if I try to get the core it gets on a loop  of the same extension message, for some reason
    // const storeNamespace = store.namespace(namespace)
    // coreIds.forEach(coreId => storeNamespace.get(coreId))
  })
})

swarm.on('connection' ,  (conn,info) => {
  console.log('replicating data')
  store.replicate(conn)
  console.log(`getting ${masterCoreKey.toString('hex')}`)
  store.get(masterCoreKey)
})
const discovery = swarm.join(topic)
await discovery.flushed()

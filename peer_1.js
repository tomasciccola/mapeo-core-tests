import { CoreIdExtension } from '../mapeo-core-next/sync/CoreIdExtension.js'
import { CoreIdCache } from '../mapeo-core-next/sync/CoreIdCache.js'
import { Sqlite } from '../mapeo-core-next/lib/sqlite.js'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import {randomBytes} from 'node:crypto'

const store = new Corestore('./store_1')
const sqlite = new Sqlite()
const coreIdCache = new CoreIdCache(sqlite)

// create master core to register extension in
const masterCoreKey = Buffer.alloc(32).fill("example-master-core");
const masterCore =  store.get({key:masterCoreKey})
await masterCore.ready()

// create three core examples and two random identities
const authCoreExample = store.get({name:'myAuthStore'})
const authCoreExample2 = store.get({name:'myAuthStore2'})
const authCoreExample3 = store.get({name:'myAuthStore3'})
const identityId = randomBytes(32).toString('hex')
const identityId2 = randomBytes(32).toString('hex')

// wait for the cores to be ready
await authCoreExample.ready()
await authCoreExample2.ready()
await authCoreExample3.ready()

// we are shareing to cores as part of one identity
coreIdCache.put({
  namespace:'auth', 
  coreId:authCoreExample.key.toString('hex'),
  identityId: identityId
})

coreIdCache.put({
  namespace:'auth', 
  coreId:authCoreExample2.key.toString('hex'),
  identityId: identityId
})

// and another core as part of other identity
coreIdCache.put({
  namespace:'auth', 
  coreId:authCoreExample3.key.toString('hex'),
  identityId: identityId2
})

// instance extension to sync auth
const coreIdExtension = new CoreIdExtension(masterCore, coreIdCache)

// we pass an empty fn since we know that peer_2 won't share anything
coreIdExtension.share('auth', () => {})


// SWARM
const topic = Buffer.alloc(32).fill('szgy')
const swarm = new Hyperswarm()


swarm.on('connection' ,  (conn,info) => {
  console.log('replicating data')
  store.replicate(conn)
})
const discovery = swarm.join(topic)
await discovery.flushed()



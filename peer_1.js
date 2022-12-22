import { CoreIdExtension } from './node_modules/@mapeo/mapeo-core-next/sync/CoreIdExtension.js'
import { CoreIdCache } from './node_modules/@mapeo/mapeo-core-next/sync/CoreIdCache.js'
import { Sqlite } from './node_modules/@mapeo/mapeo-core-next/lib/sqlite.js'
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
// create an example core and index it using sqlite
const authCoreExample = store.get({name:'myAuthStore'})
await authCoreExample.ready()
coreIdCache.put({
  storeType:'auth', 
  coreId:authCoreExample.key.toString('hex'),
  identityId: randomBytes(32).toString('hex')})

console.log('ids to share from auth', coreIdCache.getByStoreType('auth'))

// instance extension to sync auth
const coreIdExtension = new CoreIdExtension(masterCore, store, coreIdCache)
coreIdExtension.share('auth')


// SWARM
const topic = Buffer.alloc(32).fill('szgy')
const swarm = new Hyperswarm()


swarm.on('connection' ,  (conn,info) => {
  console.log('replicating data')
  store.replicate(conn)
})
const discovery = swarm.join(topic)
await discovery.flushed()



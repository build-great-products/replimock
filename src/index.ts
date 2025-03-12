import type { MutatorDefs, ReadonlyJSONValue, Replicache } from 'replicache'
import { createStore } from 'tinybase'

import { createExperimentalWatch } from './experimental-watch.js'
import { generateUUID } from './generate-uuid.js'
import { jsonstring } from './jsonstring.js'
import { createMutate } from './mutate.js'
import { createQuery } from './query.js'

type MockReplicacheOptions<MD extends MutatorDefs> = {
  mutators: MD
  initialData?: Record<string, ReadonlyJSONValue>
}

const mockReplicache = <MD extends MutatorDefs>(
  options: MockReplicacheOptions<MD>,
): Replicache<MD> => {
  const { mutators, initialData } = options

  const store = createStore()

  if (initialData) {
    store.setValues(
      Object.fromEntries(
        Object.entries(initialData).map(([key, value]) => [
          key,
          jsonstring.encode(value),
        ]),
      ),
    )
  }

  const id = generateUUID()

  const rep: Omit<Replicache, '#private'> = {
    experimentalWatch: createExperimentalWatch(store),
    mutate: createMutate(store, mutators),
    query: createQuery(store),

    // replicache internals
    name: `replimock-${id}`,
    idbName: `replimock-${id}`,
    schemaVersion: '0',
    auth: '?',
    pullURL: '/',
    pushURL: '/',
    online: false,
    closed: false,
    pullInterval: 60_000,
    pushDelay: 1_000,
    puller: async () => {
      throw Error('replicache.puller is not implemented')
    },
    pusher: async () => {
      throw Error('repliache.pusher is not implemented')
    },
    onSync: () => null,
    onClientStateNotFound: () => null,
    onUpdateNeeded: () => null,
    onOnlineChange: () => null,
    getAuth: () => null,
    clientID: `client-${id}`,
    clientGroupID: Promise.resolve(`client-group-${id}`),
    profileID: Promise.resolve(`profile-${id}`),
    pull: async () => undefined,
    push: async () => undefined,
    poke: async () => undefined,
    close: async () => undefined,
    subscribe: () => () => undefined,
    requestOptions: {
      minDelayMs: 0,
      maxDelayMs: 0,
    },
    experimentalPendingMutations: async () => [],
  }

  return rep as Replicache<MD>
}

export { mockReplicache }

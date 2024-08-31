import type { ReadTransaction, ReadonlyJSONValue } from 'replicache'
import type { Store } from 'tinybase'

import { jsonstring } from './jsonstring.js'

const createReadTransaction = (store: Store): ReadTransaction => {
  const tx: ReadTransaction = {
    scan: () => {
      throw new Error('Not implemented')
    },
    get: async (key: string): Promise<ReadonlyJSONValue | undefined> => {
      const value = store.getValue(key)
      if (value === undefined) {
        return undefined
      }
      if (typeof value !== 'string') {
        throw new Error('Value must be a string')
      }
      return jsonstring.decode(value)
    },
    has: async (key: string): Promise<boolean> => {
      const value = store.getValue(key)
      return value !== undefined
    },
    isEmpty: async (): Promise<boolean> => {
      const keys = store.getValueIds()
      return keys.length === 0
    },
    clientID: 'mock-replicache',
    environment: 'client',
    location: 'client',
  }
  return tx
}

export { createReadTransaction }

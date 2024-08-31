import type { ReadonlyJSONValue, WriteTransaction } from 'replicache'
import type { Store } from 'tinybase'

import { jsonstring } from './jsonstring.js'
import { createReadTransaction } from './read-transaction.js'

const createWriteTransaction = (store: Store): WriteTransaction => {
  const readTx = createReadTransaction(store)

  const tx: WriteTransaction = {
    ...readTx,

    put: async (key, value) => tx.set(key, value),
    set: async (key: string, value: ReadonlyJSONValue) => {
      store.setValue(key, jsonstring.encode(value))
    },
    del: async (key: string) => {
      const hasKey = await tx.has(key)
      store.delValue(key)
      return hasKey
    },

    mutationID: 0,
    reason: 'initial',
  }
  return tx
}

export { createWriteTransaction }

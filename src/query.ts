import type { ReadTransaction, Replicache } from 'replicache'
import type { Store } from 'tinybase'

import { createReadTransaction } from './read-transaction.js'

type Query = Replicache['query']

const createQuery = (store: Store): Query => {
  const query: Query = async <R>(
    callback: (tx: ReadTransaction) => Promise<R> | R,
  ): Promise<R> => {
    const tx = createReadTransaction(store)
    return callback(tx)
  }

  return query
}

export { createQuery }

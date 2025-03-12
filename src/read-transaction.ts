import type {
  AsyncIterableIteratorToArray,
  IndexKey,
  ReadTransaction,
  ReadonlyJSONValue,
  ScanOptions,
  ScanResult,
} from 'replicache'
import type { Store } from 'tinybase'

import { jsonstring } from './jsonstring.js'

const createReadTransaction = (store: Store): ReadTransaction => {
  const tx: ReadTransaction = {
    scan: ((options?: ScanOptions) => {
      if (options && 'indexName' in options) {
        throw new Error('replimock does not support scanning indexes')
      }

      const prefix = options?.prefix
      const limit = options?.limit
      const start = options?.start

      // Factory function to create an async iterable with common functionality
      const createAsyncIterable = <T>(
        mapper: (key: string, value: string) => T,
      ) => {
        async function* generator(): AsyncIterableIterator<T> {
          // Collect matching entries in an array
          const matches: T[] = []
          let count = 0

          // Pre-populate the matches array with filtered entries
          store.forEachValue((key, value) => {
            // assert value is string
            if (typeof value !== 'string') {
              throw new Error('Encountered non-string value in store')
            }

            // Apply all filters
            if (typeof limit === 'number' && count >= limit) {
              return
            }

            if (typeof prefix === 'string' && !key.startsWith(prefix)) {
              return
            }

            if (start && typeof start.key === 'string') {
              if (start.exclusive === true) {
                if (key <= start.key) {
                  return
                }
              } else {
                if (key < start.key) {
                  return
                }
              }
            }

            matches.push(mapper(key, value))
            count++
          })

          // Iterator state
          let index = 0

          while (index < matches.length) {
            yield matches.at(index) as T
            index += 1
          }
        }

        const iterable = generator() as AsyncIterableIteratorToArray<T>

        // Add toArray method
        iterable.toArray = async (): Promise<T[]> => {
          const results: T[] = []
          for await (const item of iterable) {
            results.push(item)
          }
          return results
        }

        return iterable
      }

      // Create and return the scan result with properly typed methods
      const scanResult = {
        [Symbol.asyncIterator]: () =>
          createAsyncIterable<ReadonlyJSONValue>((key, value) =>
            jsonstring.decode(value),
          ),
        toArray: () =>
          createAsyncIterable<ReadonlyJSONValue>((key, value) =>
            jsonstring.decode(value),
          ).toArray(),

        values: () =>
          createAsyncIterable<ReadonlyJSONValue>((key, value) =>
            jsonstring.decode(value),
          ),
        entries: () =>
          createAsyncIterable<[string, ReadonlyJSONValue]>((key, value) => [
            key,
            jsonstring.decode(value),
          ]),
        keys: () => createAsyncIterable<string>((key, value) => key),
      } as ScanResult<string, ReadonlyJSONValue>

      return scanResult
      // hack: force typescrip to be happy
    }) as ReadTransaction['scan'],
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

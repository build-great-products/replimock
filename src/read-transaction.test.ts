import type { Store } from 'tinybase'
import { createStore } from 'tinybase'
import { test as anyTest, describe, expect } from 'vitest'

import { createReadTransaction } from './read-transaction.js'

const test = anyTest.extend<{ store: Store }>({
  // biome-ignore lint/correctness/noEmptyPattern: vitest requires
  store: ({}, use) => use(createStore()),
})

describe('tx.scan', () => {
  describe('.entries', () => {
    test('should return empty array, if store is empty', async ({ store }) => {
      const tx = createReadTransaction(store)

      const result = await tx.scan({}).entries().toArray()
      expect(result).toStrictEqual([])
    })

    test('should support iterating over entries', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
      })

      const result = []
      for await (const entry of tx.scan({}).entries()) {
        result.push(entry)
      }

      expect(result).toStrictEqual([
        ['row/1', { id: 1 }],
        ['row/2', { id: 2 }],
        ['row/3', { id: 3 }],
      ])
    })

    test('should return all entries, if no options are provided', async ({
      store,
    }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
      })

      const result = await tx.scan({}).entries().toArray()
      expect(result).toStrictEqual([
        ['row/1', { id: 1 }],
        ['row/2', { id: 2 }],
        ['row/3', { id: 3 }],
      ])
    })

    test('should return entries with prefix', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'other/1': '{"id":1}',
        'other/2': '{"id":2}',
        'other/3': '{"id":3}',
      })

      const result = await tx.scan({ prefix: 'row/' }).entries().toArray()
      expect(result).toStrictEqual([
        ['row/1', { id: 1 }],
        ['row/2', { id: 2 }],
        ['row/3', { id: 3 }],
      ])
    })

    test('should return entries with limit', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'row/4': '{"id":4}',
      })

      const result = await tx.scan({ limit: 2 }).entries().toArray()
      expect(result).toStrictEqual([
        ['row/1', { id: 1 }],
        ['row/2', { id: 2 }],
      ])
    })

    test('should return entries with start key', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'row/4': '{"id":4}',
      })

      const result = await tx
        .scan({ start: { key: 'row/2' } })
        .entries()
        .toArray()
      expect(result).toStrictEqual([
        ['row/2', { id: 2 }],
        ['row/3', { id: 3 }],
        ['row/4', { id: 4 }],
      ])
    })

    test('should return entries with start key and exclusive', async ({
      store,
    }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'row/4': '{"id":4}',
      })

      const result = await tx
        .scan({ start: { key: 'row/2', exclusive: true } })
        .entries()
        .toArray()
      expect(result).toStrictEqual([
        ['row/3', { id: 3 }],
        ['row/4', { id: 4 }],
      ])
    })
  })

  describe('.keys', () => {
    test('should return empty array, if store is empty', async ({ store }) => {
      const tx = createReadTransaction(store)

      const result = await tx.scan({}).keys().toArray()
      expect(result).toStrictEqual([])
    })

    test('should support iterating over keys', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
      })

      const result = []
      for await (const key of tx.scan({}).keys()) {
        result.push(key)
      }

      expect(result).toStrictEqual(['row/1', 'row/2', 'row/3'])
    })

    test('should return all keys, if no options are provided', async ({
      store,
    }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
      })

      const result = await tx.scan({}).keys().toArray()
      expect(result).toStrictEqual(['row/1', 'row/2', 'row/3'])
    })

    test('should return keys with prefix', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'other/1': '{"id":1}',
        'other/2': '{"id":2}',
        'other/3': '{"id":3}',
      })

      const result = await tx.scan({ prefix: 'row/' }).keys().toArray()
      expect(result).toStrictEqual(['row/1', 'row/2', 'row/3'])
    })

    test('should return keys with limit', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'row/4': '{"id":4}',
      })

      const result = await tx.scan({ limit: 2 }).keys().toArray()
      expect(result).toStrictEqual(['row/1', 'row/2'])
    })

    test('should return keys with start key', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'row/4': '{"id":4}',
      })

      const result = await tx
        .scan({ start: { key: 'row/2' } })
        .keys()
        .toArray()
      expect(result).toStrictEqual(['row/2', 'row/3', 'row/4'])
    })

    test('should return keys with start key and exclusive', async ({
      store,
    }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'row/4': '{"id":4}',
      })

      const result = await tx
        .scan({ start: { key: 'row/2', exclusive: true } })
        .keys()
        .toArray()
      expect(result).toStrictEqual(['row/3', 'row/4'])
    })
  })

  describe('. should default to values', () => {
    test('should return empty array, if store is empty', async ({ store }) => {
      const tx = createReadTransaction(store)

      const result = await tx.scan({}).toArray()
      expect(result).toStrictEqual([])
    })

    test('should support iterating over values', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
      })

      const result = []
      for await (const value of tx.scan({})) {
        result.push(value)
      }

      expect(result).toStrictEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    })

    test('should return all values, if no options are provided', async ({
      store,
    }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
      })

      const result = await tx.scan({}).toArray()
      expect(result).toStrictEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    })
  })

  describe('.values', () => {
    test('should return empty array, if store is empty', async ({ store }) => {
      const tx = createReadTransaction(store)

      const result = await tx.scan({}).values().toArray()
      expect(result).toStrictEqual([])
    })

    test('should support iterating over values', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
      })

      const result = []
      for await (const value of tx.scan({}).values()) {
        result.push(value)
      }

      expect(result).toStrictEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    })

    test('should return all values, if no options are provided', async ({
      store,
    }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
      })

      const result = await tx.scan({}).values().toArray()
      expect(result).toStrictEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    })

    test('should return values with prefix', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'other/1': '{"id":1}',
        'other/2': '{"id":2}',
        'other/3': '{"id":3}',
      })

      const result = await tx.scan({ prefix: 'row/' }).values().toArray()
      expect(result).toStrictEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
    })

    test('should return values with limit', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'row/4': '{"id":4}',
      })

      const result = await tx.scan({ limit: 2 }).values().toArray()
      expect(result).toStrictEqual([{ id: 1 }, { id: 2 }])
    })

    test('should return values with start key', async ({ store }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'row/4': '{"id":4}',
      })

      const result = await tx
        .scan({ start: { key: 'row/2' } })
        .values()
        .toArray()
      expect(result).toStrictEqual([{ id: 2 }, { id: 3 }, { id: 4 }])
    })

    test('should return values with start key and exclusive', async ({
      store,
    }) => {
      const tx = createReadTransaction(store)

      store.setValues({
        'row/1': '{"id":1}',
        'row/2': '{"id":2}',
        'row/3': '{"id":3}',
        'row/4': '{"id":4}',
      })

      const result = await tx
        .scan({ start: { key: 'row/2', exclusive: true } })
        .values()
        .toArray()
      expect(result).toStrictEqual([{ id: 3 }, { id: 4 }])
    })
  })
})

describe('tx.get', () => {
  test('should return undefined, if key is empty', async ({ store }) => {
    const tx = createReadTransaction(store)

    const value = await tx.get('row/1')
    expect(value).toBeUndefined()
  })

  test('should return value, if key exists', async ({ store }) => {
    const tx = createReadTransaction(store)

    store.setValues({
      'row/1': '{"id":1}',
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
    })

    const value = await tx.get('row/1')
    expect(value).toStrictEqual({ id: 1 })
  })
})

describe('tx.has', () => {
  test('should return false, if key is empty', async ({ store }) => {
    const tx = createReadTransaction(store)

    const value = await tx.has('row/1')
    expect(value).toBe(false)
  })

  test('should return true, if key exists', async ({ store }) => {
    const tx = createReadTransaction(store)

    store.setValues({
      'row/1': '{"id":1}',
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
    })

    const value = await tx.has('row/1')
    expect(value).toBe(true)
  })
})

describe('tx.isEmpty', () => {
  test('should return true, if store is empty', async ({ store }) => {
    const tx = createReadTransaction(store)

    const value = await tx.isEmpty()
    expect(value).toBe(true)
  })

  test('should return false, if store is not empty', async ({ store }) => {
    const tx = createReadTransaction(store)

    store.setValues({
      'row/1': '{"id":1}',
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
    })

    const value = await tx.isEmpty()
    expect(value).toBe(false)
  })
})

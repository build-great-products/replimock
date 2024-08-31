import { createStore } from 'tinybase'
import type { Store } from 'tinybase'
import { test as anyTest, describe, expect } from 'vitest'

import { createReadTransaction } from './read-transaction.js'

const test = anyTest.extend<{ store: Store }>({
  // biome-ignore lint/correctness/noEmptyPattern: vitest requires
  store: ({}, use) => use(createStore()),
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
    expect(value).toEqual({ id: 1 })
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

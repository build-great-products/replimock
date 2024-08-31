import { createStore } from 'tinybase'
import type { Store } from 'tinybase'
import { test as anyTest, describe, expect } from 'vitest'

import { createWriteTransaction } from './write-transaction.js'

const test = anyTest.extend<{ store: Store }>({
  // biome-ignore lint/correctness/noEmptyPattern: vitest requires
  store: ({}, use) => use(createStore()),
})

describe('writeTransaction', () => {
  test('should extend readTransaction', async ({ store }) => {
    const tx = createWriteTransaction(store)

    expect(tx.get).toBeDefined()
    expect(tx.has).toBeDefined()
    expect(tx.isEmpty).toBeDefined()
  })
})

describe('tx.set', () => {
  test('should set value', async ({ store }) => {
    const tx = createWriteTransaction(store)

    await tx.set('row/1', { id: 1 })

    const value = store.getValue('row/1')
    expect(value).toBe('{"id":1}')
  })

  test('should overwrite value', async ({ store }) => {
    const tx = createWriteTransaction(store)

    store.setValues({
      'row/1': '{"id":1}',
    })

    await tx.set('row/1', { id: 2 })

    const value = store.getValue('row/1')
    expect(value).toBe('{"id":2}')
  })
})

describe('tx.del', () => {
  test('should delete value', async ({ store }) => {
    const tx = createWriteTransaction(store)

    store.setValues({
      'row/1': '{"id":1}',
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
    })

    const hasKey = await tx.del('row/1')
    expect(hasKey).toBe(true)

    const values = store.getValues()
    expect(values).toEqual({
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
    })
  })

  test('should return false, if key does not exist', async ({ store }) => {
    const tx = createWriteTransaction(store)

    const hasKey = await tx.del('row/1')
    expect(hasKey).toBe(false)
  })
})

import { createStore } from 'tinybase'
import type { Store } from 'tinybase'
import { test as anyTest, describe, expect } from 'vitest'

import { createMutate } from './mutate.js'

const test = anyTest.extend<{ store: Store }>({
  // biome-ignore lint/correctness/noEmptyPattern: vitest requires
  store: ({}, use) => use(createStore()),
})

describe('mutate(cb)', () => {
  test('should return result', async ({ store }) => {
    const mutate = createMutate(store, {
      addRow: async (tx, value: { id: number }) => {
        await tx.set(`row/${value.id}`, value)
        return value
      },
    })

    const row = await mutate.addRow({ id: 1 })
    expect(row).toEqual({ id: 1 })

    const values = store.getValues()
    expect(values).toEqual({ 'row/1': '{"id":1}' })
  })
})

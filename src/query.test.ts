import { createStore } from 'tinybase'
import type { Store } from 'tinybase'
import { test as anyTest, describe, expect } from 'vitest'

import { createQuery } from './query.js'

const test = anyTest.extend<{ store: Store }>({
  // biome-ignore lint/correctness/noEmptyPattern: vitest requires
  store: ({}, use) => use(createStore()),
})

describe('query(cb)', () => {
  test('should return result', async ({ store }) => {
    const query = createQuery(store)

    store.setValues({
      'row/1': '{"id":1}',
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
    })

    const value = await query((tx) => {
      return Promise.all([tx.get('row/1'), tx.get('row/2'), tx.get('row/3')])
    })

    expect(value).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
  })
})

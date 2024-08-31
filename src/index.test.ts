import { setTimeout } from 'node:timers/promises'
import { describe, expect, test, vi } from 'vitest'

import { mockReplicache } from './index.js'

describe('mockReplicache', () => {
  test('should support basic mutate/query', async () => {
    const rep = mockReplicache({
      mutators: {
        addRow: async (tx, value: { id: number }) => {
          await tx.set(`row/${value.id}`, value)
          return value
        },
      },
    })

    await rep.mutate.addRow({ id: 1 })
    const value = await rep.query((tx) => tx.get('row/1'))

    expect(value).toEqual({ id: 1 })
  })

  test('should support basic experimentalWatch', async () => {
    const rep = mockReplicache({
      mutators: {
        addRow: async (tx, value: { id: number }) => {
          await tx.set(`row/${value.id}`, value)
          return value
        },
      },
    })

    const callback = vi.fn()
    const unwatch = rep.experimentalWatch(callback)

    await rep.mutate.addRow({ id: 1 })

    await setTimeout(0)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith([
      { op: 'add', key: 'row/1', newValue: { id: 1 } },
    ])

    unwatch()
  })

  test('should support querying initialData', async () => {
    const rep = mockReplicache({
      initialData: {
        'row/1': { id: 1 },
      },
      mutators: {},
    })

    const value = await rep.query((tx) => tx.get('row/1'))
    expect(value).toEqual({ id: 1 })
  })

  test('should support initialData with experimentalWatch', async () => {
    const rep = mockReplicache({
      initialData: {
        'row/1': { id: 1 },
      },
      mutators: {},
    })

    const callback = vi.fn()
    const unwatch = rep.experimentalWatch(callback, {
      initialValuesInFirstDiff: true,
    })

    await setTimeout(0)
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith([
      { op: 'add', key: 'row/1', newValue: { id: 1 } },
    ])

    unwatch()
  })
})

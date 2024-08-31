import { setTimeout } from 'node:timers/promises'
import { createStore } from 'tinybase'
import type { Store } from 'tinybase'
import { test as anyTest, describe, expect, vi } from 'vitest'

import { createExperimentalWatch } from './experimental-watch.js'

const test = anyTest.extend<{ store: Store }>({
  // biome-ignore lint/correctness/noEmptyPattern: vitest requires
  store: ({}, use) => use(createStore()),
})

describe('experimentalWatch(callback)', () => {
  test('should callback with diff', async ({ store }) => {
    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback)

    store.setValues({
      'row/1': '{"id":1}',
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
    })

    // Wait for the next tick to allow the callback to be called
    await setTimeout(0)
    expect(callback).toHaveBeenCalledWith([
      {
        key: 'row/1',
        op: 'add',
        newValue: { id: 1 },
      },
      {
        key: 'row/2',
        op: 'add',
        newValue: { id: 2 },
      },
      {
        key: 'row/3',
        op: 'add',
        newValue: { id: 3 },
      },
    ])

    unsubscribe()
  })

  test('should not callback after unsubscribe', async ({ store }) => {
    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback)
    unsubscribe()

    store.setValue('row/1', '{"id":1}')

    await setTimeout(0)
    expect(callback).toHaveBeenCalledTimes(0)
  })

  test('should ignore empty diff', async ({ store }) => {
    // pre-set value
    store.setValues({ 'row/1': '{"id":1}' })

    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback)

    // setting the same value should not trigger a callback
    store.setValue('row/1', '{"id":1}')

    await setTimeout(0)
    expect(callback).toHaveBeenCalledTimes(0)

    unsubscribe()
  })
})

describe('experimentalWatch(callback, {prefix})', () => {
  test('should callback with diff for matching prefix', async ({ store }) => {
    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback, { prefix: 'row/' })

    store.setValues({
      'row/1': '{"id":1}',
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
    })

    await setTimeout(0)
    expect(callback).toHaveBeenCalledWith([
      {
        key: 'row/1',
        op: 'add',
        newValue: { id: 1 },
      },
      {
        key: 'row/2',
        op: 'add',
        newValue: { id: 2 },
      },
      {
        key: 'row/3',
        op: 'add',
        newValue: { id: 3 },
      },
    ])

    unsubscribe()
  })

  test('should not callback with diff for non-matching prefix', async ({
    store,
  }) => {
    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback, { prefix: 'row/' })

    store.setValue('col/1', '{"id":1}')

    await setTimeout(0)
    expect(callback).toHaveBeenCalledTimes(0)

    unsubscribe()
  })

  test('should handle multiple watchers', async ({ store }) => {
    const experimentalWatch = createExperimentalWatch(store)

    const callback1 = vi.fn()
    const callback2 = vi.fn()
    const unsubscribe1 = experimentalWatch(callback1, { prefix: 'row/' })
    const unsubscribe2 = experimentalWatch(callback2, { prefix: 'col/' })

    store.setValues({
      'row/1': '{"id":1}',
      'col/1': '{"id":1}',
    })

    await setTimeout(0)
    expect(callback1).toHaveBeenCalledWith([
      {
        key: 'row/1',
        op: 'add',
        newValue: { id: 1 },
      },
    ])
    expect(callback2).toHaveBeenCalledWith([
      {
        key: 'col/1',
        op: 'add',
        newValue: { id: 1 },
      },
    ])

    unsubscribe1()
    unsubscribe2()
  })
})

describe('experimentalWatch(callback, {initialValuesInFirstDiff})', () => {
  test('should not callback if no initial values', async ({ store }) => {
    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback, {
      initialValuesInFirstDiff: true,
    })

    await setTimeout(0)
    expect(callback).toHaveBeenCalledTimes(0)

    unsubscribe()
  })

  test('should callback with initial values in first diff', async ({
    store,
  }) => {
    store.setValues({
      'row/1': '{"id":1}',
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
    })

    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback, {
      initialValuesInFirstDiff: true,
    })

    await setTimeout(0)
    expect(callback).toHaveBeenCalledWith([
      {
        key: 'row/1',
        op: 'add',
        newValue: { id: 1 },
      },
      {
        key: 'row/2',
        op: 'add',
        newValue: { id: 2 },
      },
      {
        key: 'row/3',
        op: 'add',
        newValue: { id: 3 },
      },
    ])

    unsubscribe()
  })

  test('should not callback with initial values in subsequent diffs', async ({
    store,
  }) => {
    store.setValue('row/1', '{"id":1}')

    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback, {
      initialValuesInFirstDiff: true,
    })

    expect(callback).toHaveBeenCalledWith([
      {
        key: 'row/1',
        op: 'add',
        newValue: { id: 1 },
      },
    ])

    // setting the same value should not trigger a callback
    store.setValue('row/1', '{"id":1}')

    expect(callback).toHaveBeenCalledTimes(1)

    unsubscribe()
  })
})

describe('experimentalWatch(callback, {prefix, initialValuesInFirstDiff})', () => {
  test('should not callback if no matching initial values', async ({
    store,
  }) => {
    store.setValues({
      'col/1': '{"id":1}',
    })

    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback, {
      prefix: 'row/',
      initialValuesInFirstDiff: true,
    })

    await setTimeout(0)
    expect(callback).toHaveBeenCalledTimes(0)

    unsubscribe()
  })

  test('should callback with initial values in first diff for matching prefix', async ({
    store,
  }) => {
    store.setValues({
      'row/1': '{"id":1}',
      'row/2': '{"id":2}',
      'row/3': '{"id":3}',
      'col/1': '{"id":1}',
    })

    const experimentalWatch = createExperimentalWatch(store)

    const callback = vi.fn()
    const unsubscribe = experimentalWatch(callback, {
      prefix: 'row/',
      initialValuesInFirstDiff: true,
    })

    await setTimeout(0)
    expect(callback).toHaveBeenCalledWith([
      {
        key: 'row/1',
        op: 'add',
        newValue: { id: 1 },
      },
      {
        key: 'row/2',
        op: 'add',
        newValue: { id: 2 },
      },
      {
        key: 'row/3',
        op: 'add',
        newValue: { id: 3 },
      },
    ])

    unsubscribe()
  })
})

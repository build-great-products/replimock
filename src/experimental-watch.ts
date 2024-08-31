import type {
  ExperimentalDiffOperation as Diff,
  ExperimentalNoIndexDiff as DiffList,
  ExperimentalWatchCallbackForOptions,
  ExperimentalWatchOptions,
  Replicache,
} from 'replicache'
import type { Store } from 'tinybase'

import { jsonstring } from './jsonstring.js'

type ExperimentalWatch = Replicache['experimentalWatch']

type WatchFn = (diffList: DiffList) => void

const createExperimentalWatch = (store: Store): ExperimentalWatch => {
  const watchPrefixMap = new Map<string, WatchFn[]>()
  const watchAllSet = new Set<WatchFn>()

  const experimentalWatch = <Options extends ExperimentalWatchOptions>(
    callback: ExperimentalWatchCallbackForOptions<Options>,
    options?: Options,
  ) => {
    if (options) {
      if ('indexName' in options && typeof options.indexName === 'string') {
        throw new Error(
          '[replimock] Using indexName with .experimentalWatch is not supported',
        )
      }

      if (options.initialValuesInFirstDiff) {
        const values = store.getValues()
        const diffList: Diff<string>[] = []
        for (const [key, newValue] of Object.entries(values)) {
          if (options.prefix ? key.startsWith(options.prefix) : true) {
            if (typeof newValue !== 'string') {
              throw new Error('[replimock] newValue must be a string')
            }
            diffList.push({
              op: 'add',
              key,
              newValue: jsonstring.decode(newValue),
            })
          }
        }
        if (diffList.length > 0) {
          ;(callback as WatchFn)(diffList)
        }
      }

      if (options.prefix) {
        const prefix = options.prefix

        const list = watchPrefixMap.get(prefix) ?? []
        list.push(callback as WatchFn)
        watchPrefixMap.set(prefix, list)

        return () => {
          const list = watchPrefixMap.get(prefix)
          if (!list) {
            return
          }
          const index = list.indexOf(callback as WatchFn)
          if (index === -1) {
            return
          }
          if (list.length === 1) {
            watchPrefixMap.delete(prefix)
          } else {
            list.splice(index, 1)
          }
        }
      }
    }

    watchAllSet.add(callback as WatchFn)
    return () => {
      watchAllSet.delete(callback as WatchFn)
    }
  }

  const handleDiffList = (diffList: DiffList) => {
    if (diffList.length === 0) {
      return
    }

    for (const watchFn of watchAllSet) {
      watchFn(diffList)
    }

    const foundWatchMap = new Map<WatchFn, Diff<string>[]>()

    for (const diff of diffList) {
      for (const prefix of watchPrefixMap.keys()) {
        if (diff.key.startsWith(prefix)) {
          const watchFns = watchPrefixMap.get(prefix)
          if (watchFns) {
            for (const watchFn of watchFns) {
              const foundDiffs = foundWatchMap.get(watchFn) ?? []
              foundDiffs.push(diff)
              foundWatchMap.set(watchFn, foundDiffs)
            }
          }
        }
      }
    }

    for (const [watchFn, diffs] of foundWatchMap) {
      watchFn(diffs as DiffList)
    }
  }

  const batchHandle = (() => {
    let diffList: Diff<string>[] = []
    let timer: NodeJS.Timeout | undefined = undefined

    return (diff: Diff<string>) => {
      diffList.push(diff)
      if (timer === undefined) {
        timer = setTimeout(() => {
          const thisDiffList = diffList
          diffList = []
          timer = undefined
          handleDiffList(thisDiffList)
        }, 0)
      }
    }
  })()

  store.addValueListener(null, (_store, key, newValue, oldValue) => {
    let diff: Diff<string>
    if (oldValue === undefined) {
      if (typeof newValue !== 'string') {
        throw new Error('[replimock] newValue must be a string')
      }
      diff = { op: 'add', key, newValue: jsonstring.decode(newValue) }
    } else if (newValue === undefined) {
      if (typeof oldValue !== 'string') {
        throw new Error('[replimock] oldValue must be a string')
      }
      diff = { op: 'del', key, oldValue: jsonstring.decode(oldValue) }
    } else {
      if (typeof newValue !== 'string') {
        throw new Error('[replimock] newValue must be a string')
      }
      if (typeof oldValue !== 'string') {
        throw new Error('[replimock] oldValue must be a string')
      }
      diff = {
        op: 'change',
        key,
        newValue: jsonstring.decode(newValue),
        oldValue: jsonstring.decode(oldValue),
      }
    }
    batchHandle(diff)
  })

  return experimentalWatch
}

export { createExperimentalWatch }

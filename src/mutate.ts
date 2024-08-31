import type {
  MutatorDefs,
  ReadonlyJSONValue,
  WriteTransaction,
} from 'replicache'
import type { Store } from 'tinybase'

import { createWriteTransaction } from './write-transaction.js'

type MaybePromise<T> = T | Promise<T>
type ToPromise<P> = P extends Promise<unknown> ? P : Promise<P>

type MutatorReturn<T extends ReadonlyJSONValue = ReadonlyJSONValue> =
  // biome-ignore lint/suspicious/noConfusingVoidType:
  MaybePromise<T | void>

type MakeMutator<
  F extends (
    tx: WriteTransaction,
    ...args: [] | [ReadonlyJSONValue]
  ) => MutatorReturn,
> = F extends (tx: WriteTransaction, ...args: infer Args) => infer Ret
  ? (...args: Args) => ToPromise<Ret>
  : never

type MakeMutators<T extends MutatorDefs> = {
  readonly [P in keyof T]: MakeMutator<T[P]>
}

const createMutate = <MD extends MutatorDefs>(
  store: Store,
  mutators: MD,
): MakeMutators<MD> => {
  return Object.fromEntries(
    Object.entries(mutators).map(([name, mutator]) => {
      return [
        name,
        async (...args) => {
          const tx = createWriteTransaction(store)
          return mutator(tx, ...args)
        },
      ]
    }),
  ) as MakeMutators<MD>
}

export { createMutate }

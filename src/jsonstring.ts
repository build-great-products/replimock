import type { ReadonlyJSONValue } from 'replicache'

const jsonstring = {
  decode: (input: string): ReadonlyJSONValue => {
    return JSON.parse(input)
  },
  encode: (input: ReadonlyJSONValue): string => {
    return JSON.stringify(input)
  },
}

export { jsonstring }

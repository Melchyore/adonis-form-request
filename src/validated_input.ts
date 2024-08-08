import type { Only, Except, Merge } from './types.js'
import type { Infer } from '@vinejs/vine/types'
import type { FormRequestBaseType } from './form_request.js'

import lodash from '@poppinss/utils/lodash'

export default class ValidatedInput<T extends FormRequestBaseType> {
  constructor(private data: Infer<ReturnType<T['rules']>>) {}

  public all() {
    return this.data
  }

  public only<Keys extends keyof Infer<ReturnType<T['rules']>>>(keys: Keys[]) {
    return lodash.pick(this.data, keys) as Only<T, Keys>
  }

  public except<Keys extends keyof Infer<ReturnType<T['rules']>>>(keys: Keys[]) {
    return lodash.omit(this.data, keys) as Except<T, Keys>
  }

  public merge<Inputs extends Record<string, any>>(inputs: Inputs) {
    return Object.assign({}, this.data, inputs) as Merge<Infer<ReturnType<T['rules']>>, Inputs>
  }
}

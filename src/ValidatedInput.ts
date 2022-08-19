import type {
  Only,
  Except,
  FormRequestContract,
  ExtractKeyFromSchema,
  ValidatedInputContract,
} from '@ioc:Adonis/Addons/FormRequest'

import { lodash } from '@poppinss/utils'

export default class ValidatedInput<T extends FormRequestContract>
  implements ValidatedInputContract<T>
{
  constructor(private data: ExtractKeyFromSchema<T>) {}

  public all() {
    return this.data
  }

  public only<Keys extends keyof ExtractKeyFromSchema<T>>(keys: Keys[]) {
    return lodash.pick(this.data, keys) as Only<T, Keys>
  }

  public except<Keys extends keyof ExtractKeyFromSchema<T>>(keys: Keys[]) {
    return lodash.omit(this.data, keys) as Except<T, Keys>
  }

  public merge<Inputs extends Record<string, any>>(inputs: Inputs) {
    return Object.assign({}, this.data, inputs) as any
  }
}

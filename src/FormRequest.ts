import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { RequestContract } from '@ioc:Adonis/Core/Request'
import type { ExtractKeyFromSchema, ValidatedInputContract } from '@ioc:Adonis/Addons/FormRequest'

import { Hooks } from '@poppinss/hooks'

import ValidatedInput from './ValidatedInput'

export default abstract class FormRequest {
  private hooks = new Hooks()

  protected $validatedPayload: any

  constructor(protected context: HttpContextContract) {
    this.hooks.add('before', 'validation', this.before.bind(this))
    this.hooks.add('after', 'validation', this.after.bind(this))

    if (context.resources) {
      for (const resource in context.resources) {
        this[resource] = context.resources[resource]
      }
    }

    return new Proxy(this.context.request, {
      get: (target: any, prop: any) => {
        const proxifiedProp = target[prop] ? target[prop] : this[prop] ? this[prop] : null

        if (proxifiedProp) {
          if (typeof proxifiedProp === 'function') {
            return proxifiedProp.bind(target[prop] ? target : this)
          }

          return proxifiedProp
        }
      },
    }) as RequestContract & typeof this
  }

  /*public get validatedPayload() {
    return this.$validatedPayload
  }*/

  /**
   * Determine if the user is authorized to make the incoming request.
   */
  public async authorize(): Promise<boolean> {
    return true
  }

  /**
   * Before hook to be executed before validation.
   */
  protected async before(): Promise<void> {}

  /**
   * After hook to be executed after validation.
   */
  protected async after(): Promise<void> {}

  /**
   * Validation rules.
   */
  public abstract rules()

  public async validatePayload(): Promise<void> {
    this.hooks.exec('before', 'validation')
    this.$validatedPayload = await this.context.request.validate(this.rules())
    this.hooks.exec('after', 'validation')
  }

  public safe(): ValidatedInputContract<any> {
    return new ValidatedInput<any>(this.$validatedPayload)
  }

  public validated(): ExtractKeyFromSchema<any> {
    return this.$validatedPayload
  }
}

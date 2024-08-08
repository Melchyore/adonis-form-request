import type { VineValidator } from '@vinejs/vine'
import type { Infer, SchemaTypes } from '@vinejs/vine/types'

import Hooks from '@poppinss/hooks'

import ValidatedInput from './validated_input.js'
import { HttpContext } from '@adonisjs/core/http'
import { Constructor } from './types.js'

abstract class FormRequest {
  private hooks = new Hooks()

  protected $validatedPayload: any

  constructor(protected context: HttpContext) {
    this.hooks.add('before', { name: 'beforeValidation', handle: this.before.bind(this) })
    this.hooks.add('after', { name: 'afterValidation', handle: this.after.bind(this) })

    if ('resources' in context) {
      for (const resource in context.resources as Record<string, any>) {
        this[resource as keyof this] = (context.resources as Record<string, any>)[resource]
      }
    }

    this.context.request = new Proxy(this.context.request, {
      get: (target, prop) => {
        const proxifiedProp = target[prop] ? target[prop] : this[prop] ? this[prop] : null

        if (proxifiedProp) {
          if (typeof proxifiedProp === 'function') {
            return proxifiedProp.bind(target[prop] ? target : this)
          }

          return proxifiedProp
        }
      },
    })
  }

  public get request() {
    return this.context.request as HttpContext['request'] & typeof this
  }

  /*
  public get request() {
    return this.context.request as typeof this & HttpContext['request']
  }

  public get response() {
    return this.context.response
  }

  public get params() {
    return this.context.params
  }

  public get logger() {
    return this.context.logger
  }

  public get subdomains() {
    return this.context.subdomains
  }

  public get inspect() {
    return this.context.inspect
  }

  public get containerResolver() {
    return this.context.containerResolver
  } */

  /**
   * Determine if the user is authorized to make the incoming request.
   */
  public async authorize() {
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
  public abstract rules(): VineValidator<SchemaTypes, Record<string, any>>

  public async validatePayload(): Promise<void> {
    const beforeHookRunner = this.hooks.runner('before')
    await beforeHookRunner.run()

    this.$validatedPayload = await this.context.request.validateUsing(this.rules())

    const afterHookRunner = this.hooks.runner('after')
    await afterHookRunner.run()
  }

  public safe() {
    return new ValidatedInput<this>(this.$validatedPayload)
  }

  public validated(): Infer<ReturnType<this['rules']>> {
    return this.$validatedPayload
  }
}

export type FormRequestBaseType = InstanceType<typeof FormRequest>

type FormRequestType = HttpContext & FormRequestBaseType

const FormRequestBase = FormRequest as unknown as Constructor<FormRequestType>

export { FormRequestBase }

// export abstract class FormRequestV2 {
//   protected $validatedPayload: any

//   constructor(protected context: HttpContext) {
//     Object.defineProperty(this.context.request, 'formRequestHooks', {
//       value: new Hooks(),
//       writable: false,
//       enumerable: false,
//     })
//     this.context.request['formRequestHooks'].add('before', {
//       name: 'beforeValidation',
//       handle: this.before.bind(this),
//     })
//     this.context.request['formRequestHooks'].add('after', {
//       name: 'afterValidation',
//       handle: this.after.bind(this),
//     })

//     /**
//      * Determine if the user is authorized to make the incoming request.
//      */
//     Object.defineProperty(this.context.request, 'authorize', {
//       value: () => true,
//       writable: true,
//       enumerable: false,
//     })

//     /**
//      * Before hook to be executed before validation.
//      */
//     Object.defineProperty(this.context.request, 'before', {
//       value: () => {},
//       writable: true,
//       enumerable: false,
//     })

//     /**
//      * After hook to be executed after validation.
//      */
//     Object.defineProperty(this.context.request, 'after', {
//       value: () => {},
//       writable: true,
//       enumerable: false,
//     })
//   }

//   /**
//    * Validation rules.
//    */
//   public abstract rules(): VineValidator<SchemaTypes, Record<string, any>>

//   public async validatePayload(): Promise<void> {
//     const beforeHookRunner = this.hooks.runner('before')
//     await beforeHookRunner.run()

//     this.$validatedPayload = await this.context.request.validateUsing(this.rules())

//     const afterHookRunner = this.hooks.runner('after')
//     await afterHookRunner.run()
//   }

//   public safe() {
//     return new ValidatedInput<this>(this.$validatedPayload)
//   }

//   public validated(): Infer<ReturnType<this['rules']>> {
//     return this.$validatedPayload
//   }
// }

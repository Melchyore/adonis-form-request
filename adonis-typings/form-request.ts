declare module '@ioc:Adonis/Addons/FormRequest' {
  import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
  import type { RequestContract } from '@ioc:Adonis/Core/Request'
  import type {
    TypedSchema,
    ParsedTypedSchema,
    SchemaRef,
    CustomMessages,
    ErrorReporterConstructorContract,
  } from '@ioc:Adonis/Core/Validator'

  export type Constructor<T extends {} = {}> = new (...args: any[]) => T

  export type DecoratorFn = (target: any, property: any) => void

  export interface Validator {
    schema: ParsedTypedSchema<TypedSchema>
    data?: any
    refs?: {
      [key: string]: SchemaRef<unknown>
    }
    cacheKey?: string
    messages?: CustomMessages
    existsStrict?: boolean
    reporter?: ErrorReporterConstructorContract
    bail?: boolean
  }

  type Schema<T> = T extends Constructor<Validator>
    ? InstanceType<T>['schema']
    : T extends { schema: ParsedTypedSchema<TypedSchema> }
    ? T['schema']
    : never

  export type ExtractKeyFromSchema<T extends FormRequestContract> = Schema<
    ReturnType<InstanceType<T>['rules']>
  >['props']

  type Merge<A, B> = {
    [K in keyof A]: A[K]
  } & {
    [K in keyof B]: B[K]
  }

  export type Only<T extends FormRequestContract, Keys extends keyof ExtractKeyFromSchema<T>> = {
    [Key in keyof Pick<ExtractKeyFromSchema<T>, Keys>]: ExtractKeyFromSchema<T>[Key]
  }

  export type Except<T extends FormRequestContract, Keys extends keyof ExtractKeyFromSchema<T>> = {
    [Key in keyof Omit<ExtractKeyFromSchema<T>, Keys>]: ExtractKeyFromSchema<T>[Key]
  }

  export interface ValidatedInputContract<T extends FormRequestContract> {
    all(): ExtractKeyFromSchema<T>

    only<Keys extends keyof ExtractKeyFromSchema<T>>(
      keys: Keys[]
    ): {
      [Key in keyof Pick<ExtractKeyFromSchema<T>, Keys>]: ExtractKeyFromSchema<T>[Key]
    }

    except<Keys extends keyof ExtractKeyFromSchema<T>>(
      keys: Keys[]
    ): {
      [Key in keyof Omit<ExtractKeyFromSchema<T>, Keys>]: ExtractKeyFromSchema<T>[Key]
    }

    merge<Inputs extends Record<string, any>, U extends ExtractKeyFromSchema<T>>(
      inputs: Inputs
    ): {
      [Key in keyof Merge<U, Inputs>]: Merge<U, Inputs>[Key]
    }
  }

  interface FormRequestContract extends Omit<RequestContract, 'post'> {
    new (...args: Array<any>): this

    authorize(): Promise<boolean>

    rules(): Constructor<Validator> | Validator

    validated(): ExtractKeyFromSchema<this>

    safe(): ValidatedInputContract<this>
  }

  export const FormRequest: FormRequestContract

  export interface HttpContextFormRequestContract<T extends FormRequestContract>
    extends HttpContextContract {
    request: HttpContextContract['request'] & {
      validated(): ExtractKeyFromSchema<T>
      safe(): ValidatedInputContract<T>
    }
  }
}

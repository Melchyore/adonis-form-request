import type { Infer } from '@vinejs/vine/types'

import type { FormRequestBaseType } from './form_request.js'
import { Route } from '@adonisjs/http-server'
import { RouteFn, LazyImport } from '@adonisjs/http-server/types'

export type Constructor<T extends {} = {}> = new (...args: any[]) => T

export type DecoratorFn = (target: any, property: any) => void

type GetControllerHandlers<Controller extends Constructor<any>> = {
  [K in keyof InstanceType<Controller>]: InstanceType<Controller>[K] extends (
    ctx: any,
    ...args: any[]
  ) => any
    ? K
    : never
}[keyof InstanceType<Controller>]

declare module '@adonisjs/core/http' {
  interface Router {
    get<T extends Constructor<any>>(
      pattern: string,
      handler: string | RouteFn | [LazyImport<T> | T, GetControllerHandlers<T>?]
    ): Route<T>
  }
}

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
    ? T extends infer O
      ? { [K in keyof O]: ExpandRecursively<O[K]> }
      : never
    : T

export type Merge<A, B> = ExpandRecursively<
  {
    [K in keyof A]: A[K]
  } & {
    [K in keyof B]: B[K]
  }
>

export type Only<
  T extends FormRequestBaseType,
  Keys extends keyof Infer<ReturnType<T['rules']>>,
> = ExpandRecursively<Pick<Infer<ReturnType<T['rules']>>, Keys>>

export type Except<
  T extends FormRequestBaseType,
  Keys extends keyof Infer<ReturnType<T['rules']>>,
> = ExpandRecursively<Omit<Infer<ReturnType<T['rules']>>, Keys>>

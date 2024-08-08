import 'reflect-metadata'
import { HttpContext } from '@adonisjs/core/http'

import { FormRequest } from '../form_request.js'

export function formRequest() {
  return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const methodParams = Reflect.getMetadata('design:paramtypes', target, propertyKey)

    descriptor.value = async function (...args: any[]) {
      const context = args[0] as HttpContext
      const { response } = context

      for (let i = 0; i < methodParams.length; ++i) {
        if (
          typeof methodParams[i] === 'function' &&
          Object.getPrototypeOf(methodParams[i]) === FormRequest
        ) {
          const requestInstance = new methodParams[i](context) as FormRequest

          if (!(await requestInstance.authorize())) {
            return response.forbidden()
          }

          await requestInstance.validatePayload()

          args[i] = requestInstance
        }
      }

      return await originalMethod.apply(this, args)
    }
  }
}

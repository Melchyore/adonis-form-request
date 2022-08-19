import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import FormRequest from '../FormRequest'

export function formRequest() {
  return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    const methodParams = Reflect.getMetadata('design:paramtypes', target, propertyKey)

    descriptor.value = async function (...args: any[]) {
      const context = args[0] as HttpContextContract
      const { response } = context

      for (let i = 0; i < methodParams.length; ++i) {
        if (
          typeof methodParams[i] === 'function' &&
          Object.getPrototypeOf(methodParams[i]) === FormRequest
        ) {
          const requestInstance = new methodParams[i](context)

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

import type { NextFn } from '@adonisjs/core/types/http'
import type { HttpContext } from '@adonisjs/core/http'

export class FormRequestMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    console.log('test')
    const formRequestClass =
      ctx.route?.handler.reference[0].containerInjections[ctx.route?.handler.reference[1]]
        .dependencies[0]
    const formRequest = new formRequestClass(ctx)

    try {
      if (!(await formRequest.authorize())) {
        return ctx.response.forbidden()
      }

      await formRequest.validatePayload()
    } catch (e) {
      console.log(e)
    }

    return next()
  }
}

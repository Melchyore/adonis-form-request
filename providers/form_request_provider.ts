import type { ApplicationService } from '@adonisjs/core/types'
import type { RequestValidator } from '@adonisjs/core/http'

import FormRequestMiddleware from '../src/form_request_middleware.js'

/**
 * Extend HTTP request class
 */
declare module '@adonisjs/core/http' {
  interface Request extends RequestValidator {}
}

export default class FormRequestProvider {
  constructor(protected app: ApplicationService) {}

  register() {}
}

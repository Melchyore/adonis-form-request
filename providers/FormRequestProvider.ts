import { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class FormRequestProvider {
  public static needsApplication = true

  constructor(protected app: ApplicationContract) {}

  public register() {
    this.app.container.singleton('Adonis/Addons/FormRequest', () => {
      const FormRequest = require('../src/FormRequest').default

      return { FormRequest }
    })
  }

  public async boot() {}

  public async ready() {}

  public async shutdown() {
    // Cleanup, since app is going down
  }
}

declare module '@ioc:Adonis/Core/Application' {
  import type { FormRequestContract, DecoratorFn } from '@ioc:Adonis/Addons/FormRequest'
  export interface ContainerBindings {
    'Adonis/Addons/FormRequest': {
      FormRequest: FormRequestContract
    }
  }
}

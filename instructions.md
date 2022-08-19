The package has been configured successfully.

In order to use this package, you need to create a Request class using the following command.

```sh
node ace make:request StoreUser
```

It will create a file named `StoreUserRequest.ts` in `App/Requests`. Feel free to read the docs to edit this file.

```ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { schema } from '@ioc:Adonis/Core/Validator'
import { FormRequest } from '@ioc:Adonis/Addons/FormRequest'

export default class StoreUserRequest extends FormRequest {
  constructor(protected context: HttpContextContract) {
    super(context)
  }

  /**
   * Determine if the user is authorized to make the incoming request.
   * Can be safely deleted if you don't have any authorization logic.
   */
  public async authorize() {
    return true
  }

  /**
   * Validation rules.
   * Can also return a Validator class.
   */
  public rules() {
    return {
      schema: schema.create({})
    }
  }

  /**
   * Before hook to be executed before validation.
   */
  protected async before() {}

  /**
   * After hook to be executed after validation.
   */
  protected async after() {}
}

```

Then, in a controller, you need to import the `formRequest` decorator and your file.

```ts
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { formRequest } from '@melchyore/adonis-form-request/build'

import StoreUserRequest from 'App/Requests'

export default class UsersController {
  @formRequest()
  public async store(context: HttpContextContract, request: StoreUserRequest) {
    await User.create(request.validated())
  }
}
```

When using a Form request class, you must **never** use `request` from `context`, always use the **second** `request` argument.

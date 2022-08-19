<div align="center">
  <h1><b>Adonis Form Request</b></h1>

  <p>Use dedicated classes to authorize and validate requests</p>

  <p>
    <a href="https://github.com/Melchyore/adonis-form-request/actions/workflows/test.yml" target="_blank">
      <img alt="Build" src="https://img.shields.io/github/workflow/status/Melchyore/adonis-form-request/test?style=for-the-badge" />
    </a>
    <a href="https://npmjs.org/package/@melchyore/adonis-form-request" target="_blank">
      <img alt="npm" src="https://img.shields.io/npm/v/@melchyore/adonis-form-request.svg?style=for-the-badge&logo=npm" />
    </a>
    <a href="https://github.com/Melchyore/adonis-form-request/blob/master/LICENSE.md" target="_blank">
      <img alt="License: MIT" src="https://img.shields.io/npm/l/@melchyore/adonis-form-request?color=blueviolet&style=for-the-badge" />
    </a>
    <img alt="Typescript" src="https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript" />
  </p>
</div>

## **Introduction**
There is a division of opinion as to how controllers files should be simplified. Some suggest to create service classes that will handle all the logic but we will still have the same problem. To solve this, we can create a Request class that will handle both authorization and validation, in addition to lifecycle hooks to perform some actions before and after validation.

Form requests should be used to authorize only a specific request. If you have the same authorization logic for multiple requests, you should use a middleware.

## **Pre-requisites**
> Node.js >= 16.17.0

## **Installation**

```sh
npm install @melchyore/adonis-form-request
# or
yarn add @melchyore/adonis-form-request
# or
pnpm install @melchyore/adonis-form-request
```
## **Configure**
```sh
node ace configure @melchyore/adonis-form-request
```

## **Usage**
```sh
node ace make:request StoreUser
```

It will create a file named `StoreUserRequest.ts` in `App/Requests`.

```ts
// App/Requests/StoreUserRequest.ts

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
   * After hook to be executed after successful validation.
   */
  protected async after() {}
}
```

- `authorize()` returns a `boolean`. This method is used to authorize the incoming request. If you don't have an authorization logic, you can delete the method as it always returns `true` in the parent class. When it returns `false`, an HTTP response with status code 403 will be returned and the controller method will not be executed.

- `rules()` returns a [schema validator](https://docs.adonisjs.com/guides/validator/introduction#schema-composition) or a [validator class](https://docs.adonisjs.com/guides/validator/introduction#validator-classes).

- `before()` doesn't return anything. You can perform some actions before validation. If you want to access request data, you can do it through `this.context.request`.

- `after()` doesn't return anything. You can perform some actions after validation. If you want to access validated data, you can do it through `this.validated()`.

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

It has the same methods and properties as the default `Request` class, in addition to new methods.

- `validated()` returns the validated data.

- `safe()` returns in instance of `ValidatedInput`.

- `safe().all()` returns the same data as `validated()`.

- `safe().only(['foo', 'bar'])` returns only the specified validated keys.

- `safe().except(['foo', 'bar'])` returns all validated data except specified keys.

- `safe().merge({ foo: 'Foo' })` merges and returns the specified data with the validated data.

> **Note**
> 
> All the above methods are typed.

> **Note**
> 
> If the validation fails, an HTTP response with status code 422 will be returned and the controller method will not be executed.

## **Usage with route model binding**
When using route model binding and form request on the same controller method (same request), the request argument **must** be the last one.

```ts
// App/Controllers/Http/PostsController.ts

import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { bind } from '@adonisjs/route-model-binding'
import { formRequest } from '@melchyore/adonis-form-request/build'

import Post from 'App/Models/Post'
import UpdatePostRequest from 'App/Requests/UpdatePostRequest'

export default class PostsController {
  @bind()
  @formRequest()
  public async update ({ response }: HttpContextContract, post: Post, request: UpdatePostRequest) {
    const { title, content } = request.validated()

    await post.merge({
      title,
      content
    })
      .save()

    return response.ok(post)
  }
}
```

You have also access to the bindings in the form request class. You can use them to authorize the requests.

```ts
// App/Requests/UpdatePostRequest.ts

import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { schema } from '@ioc:Adonis/Core/Validator'
import { FormRequest } from '@ioc:Adonis/Addons/FormRequest'

export default class UpdatePostRequest extends FormRequest {
  private post: Post // ⬅ Will automatically have the post instance as value.

  constructor(protected context: HttpContextContract) {
    super(context)
  }

  /**
   * Determine if the user is authorized to make the incoming request.
   * Can be safely deleted if you don't have any authorization logic.
   */
  public async authorize() {
    return this.context.auth.user.id === this.post.userId
  }

  /**
   * Validation rules.
   * Can also return a Validator class.
   */
  public rules() {
    return {
      schema: schema.create({
        title: schema.string({ trim: true }),
        content: schema.string({ trim: true })
      })
    }
  }

  /**
   * Before hook to be executed before validation.
   */
  protected async before() {}

  /**
   * After hook to be executed after successful validation.
   */
  protected async after() {}
}
```

> **Note**
>
> The `Request` class has the method `post()` which is **deprecated**, and the form request class returns an instance of `Request`, so if you are still using it, don't name your argument `post` as it will override the method.

> **Note**
>
> Bindings are not available in the form request constructor.

## Run tests

```sh
yarn run test
```

## Author

👤 **Oussama Benhamed**

* Twitter: [@Melchyore](https://twitter.com/Melchyore)
* Github: [@Melchyore](https://github.com/Melchyore)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/Melchyore/adonis-form-request/issues). You can also take a look at the [contributing guide](https://github.com/Melchyore/adonis-form-request/blob/master/CONTRIBUTING.md).

## Show your support

Give a ⭐️ if this project helped you!

<a href="https://www.patreon.com/melchyore">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## 📝 License

Copyright © 2022 [Oussama Benhamed](https://github.com/Melchyore).<br />
This project is [MIT](https://github.com/Melchyore/adonis-form-request/blob/master/LICENSE.md) licensed.

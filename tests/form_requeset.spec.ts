import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { Schema } from '@ioc:Adonis/Core/Validator'
import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

import { createServer } from 'node:http'
import { join } from 'node:path'
import supertest from 'supertest'
import { test } from '@japa/runner'
import { Server } from '@adonisjs/core/build/standalone'

import { formRequest } from '../src/Decorators/formRequest'
import { setup, fs, encryption, serverConfig } from '../test-helpers'
import ValidatedInput from '../src/ValidatedInput'

let app: ApplicationContract
let schema: Schema

test.group('Form request', (group) => {
  group.each.setup(async () => {
    await fs.fsExtra.ensureDir(join(fs.basePath, 'database'))
  })

  group.setup(async () => {
    app = await setup()
    schema = app.container.resolveBinding('Adonis/Core/Validator').schema
  })

  group.teardown(async () => {
    await fs.cleanup()
  })

  test('return 403 error when authorize method returns false', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)

    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')
    const stack: Array<string> = []

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return false
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string(),
            slug: schema.string(),
          }),
        }
      }
    }

    class PostsController {
      @formRequest()
      public async show(_: HttpContextContract, __: PostRequest) {
        stack.push('foo')
      }
    }

    const httpServer = createServer(server.handle.bind(server))

    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.get('/posts/:post', 'PostsController.show')
    server.optimize()

    await supertest(httpServer).get('/posts/1').expect(403)
    expect(stack).toHaveLength(0)
  })

  test('return 422 error when validation fails', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)

    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')
    const stack: Array<string> = []

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string(),
            slug: schema.string(),
          }),
        }
      }
    }

    class PostsController {
      @formRequest()
      public async show(_: HttpContextContract, __: PostRequest) {
        stack.push('foo')
      }
    }

    const httpServer = createServer(server.handle.bind(server))

    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.get('/posts/:post', 'PostsController.show')
    server.optimize()

    await supertest(httpServer).get('/posts/1').expect(422)
    expect(stack).toHaveLength(0)
  })

  test('type-hint request parameter should create a form request instance', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)

    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')
    const stack: Array<string> = []

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string(),
            slug: schema.string(),
          }),
        }
      }
    }

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, request: PostRequest) {
        stack.push('foo')

        expect(request instanceof FormRequest)
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test&slug=test-slug').expect(200)

    expect(stack).toHaveLength(1)
  })

  test('form request instance should extend from Request', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)

    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string(),
            slug: schema.string(),
          }),
        }
      }
    }

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, request: PostRequest) {
        expect(request.constructor.name.split(' ')[1]).toStrictEqual('Request')
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test&slug=test-slug').expect(200)
  })

  test('validated method should return validated data', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)
    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string({
              trim: true,
            }),
            slug: schema.string(),
          }),
        }
      }
    }

    let validated: any = null

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, request: PostRequest) {
        validated = request.validated()
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test    &slug=test-slug').expect(200)

    expect(validated).toStrictEqual({
      title: 'Test',
      slug: 'test-slug',
    })
  })

  test('before hook method should be executed before validation', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)
    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string({
              trim: true,
            }),
            slug: schema.string(),
          }),
        }
      }

      protected async before() {
        expect(this.validated()).toBeUndefined()
      }
    }

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, __: PostRequest) {}
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test&slug=test-slug').expect(200)
  })

  test('after hook method should be executed after validation', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)
    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string({
              trim: true,
            }),
            slug: schema.string(),
          }),
        }
      }

      protected async after() {
        this.validated().title = 'New title'
      }
    }

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, request: PostRequest) {
        expect(request.validated()).toStrictEqual({
          title: 'New title',
          slug: 'test-slug',
        })
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test&slug=test-slug').expect(200)
  })

  test('safe method should return an instance of ValidatedInput', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)
    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string({
              trim: true,
            }),
            slug: schema.string(),
          }),
        }
      }
    }

    let safe: any = null

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, request: PostRequest) {
        safe = request.safe()
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test    &slug=test-slug').expect(200)

    expect(safe).toBeInstanceOf(ValidatedInput)
  })

  test('safe.all method should return all validated data', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)
    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string({
              trim: true,
            }),
            slug: schema.string(),
          }),
        }
      }
    }

    let safeAll: any = null

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, request: PostRequest) {
        safeAll = request.safe().all()
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test    &slug=test-slug').expect(200)

    expect(safeAll).toStrictEqual({
      title: 'Test',
      slug: 'test-slug',
    })
  })

  test('safe.only method should return only specified data', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)
    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string({
              trim: true,
            }),
            slug: schema.string(),
          }),
        }
      }
    }

    let safeOnly: any = null

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, request: PostRequest) {
        safeOnly = request.safe().only(['slug'])
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test    &slug=test-slug').expect(200)

    expect(safeOnly).not.toHaveProperty('title')
  })

  test('safe.except method should not return specified data', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)
    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string({
              trim: true,
            }),
            slug: schema.string(),
          }),
        }
      }
    }

    let safeExcept: any = null

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, request: PostRequest) {
        safeExcept = request.safe().except(['slug'])
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test    &slug=test-slug').expect(200)

    expect(safeExcept).not.toHaveProperty('slug')
  })

  test('safe.merge method should return original and new data', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)
    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContextContract) {
        super(context)
      }

      public async authorize(): Promise<boolean> {
        return true
      }

      public rules() {
        return {
          schema: schema.create({
            title: schema.string({
              trim: true,
            }),
            slug: schema.string(),
          }),
        }
      }
    }

    let safeMerge: any = null

    class PostsController {
      @formRequest()
      public async update(_: HttpContextContract, request: PostRequest) {
        safeMerge = request.safe().merge({ foo: 'bar' })
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test    &slug=test-slug').expect(200)

    expect(safeMerge).toHaveProperty('foo')
  })
})

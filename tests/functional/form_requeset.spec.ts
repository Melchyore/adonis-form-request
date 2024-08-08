import 'reflect-metadata'
import { createServer } from 'node:http'
import supertest from 'supertest'
import { test } from '@japa/runner'
import { IgnitorFactory } from '@adonisjs/core/factories'
import { ServerFactory } from '@adonisjs/http-server/factories'
import vine from '@vinejs/vine'
import { NextFn } from '@adonisjs/core/types/http'

import { FormRequestBase } from '../../src/form_request.js'
import ValidatedInput from '../../src/validated_input.js'
import { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { FormRequestMiddleware } from '../../src/form_request_middleware.js'
import { Constructor } from '../../src/types.js'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    foo: string
  }
}

const BASE_URL = new URL('./tmp/', import.meta.url)
const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, BASE_URL).href)
  }
  return import(filePath)
}

test.group('Form request', () => {
  test('return 403 error when authorize method returns false', async ({ expect }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('@adonisjs/core/providers/vinejs_provider'),
            () => import('../../providers/form_request_provider.js'),
          ],
        },
        config: {
          bodyparser: {
            allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
            form: {
              encoding: 'utf-8',
              limit: '1mb',
              queryString: {},
              types: ['application/x-www-form-urlencoded'],
              convertEmptyStringsToNull: true,
            },
            json: {
              encoding: 'utf-8',
              limit: '1mb',
              strict: true,
              types: [
                'application/json',
                'application/json-patch+json',
                'application/vnd.api+json',
                'application/csp-report',
              ],
              convertEmptyStringsToNull: true,
            },
            multipart: {
              autoProcess: true,
              processManually: [],
              encoding: 'utf-8',
              fieldsLimit: '2mb',
              limit: '20mb',
              types: ['multipart/form-data'],
              convertEmptyStringsToNull: true,
            },
          },
        },
      })
      .withCoreConfig()
      .withCoreProviders()
      .create(BASE_URL, {
        importer: IMPORTER,
      })

    const app = ignitor.createApp('web')
    const server = new ServerFactory().merge({ app }).create()
    const httpServer = createServer(server.handle.bind(server))
    await app.init()
    await app.boot()

    const stack: Array<string> = []

    class PostRequest extends FormRequestBase {
      static schema = vine.compile(
        vine.object({
          params: vine.object({
            id: vine.number(),
          }),
        })
      )

      constructor(protected context: HttpContext) {
        super(context)
      }

      async authorize() {
        return false
      }

      rules() {
        return PostRequest.schema
      }
    }

    const PostRequestClass = PostRequest as unknown as Omit<
      PostRequest,
      'validated' | 'authorize' | 'safe' | 'rules' | 'validatePayload'
    >

    class PostsController {
      @inject()
      async show(_: PostRequest) {
        const payload = _.request.validated()
        //    ^?

        console.log(payload)
        stack.push('foo')
      }
    }

    server.use([])
    server.getRouter().use([
      () => import('@adonisjs/core/bodyparser_middleware'),
      async () => ({
        default: FormRequestMiddleware,
      }),
      // async () => {
      //   return {
      //     default: class ContainerBindingsMiddleware {
      //       handle(ctx: HttpContext, next: NextFn) {
      //         ctx.containerResolver.bindValue(HttpContext, ctx)
      //         ctx.containerResolver.bindValue(Logger, ctx.logger)

      //         return next()
      //       }
      //     },
      //   }
      // },
      /*async () => {
        return {
          default: class FormRequestMiddleware {
            async handle(ctx: HttpContext, next: NextFn) {
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

              // ctx.validated = formRequest.validated.bind(formRequest)
              // ctx.safe = formRequest.safe.bind(formRequest)

              return next()
            }
          },
        }
      },*/
    ])
    server.getRouter().get('posts/:id', [PostsController, 'show'])
    await server.boot()

    await supertest(httpServer).get('/posts/1').expect(403)
    expect(stack).toHaveLength(0)
  }).pin()

  test('return 422 error when validation fails', async ({ expect }) => {
    const ignitor = new IgnitorFactory()
      .merge({
        rcFileContents: {
          providers: [
            () => import('@adonisjs/core/providers/vinejs_provider'),
            () => import('../../providers/form_request_provider.js'),
          ],
        },
        config: {
          bodyparser: {
            allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
            form: {
              encoding: 'utf-8',
              limit: '1mb',
              queryString: {},
              types: ['application/x-www-form-urlencoded'],
              convertEmptyStringsToNull: true,
            },
            json: {
              encoding: 'utf-8',
              limit: '1mb',
              strict: true,
              types: [
                'application/json',
                'application/json-patch+json',
                'application/vnd.api+json',
                'application/csp-report',
              ],
              convertEmptyStringsToNull: true,
            },
            multipart: {
              autoProcess: true,
              processManually: [],
              encoding: 'utf-8',
              fieldsLimit: '2mb',
              limit: '20mb',
              types: ['multipart/form-data'],
              convertEmptyStringsToNull: true,
            },
          },
        },
      })
      .withCoreConfig()
      .withCoreProviders()
      .create(BASE_URL, {
        importer: IMPORTER,
      })

    const app = ignitor.createApp('web')
    const server = new ServerFactory().merge({ app }).create()
    const httpServer = createServer(server.handle.bind(server))

    const stack: Array<string> = []

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContext) {
        super(context)
      }

      async authorize() {
        return true
      }

      rules() {
        return vine.compile(
          vine.object({
            params: vine.object({
              id: vine.number(),
            }),
          })
        )
      }
    }

    class PostsController {
      @formRequest()
      async show(_: HttpContext, __: PostRequest) {
        stack.push('foo')
      }
    }

    server.use([])
    server.getRouter().use([() => import('@adonisjs/core/bodyparser_middleware')])
    server.getRouter().get('posts/:id', [PostsController, 'show'])

    await app.init()
    await app.boot()
    await server.boot()

    await supertest(httpServer).get('/posts/foo').expect(422)
    expect(stack).toHaveLength(0)
  })

  /*
  test('type-hint request parameter should create a form request instance', async ({ expect }) => {
    const server = new Server(app, encryption, serverConfig)

    const { FormRequest } = app.container.resolveBinding('Adonis/Addons/FormRequest')
    const stack: Array<string> = []

    class PostRequest extends FormRequest {
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, request: PostRequest) {
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
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, request: PostRequest) {
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
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, request: PostRequest) {
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
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, __: PostRequest) {}
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
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, request: PostRequest) {
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
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, request: PostRequest) {
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
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, request: PostRequest) {
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
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, request: PostRequest) {
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
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, request: PostRequest) {
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
      constructor(protected context: HttpContext) {
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
      public async update(_: HttpContext, request: PostRequest) {
        safeMerge = request.safe().merge({ foo: 'bar' })
      }
    }

    const httpServer = createServer(server.handle.bind(server))
    app.container.bind('App/Controllers/Http/PostsController', () => new PostsController())
    server.router.post('/posts/:post', 'PostsController.update')
    server.optimize()

    await supertest(httpServer).post('/posts/1?title=Test    &slug=test-slug').expect(200)

    expect(safeMerge).toHaveProperty('foo')
  })*/
})

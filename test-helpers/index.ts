import type { ServerConfig } from '@ioc:Adonis/Core/Server'
import type { RequestConfig } from '@ioc:Adonis/Core/Request'
import type { ResponseConfig } from '@ioc:Adonis/Core/Response'

import proxyaddr from 'proxy-addr'
import { join } from 'node:path'
import { Filesystem } from '@poppinss/dev-utils'
import { Application } from '@adonisjs/core/build/standalone'
import { Encryption } from '@adonisjs/encryption/build/standalone'

const appSecret = 'averylongrandom32charslongsecret'
export const fs = new Filesystem(join(__dirname, '__app'))

export const requestConfig: RequestConfig = {
  allowMethodSpoofing: false,
  trustProxy: proxyaddr.compile('loopback'),
  subdomainOffset: 2,
  generateRequestId: true,
  useAsyncLocalStorage: false,
}

export const responseConfig: ResponseConfig = {
  etag: false,
  jsonpCallbackName: 'callback',
  cookie: {
    maxAge: 90,
    path: '/',
    httpOnly: true,
    sameSite: false,
    secure: false,
  },
}

export const serverConfig: ServerConfig = Object.assign({}, requestConfig, responseConfig)
export const encryption = new Encryption({ secret: appSecret })

/**
 * Setup AdonisJS application
 */
export async function setup() {
  const application = new Application(fs.basePath, 'web', {
    providers: ['@adonisjs/core', '../../providers/FormRequestProvider'],
  })

  await fs.add(
    'config/app.ts',
    `
    import proxyAddr from 'proxy-addr'

    export const profiler = { enabled: true }
    export const appKey = '${appSecret}'
    export const http = {
      trustProxy: proxyAddr.compile('loopback'),
      cookie: {
        domain: '',
        path: '/',
        maxAge: '2h',
        httpOnly: true,
        secure: false,
        sameSite: false,
      }
    }
  `
  )

  await application.setup()
  await application.registerProviders()
  await application.bootProviders()

  return application
}

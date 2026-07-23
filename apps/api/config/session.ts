import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, stores } from '@adonisjs/session'

const sessionConfig = defineConfig({
  enabled: true,
  cookieName: env.get('SESSION_COOKIE_NAME'),
  clearWithBrowser: false,
  age: env.get('SESSION_AGE'),
  cookie: {
    path: '/',
    httpOnly: true,
    secure: app.inProduction,
    sameSite: 'lax',
    domain: env.get('SESSION_COOKIE_DOMAIN') || undefined,
  },
  store: env.get('SESSION_DRIVER'),
  stores: {
    redis: stores.redis({ connection: 'session' }),
  },
})

export default sessionConfig

import limiter from '@adonisjs/limiter/services/main'
import env from '#start/env'

export const loginThrottle = limiter.define('auth-login', (ctx) => {
  return limiter
    .allowRequests(env.get('AUTH_LOGIN_RATE_LIMIT') ?? 10)
    .every('1 minute')
    .blockFor('15 minutes')
    .usingKey(ctx.request.ip())
})

export const registerThrottle = limiter.define('auth-register', (ctx) => {
  return limiter.allowRequests(5).every('1 hour').blockFor('1 hour').usingKey(ctx.request.ip())
})

export const collaborationThrottle = limiter.define('collaboration-write', (ctx) => {
  return limiter
    .allowRequests(30)
    .every('1 minute')
    .blockFor('5 minutes')
    .usingKey(ctx.auth.user?.id ?? ctx.request.ip())
})

export const adminActionThrottle = limiter.define('admin-action', (ctx) => {
  return limiter
    .allowRequests(20)
    .every('1 minute')
    .blockFor('10 minutes')
    .usingKey(ctx.auth.user?.id ?? ctx.request.ip())
})

export const aiGenerationThrottle = limiter.define('ai-generation', (ctx) => {
  return limiter
    .allowRequests(10)
    .every('1 hour')
    .blockFor('1 hour')
    .usingKey(ctx.auth.user?.id ?? ctx.request.ip())
})

export const calendarFeedThrottle = limiter.define('calendar-feed', (ctx) => {
  return limiter
    .allowRequests(60)
    .every('1 minute')
    .blockFor('5 minutes')
    .usingKey(ctx.request.ip())
})

export const systemStatusThrottle = limiter.define('system-status', (ctx) => {
  return limiter
    .allowRequests(30)
    .every('1 minute')
    .blockFor('5 minutes')
    .usingKey(ctx.auth.user?.id ?? ctx.request.ip())
})

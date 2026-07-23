import env from '#start/env'
import { defineConfig, stores } from '@adonisjs/limiter'
import type { InferLimiters } from '@adonisjs/limiter/types'

const limiterConfig = defineConfig({
  default: env.get('LIMITER_STORE'),
  stores: {
    redis: stores.redis({ connectionName: 'limiter', keyPrefix: 'auth' }),
    memory: stores.memory({ keyPrefix: 'auth-test' }),
  },
})

export default limiterConfig

declare module '@adonisjs/limiter/types' {
  export interface LimitersList extends InferLimiters<typeof limiterConfig> {}
}

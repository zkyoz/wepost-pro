import env from '#start/env'
import { defineConfig } from '@adonisjs/redis'
import type { InferConnections } from '@adonisjs/redis/types'

const common = {
  host: env.get('REDIS_HOST'),
  port: env.get('REDIS_PORT'),
  password: env.get('REDIS_PASSWORD') || undefined,
  retryStrategy(times: number) {
    return times > 10 ? null : times * 50
  },
}

const redisConfig = defineConfig({
  connection: 'session',
  connections: {
    session: {
      ...common,
      db: env.get('REDIS_SESSION_DB'),
      keyPrefix: `${env.get('REDIS_KEY_PREFIX')}:session:`,
    },
    limiter: {
      ...common,
      db: env.get('REDIS_LIMITER_DB'),
      keyPrefix: `${env.get('REDIS_KEY_PREFIX')}:limiter:`,
    },
  },
})

export default redisConfig

declare module '@adonisjs/redis/types' {
  export interface RedisConnections extends InferConnections<typeof redisConfig> {}
}

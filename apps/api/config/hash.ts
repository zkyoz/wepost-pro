import { defineConfig, drivers } from '@adonisjs/core/hash'
import type { InferHashers } from '@adonisjs/core/types'

/**
 * Hashing configuration.
 *
 * Argon2id is the password hashing algorithm required by the security baseline.
 */
const hashConfig = defineConfig({
  /**
   * Default hasher used by the application.
   */
  default: 'argon',

  list: {
    argon: drivers.argon2({
      variant: 'id',
      iterations: 3,
      memory: 65536,
      parallelism: 4,
      saltSize: 16,
    }),
  },
})

export default hashConfig

/**
 * Inferring types for the list of hashers you have configured
 * in your application.
 */
declare module '@adonisjs/core/types' {
  export interface HashersList extends InferHashers<typeof hashConfig> {}
}

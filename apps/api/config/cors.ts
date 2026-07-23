import env from '#start/env'
import { defineConfig } from '@adonisjs/cors'

const allowedOrigins = env
  .get('CORS_ORIGINS')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

/**
 * Configuration options to tweak the CORS policy. The following
 * options are documented on the official documentation website.
 *
 * https://docs.adonisjs.com/guides/security/cors
 */
const corsConfig = defineConfig({
  /**
   * Enable or disable CORS handling globally.
   */
  enabled: true,

  origin: allowedOrigins,

  /**
   * HTTP methods accepted for cross-origin requests.
   */
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],

  /**
   * Reflect request headers by default. Use a string array to restrict
   * allowed headers.
   */
  headers: ['Content-Type', 'Accept', 'X-XSRF-TOKEN', 'X-Requested-With'],

  /**
   * Response headers exposed to the browser.
   */
  exposeHeaders: ['ETag'],

  /**
   * Allow cookies/authorization headers on cross-origin requests.
   */
  credentials: true,

  /**
   * Cache CORS preflight response for N seconds.
   */
  maxAge: 90,
})

export default corsConfig

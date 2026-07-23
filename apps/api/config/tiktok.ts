import env from '#start/env'

const driver = env.get('TIKTOK_API_DRIVER') ?? 'mock'
const clientKey = env.get('TIKTOK_CLIENT_KEY') ?? ''
const clientSecret = env.get('TIKTOK_CLIENT_SECRET') ?? ''
const apiBaseUrl = env.get('TIKTOK_API_BASE_URL') ?? 'https://open.tiktokapis.com'
const redirectUri =
  env.get('TIKTOK_OAUTH_REDIRECT_URI') ??
  `${env.get('APP_URL')}/api/v1/social/tiktok/oauth/callback`
const successUrl = env.get('TIKTOK_OAUTH_SUCCESS_URL') ?? 'http://localhost:3000/settings/tiktok'

export const TIKTOK_SCOPES = ['user.info.basic', 'video.publish'] as const

export default {
  driver,
  clientKey,
  clientSecret,
  apiBaseUrl,
  redirectUri,
  successUrl,
  scopes: TIKTOK_SCOPES,
}

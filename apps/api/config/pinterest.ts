import env from '#start/env'

const driver = env.get('PINTEREST_API_DRIVER') ?? 'mock'
const appId = env.get('PINTEREST_APP_ID') ?? ''
const appSecret = env.get('PINTEREST_APP_SECRET') ?? ''
const apiBaseUrl = env.get('PINTEREST_API_BASE_URL') ?? 'https://api.pinterest.com/v5'
const redirectUri =
  env.get('PINTEREST_OAUTH_REDIRECT_URI') ??
  `${env.get('APP_URL')}/api/v1/social/pinterest/oauth/callback`
const successUrl =
  env.get('PINTEREST_OAUTH_SUCCESS_URL') ?? 'http://localhost:3000/settings/pinterest'

export const PINTEREST_SCOPES = [
  'user_accounts:read',
  'boards:read',
  'pins:read',
  'pins:write',
] as const

export default {
  driver,
  appId,
  appSecret,
  apiBaseUrl,
  redirectUri,
  successUrl,
  scopes: PINTEREST_SCOPES,
}

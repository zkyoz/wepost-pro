import env from '#start/env'

const driver = env.get('FACEBOOK_API_DRIVER') ?? 'mock'
const appId = env.get('FACEBOOK_APP_ID') ?? ''
const appSecret = env.get('FACEBOOK_APP_SECRET') ?? ''
const graphApiVersion = env.get('FACEBOOK_GRAPH_API_VERSION') ?? ''
const redirectUri =
  env.get('FACEBOOK_OAUTH_REDIRECT_URI') ??
  `${env.get('APP_URL')}/api/v1/social/facebook/oauth/callback`
const successUrl =
  env.get('FACEBOOK_OAUTH_SUCCESS_URL') ?? 'http://localhost:3000/settings/facebook'

export const FACEBOOK_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
] as const

export default {
  driver,
  appId,
  appSecret,
  graphApiVersion,
  redirectUri,
  successUrl,
  scopes: FACEBOOK_SCOPES,
}

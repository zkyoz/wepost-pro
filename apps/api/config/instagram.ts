import env from '#start/env'

const driver = env.get('INSTAGRAM_API_DRIVER') ?? 'mock'
const appId = env.get('INSTAGRAM_APP_ID') ?? ''
const appSecret = env.get('INSTAGRAM_APP_SECRET') ?? ''
const graphApiVersion = env.get('INSTAGRAM_GRAPH_API_VERSION') ?? ''
const redirectUri =
  env.get('INSTAGRAM_OAUTH_REDIRECT_URI') ??
  `${env.get('APP_URL')}/api/v1/social/instagram/oauth/callback`
const successUrl =
  env.get('INSTAGRAM_OAUTH_SUCCESS_URL') ?? 'http://localhost:3000/settings/instagram'

export const INSTAGRAM_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_content_publish',
] as const

export default {
  driver,
  appId,
  appSecret,
  graphApiVersion,
  redirectUri,
  successUrl,
  scopes: INSTAGRAM_SCOPES,
}

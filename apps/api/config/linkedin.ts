import env from '#start/env'

const driver = env.get('LINKEDIN_API_DRIVER') ?? 'mock'
const appId = env.get('LINKEDIN_APP_ID') ?? ''
const appSecret = env.get('LINKEDIN_APP_SECRET') ?? ''
const apiVersion = env.get('LINKEDIN_API_VERSION') ?? ''
const redirectUri =
  env.get('LINKEDIN_OAUTH_REDIRECT_URI') ??
  `${env.get('APP_URL')}/api/v1/social/linkedin/oauth/callback`
const successUrl =
  env.get('LINKEDIN_OAUTH_SUCCESS_URL') ?? 'http://localhost:3000/settings/linkedin'

export const LINKEDIN_SCOPES = ['r_organization_admin', 'w_organization_social'] as const

export default {
  driver,
  appId,
  appSecret,
  apiVersion,
  redirectUri,
  successUrl,
  scopes: LINKEDIN_SCOPES,
}

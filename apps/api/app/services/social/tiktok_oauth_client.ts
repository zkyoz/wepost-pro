import tiktokConfig from '#config/tiktok'
import type { TikTokCreatorInfo } from '#domain/social/tiktok'

export type TikTokToken = {
  accessToken: string
  expiresIn: number
  refreshToken: string
  refreshTokenExpiresIn: number
  scopes: string[]
  openId: string
}
export type TikTokProfile = { openId: string; displayName: string }

export interface TikTokOAuthClient {
  authorizationUrl(state: string): string
  exchangeCode(code: string): Promise<TikTokToken>
  refreshToken(refreshToken: string): Promise<TikTokToken>
  profile(token: string): Promise<TikTokProfile>
  creatorInfo(token: string): Promise<TikTokCreatorInfo>
  revoke(token: string): Promise<void>
}

type ErrorBody = {
  error?: string | { code?: string; message?: string }
  error_description?: string
}
class TikTokOAuthError extends Error {
  constructor(public readonly code: string) {
    super('La connexion TikTok a échoué.')
    this.name = 'TikTokOAuthError'
  }
}
async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & ErrorBody
  const nested = typeof body.error === 'object' ? body.error.code : body.error
  if (!response.ok || (nested && nested !== 'ok'))
    throw new TikTokOAuthError(String(nested ?? response.status))
  return body
}

class OfficialTikTokOAuthClient implements TikTokOAuthClient {
  private assertConfig() {
    if (!tiktokConfig.clientKey || !tiktokConfig.clientSecret)
      throw new Error('Configuration TikTok réelle incomplète.')
  }
  private async token(body: URLSearchParams) {
    this.assertConfig()
    body.set('client_key', tiktokConfig.clientKey)
    body.set('client_secret', tiktokConfig.clientSecret)
    const result = await readJson<{
      access_token: string
      expires_in: number
      refresh_token: string
      refresh_expires_in: number
      scope: string
      open_id: string
    }>(
      await fetch(`${tiktokConfig.apiBaseUrl}/v2/oauth/token/`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20_000),
      })
    )
    return {
      accessToken: result.access_token,
      expiresIn: result.expires_in,
      refreshToken: result.refresh_token,
      refreshTokenExpiresIn: result.refresh_expires_in,
      scopes: result.scope.split(',').filter(Boolean),
      openId: result.open_id,
    }
  }
  authorizationUrl(state: string) {
    this.assertConfig()
    const query = new URLSearchParams({
      client_key: tiktokConfig.clientKey,
      response_type: 'code',
      scope: tiktokConfig.scopes.join(','),
      redirect_uri: tiktokConfig.redirectUri,
      state,
    })
    return `https://www.tiktok.com/v2/auth/authorize/?${query}`
  }
  exchangeCode(code: string) {
    return this.token(
      new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: tiktokConfig.redirectUri,
      })
    )
  }
  refreshToken(refreshToken: string) {
    return this.token(
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
    )
  }
  async profile(token: string) {
    const result = await readJson<{
      data: { user: { open_id: string; display_name: string } }
    }>(
      await fetch(`${tiktokConfig.apiBaseUrl}/v2/user/info/?fields=open_id,display_name`, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(20_000),
      })
    )
    return { openId: result.data.user.open_id, displayName: result.data.user.display_name }
  }
  async creatorInfo(token: string) {
    const result = await readJson<{
      data: {
        privacy_level_options: string[]
        comment_disabled: boolean
        duet_disabled: boolean
        stitch_disabled: boolean
        max_video_post_duration_sec: number
      }
    }>(
      await fetch(`${tiktokConfig.apiBaseUrl}/v2/post/publish/creator_info/query/`, {
        method: 'POST',
        headers: {
          'authorization': `Bearer ${token}`,
          'content-type': 'application/json; charset=UTF-8',
        },
        signal: AbortSignal.timeout(20_000),
      })
    )
    return {
      privacyLevelOptions: result.data.privacy_level_options,
      commentDisabled: result.data.comment_disabled,
      duetDisabled: result.data.duet_disabled,
      stitchDisabled: result.data.stitch_disabled,
      maxVideoPostDurationSec: result.data.max_video_post_duration_sec,
    }
  }
  async revoke(token: string) {
    this.assertConfig()
    const response = await fetch(`${tiktokConfig.apiBaseUrl}/v2/oauth/revoke/`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: tiktokConfig.clientKey,
        client_secret: tiktokConfig.clientSecret,
        token,
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) throw new TikTokOAuthError(String(response.status))
  }
}

class MockTikTokOAuthClient implements TikTokOAuthClient {
  authorizationUrl(state: string) {
    return `${tiktokConfig.redirectUri}?${new URLSearchParams({ code: 'mock-tiktok-code', state })}`
  }
  async exchangeCode() {
    return {
      accessToken: 'mock-tiktok-access-token',
      expiresIn: 86_400,
      refreshToken: 'mock-tiktok-refresh-token',
      refreshTokenExpiresIn: 31_536_000,
      scopes: [...tiktokConfig.scopes],
      openId: 'tiktok-open-id',
    }
  }
  async refreshToken() {
    return {
      accessToken: 'mock-tiktok-refreshed-access-token',
      expiresIn: 86_400,
      refreshToken: 'mock-tiktok-refreshed-refresh-token',
      refreshTokenExpiresIn: 31_536_000,
      scopes: [...tiktokConfig.scopes],
      openId: 'tiktok-open-id',
    }
  }
  async profile() {
    return { openId: 'tiktok-open-id', displayName: 'Wepost TikTok' }
  }
  async creatorInfo() {
    return {
      privacyLevelOptions: ['PUBLIC_TO_EVERYONE', 'MUTUAL_FOLLOW_FRIENDS', 'SELF_ONLY'],
      commentDisabled: false,
      duetDisabled: false,
      stitchDisabled: false,
      maxVideoPostDurationSec: 180,
    }
  }
  async revoke() {}
}

let client: TikTokOAuthClient | undefined
export function getTikTokOAuthClient() {
  client ??=
    tiktokConfig.driver === 'tiktok' ? new OfficialTikTokOAuthClient() : new MockTikTokOAuthClient()
  return client
}
export function setTikTokOAuthClient(next?: TikTokOAuthClient) {
  client = next
}

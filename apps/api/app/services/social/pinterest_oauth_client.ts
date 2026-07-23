import pinterestConfig from '#config/pinterest'

export type PinterestToken = {
  accessToken: string
  expiresIn: number | null
  refreshToken: string | null
  refreshTokenExpiresIn: number | null
  scopes: string[]
}
export type PinterestProfile = { id: string; username: string }
export type PinterestBoard = { id: string; name: string; privacy: string }

export interface PinterestOAuthClient {
  authorizationUrl(state: string): string
  exchangeCode(code: string): Promise<PinterestToken>
  refreshToken(refreshToken: string): Promise<PinterestToken>
  currentUser(token: string): Promise<PinterestProfile>
  boards(token: string): Promise<PinterestBoard[]>
}

type ErrorBody = { error?: string; message?: string; code?: number }
class PinterestOAuthError extends Error {
  constructor(public readonly code: string) {
    super('La connexion Pinterest a échoué.')
    this.name = 'PinterestOAuthError'
  }
}
async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & ErrorBody
  if (!response.ok || body.error)
    throw new PinterestOAuthError(String(body.code ?? body.error ?? response.status))
  return body
}

class OfficialPinterestOAuthClient implements PinterestOAuthClient {
  private assertConfig() {
    if (!pinterestConfig.appId || !pinterestConfig.appSecret)
      throw new Error('Configuration Pinterest réelle incomplète.')
  }
  private authorization() {
    return `Basic ${Buffer.from(`${pinterestConfig.appId}:${pinterestConfig.appSecret}`).toString('base64')}`
  }
  private headers(token: string) {
    return { 'authorization': `Bearer ${token}`, 'content-type': 'application/json' }
  }
  authorizationUrl(state: string) {
    this.assertConfig()
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: pinterestConfig.appId,
      redirect_uri: pinterestConfig.redirectUri,
      state,
      scope: pinterestConfig.scopes.join(','),
    })
    return `https://www.pinterest.com/oauth/?${query}`
  }
  private async token(body: URLSearchParams) {
    this.assertConfig()
    const result = await readJson<{
      access_token: string
      expires_in?: number
      refresh_token?: string
      refresh_token_expires_in?: number
      scope?: string
    }>(
      await fetch(`${pinterestConfig.apiBaseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'authorization': this.authorization(),
          'content-type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: AbortSignal.timeout(20_000),
      })
    )
    return {
      accessToken: result.access_token,
      expiresIn: result.expires_in ?? null,
      refreshToken: result.refresh_token ?? null,
      refreshTokenExpiresIn: result.refresh_token_expires_in ?? null,
      scopes: result.scope?.split(/[ ,]+/).filter(Boolean) ?? [],
    }
  }
  exchangeCode(code: string) {
    return this.token(
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: pinterestConfig.redirectUri,
      })
    )
  }
  refreshToken(refreshToken: string) {
    return this.token(
      new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken })
    )
  }
  async currentUser(token: string) {
    return readJson<PinterestProfile>(
      await fetch(`${pinterestConfig.apiBaseUrl}/user_account`, {
        headers: this.headers(token),
        signal: AbortSignal.timeout(20_000),
      })
    )
  }
  async boards(token: string) {
    const boards: PinterestBoard[] = []
    let bookmark: string | null = null
    do {
      const url = new URL(`${pinterestConfig.apiBaseUrl}/boards`)
      url.searchParams.set('page_size', '100')
      if (bookmark) url.searchParams.set('bookmark', bookmark)
      const page = await readJson<{ items: PinterestBoard[]; bookmark?: string | null }>(
        await fetch(url, { headers: this.headers(token), signal: AbortSignal.timeout(20_000) })
      )
      boards.push(...page.items)
      bookmark = page.bookmark ?? null
    } while (bookmark && boards.length < 2000)
    return boards
  }
}

class MockPinterestOAuthClient implements PinterestOAuthClient {
  authorizationUrl(state: string) {
    return `${pinterestConfig.redirectUri}?${new URLSearchParams({ code: 'mock-pinterest-code', state })}`
  }
  async exchangeCode() {
    return {
      accessToken: 'mock-pinterest-access-token',
      expiresIn: 2_592_000,
      refreshToken: 'mock-pinterest-refresh-token',
      refreshTokenExpiresIn: 5_184_000,
      scopes: [...pinterestConfig.scopes],
    }
  }
  async refreshToken() {
    return {
      accessToken: 'mock-pinterest-refreshed-access-token',
      expiresIn: 2_592_000,
      refreshToken: 'mock-pinterest-refreshed-refresh-token',
      refreshTokenExpiresIn: 5_184_000,
      scopes: [...pinterestConfig.scopes],
    }
  }
  async currentUser() {
    return { id: '987654321', username: 'wepost_test' }
  }
  async boards() {
    return [{ id: '123456789', name: 'Campagnes', privacy: 'PUBLIC' }]
  }
}

let client: PinterestOAuthClient | undefined
export function getPinterestOAuthClient() {
  client ??=
    pinterestConfig.driver === 'pinterest'
      ? new OfficialPinterestOAuthClient()
      : new MockPinterestOAuthClient()
  return client
}
export function setPinterestOAuthClient(next?: PinterestOAuthClient) {
  client = next
}

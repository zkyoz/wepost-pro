import facebookConfig from '#config/facebook'

export type ManagedFacebookPage = {
  id: string
  name: string
  accessToken: string
  tasks: string[]
}

export interface FacebookOAuthClient {
  authorizationUrl(state: string): string
  exchangeCode(code: string): Promise<{ accessToken: string; expiresIn: number | null }>
  exchangeLongLivedToken(token: string): Promise<{ accessToken: string; expiresIn: number | null }>
  grantedScopes(token: string): Promise<string[]>
  managedPages(token: string): Promise<ManagedFacebookPage[]>
}

type GraphErrorBody = { error?: { message?: string; type?: string; code?: number } }

class FacebookOAuthError extends Error {
  constructor(public readonly code: string) {
    super('La connexion Facebook a échoué.')
    this.name = 'FacebookOAuthError'
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & GraphErrorBody
  if (!response.ok || body.error) {
    throw new FacebookOAuthError(String(body.error?.code ?? response.status))
  }
  return body
}

class OfficialFacebookOAuthClient implements FacebookOAuthClient {
  private graph(path: string) {
    if (
      !facebookConfig.appId ||
      !facebookConfig.appSecret ||
      !facebookConfig.graphApiVersion ||
      facebookConfig.graphApiVersion.startsWith('TODO_')
    ) {
      throw new Error('Configuration Facebook réelle incomplète.')
    }
    return `https://graph.facebook.com/${facebookConfig.graphApiVersion}/${path}`
  }

  authorizationUrl(state: string) {
    const query = new URLSearchParams({
      client_id: facebookConfig.appId,
      redirect_uri: facebookConfig.redirectUri,
      state,
      response_type: 'code',
      scope: facebookConfig.scopes.join(','),
    })
    return `https://www.facebook.com/${facebookConfig.graphApiVersion}/dialog/oauth?${query}`
  }

  async exchangeCode(code: string) {
    const body = new URLSearchParams({
      client_id: facebookConfig.appId,
      client_secret: facebookConfig.appSecret,
      redirect_uri: facebookConfig.redirectUri,
      code,
    })
    return readJson<{ access_token: string; expires_in?: number }>(
      await fetch(this.graph('oauth/access_token'), {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20_000),
      })
    ).then((result) => ({
      accessToken: result.access_token,
      expiresIn: result.expires_in ?? null,
    }))
  }

  async exchangeLongLivedToken(token: string) {
    const body = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: facebookConfig.appId,
      client_secret: facebookConfig.appSecret,
      fb_exchange_token: token,
    })
    return readJson<{ access_token: string; expires_in?: number }>(
      await fetch(this.graph('oauth/access_token'), {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20_000),
      })
    ).then((result) => ({
      accessToken: result.access_token,
      expiresIn: result.expires_in ?? null,
    }))
  }

  async grantedScopes(token: string) {
    const result = await readJson<{
      data: Array<{ permission: string; status: string }>
    }>(
      await fetch(this.graph('me/permissions'), {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(20_000),
      })
    )
    return result.data.filter((item) => item.status === 'granted').map((item) => item.permission)
  }

  async managedPages(token: string) {
    const result = await readJson<{
      data: Array<{ id: string; name: string; access_token: string; tasks?: string[] }>
    }>(
      await fetch(this.graph('me/accounts?fields=id,name,access_token,tasks'), {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(20_000),
      })
    )
    return result.data.map((page) => ({
      id: page.id,
      name: page.name,
      accessToken: page.access_token,
      tasks: page.tasks ?? [],
    }))
  }
}

class MockFacebookOAuthClient implements FacebookOAuthClient {
  authorizationUrl(state: string) {
    const query = new URLSearchParams({ code: 'mock-facebook-code', state })
    return `${facebookConfig.redirectUri}?${query}`
  }
  async exchangeCode() {
    return { accessToken: 'mock-short-user-token', expiresIn: 3600 }
  }
  async exchangeLongLivedToken() {
    return { accessToken: 'mock-long-user-token', expiresIn: 5_184_000 }
  }
  async grantedScopes() {
    return [...facebookConfig.scopes]
  }
  async managedPages() {
    return [
      {
        id: '1234567890',
        name: 'Page Facebook de test',
        accessToken: 'mock-page-access-token',
        tasks: ['CREATE_CONTENT', 'MODERATE', 'MESSAGING'],
      },
    ]
  }
}

let client: FacebookOAuthClient | undefined

export function getFacebookOAuthClient() {
  client ??=
    facebookConfig.driver === 'facebook'
      ? new OfficialFacebookOAuthClient()
      : new MockFacebookOAuthClient()
  return client
}

export function setFacebookOAuthClient(next?: FacebookOAuthClient) {
  client = next
}

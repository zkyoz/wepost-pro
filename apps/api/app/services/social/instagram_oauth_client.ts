import instagramConfig from '#config/instagram'

export type ManagedInstagramPage = {
  id: string
  name: string
  accessToken: string
  tasks: string[]
  facebookPageId: string
}

export interface InstagramOAuthClient {
  authorizationUrl(state: string): string
  exchangeCode(code: string): Promise<{ accessToken: string; expiresIn: number | null }>
  exchangeLongLivedToken(token: string): Promise<{ accessToken: string; expiresIn: number | null }>
  grantedScopes(token: string): Promise<string[]>
  managedPages(token: string): Promise<ManagedInstagramPage[]>
}

type GraphErrorBody = { error?: { message?: string; type?: string; code?: number } }

class InstagramOAuthError extends Error {
  constructor(public readonly code: string) {
    super('La connexion Instagram a échoué.')
    this.name = 'InstagramOAuthError'
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & GraphErrorBody
  if (!response.ok || body.error) {
    throw new InstagramOAuthError(String(body.error?.code ?? response.status))
  }
  return body
}

class OfficialInstagramOAuthClient implements InstagramOAuthClient {
  private graph(path: string) {
    if (
      !instagramConfig.appId ||
      !instagramConfig.appSecret ||
      !instagramConfig.graphApiVersion ||
      instagramConfig.graphApiVersion.startsWith('TODO_')
    ) {
      throw new Error('Configuration Instagram réelle incomplète.')
    }
    return `https://graph.facebook.com/${instagramConfig.graphApiVersion}/${path}`
  }

  authorizationUrl(state: string) {
    const query = new URLSearchParams({
      client_id: instagramConfig.appId,
      redirect_uri: instagramConfig.redirectUri,
      state,
      response_type: 'code',
      scope: instagramConfig.scopes.join(','),
    })
    return `https://www.facebook.com/${instagramConfig.graphApiVersion}/dialog/oauth?${query}`
  }

  async exchangeCode(code: string) {
    const body = new URLSearchParams({
      client_id: instagramConfig.appId,
      client_secret: instagramConfig.appSecret,
      redirect_uri: instagramConfig.redirectUri,
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
      client_id: instagramConfig.appId,
      client_secret: instagramConfig.appSecret,
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
      data: Array<{
        id: string
        access_token: string
        tasks?: string[]
        instagram_business_account?: { id: string; username?: string }
      }>
    }>(
      await fetch(
        this.graph(
          'me/accounts?fields=id,access_token,tasks,instagram_business_account{id,username}'
        ),
        {
          headers: { authorization: `Bearer ${token}` },
          signal: AbortSignal.timeout(20_000),
        }
      )
    )
    return result.data.flatMap((page) =>
      page.instagram_business_account
        ? [
            {
              id: page.instagram_business_account.id,
              name: `@${page.instagram_business_account.username ?? page.instagram_business_account.id}`,
              accessToken: page.access_token,
              tasks: page.tasks ?? [],
              facebookPageId: page.id,
            },
          ]
        : []
    )
  }
}

class MockInstagramOAuthClient implements InstagramOAuthClient {
  authorizationUrl(state: string) {
    const query = new URLSearchParams({ code: 'mock-instagram-code', state })
    return `${instagramConfig.redirectUri}?${query}`
  }
  async exchangeCode() {
    return { accessToken: 'mock-short-user-token', expiresIn: 3600 }
  }
  async exchangeLongLivedToken() {
    return { accessToken: 'mock-long-user-token', expiresIn: 5_184_000 }
  }
  async grantedScopes() {
    return [...instagramConfig.scopes]
  }
  async managedPages() {
    return [
      {
        id: '17841400000000000',
        name: '@wepost_test',
        accessToken: 'mock-instagram-access-token',
        tasks: ['CREATE_CONTENT'],
        facebookPageId: '1234567890',
      },
    ]
  }
}

let client: InstagramOAuthClient | undefined

export function getInstagramOAuthClient() {
  client ??=
    instagramConfig.driver === 'instagram'
      ? new OfficialInstagramOAuthClient()
      : new MockInstagramOAuthClient()
  return client
}

export function setInstagramOAuthClient(next?: InstagramOAuthClient) {
  client = next
}

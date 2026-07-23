import linkedinConfig from '#config/linkedin'

export type ManagedLinkedInOrganization = {
  id: string
  name: string
  role: string
}

export type LinkedInToken = {
  accessToken: string
  expiresIn: number | null
  refreshToken: string | null
  refreshTokenExpiresIn: number | null
  scopes: string[]
}

export interface LinkedInOAuthClient {
  authorizationUrl(state: string): string
  exchangeCode(code: string): Promise<LinkedInToken>
  refreshToken(refreshToken: string): Promise<LinkedInToken>
  managedOrganizations(token: string): Promise<ManagedLinkedInOrganization[]>
}

type LinkedInErrorBody = {
  error?: string
  error_description?: string
  message?: string
  status?: number
  serviceErrorCode?: number
}

class LinkedInOAuthError extends Error {
  constructor(public readonly code: string) {
    super('La connexion LinkedIn a échoué.')
    this.name = 'LinkedInOAuthError'
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & LinkedInErrorBody
  if (!response.ok || body.error) {
    throw new LinkedInOAuthError(
      String(body.serviceErrorCode ?? body.status ?? body.error ?? response.status)
    )
  }
  return body
}

class OfficialLinkedInOAuthClient implements LinkedInOAuthClient {
  private assertConfig() {
    if (
      !linkedinConfig.appId ||
      !linkedinConfig.appSecret ||
      !linkedinConfig.apiVersion ||
      linkedinConfig.apiVersion.startsWith('TODO_')
    ) {
      throw new Error('Configuration LinkedIn réelle incomplète.')
    }
  }

  private headers(token: string) {
    this.assertConfig()
    return {
      'authorization': `Bearer ${token}`,
      'content-type': 'application/json',
      'linkedin-version': linkedinConfig.apiVersion,
      'x-restli-protocol-version': '2.0.0',
    }
  }

  authorizationUrl(state: string) {
    this.assertConfig()
    const query = new URLSearchParams({
      response_type: 'code',
      client_id: linkedinConfig.appId,
      redirect_uri: linkedinConfig.redirectUri,
      state,
      scope: linkedinConfig.scopes.join(' '),
    })
    return `https://www.linkedin.com/oauth/v2/authorization?${query}`
  }

  async exchangeCode(code: string) {
    this.assertConfig()
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: linkedinConfig.appId,
      client_secret: linkedinConfig.appSecret,
      redirect_uri: linkedinConfig.redirectUri,
    })
    const result = await readJson<{
      access_token: string
      expires_in?: number
      refresh_token?: string
      refresh_token_expires_in?: number
      scope?: string
    }>(
      await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20_000),
      })
    )
    return {
      accessToken: result.access_token,
      expiresIn: result.expires_in ?? null,
      refreshToken: result.refresh_token ?? null,
      refreshTokenExpiresIn: result.refresh_token_expires_in ?? null,
      scopes: result.scope?.split(/\s+/).filter(Boolean) ?? [...linkedinConfig.scopes],
    }
  }

  async refreshToken(refreshToken: string) {
    this.assertConfig()
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: linkedinConfig.appId,
      client_secret: linkedinConfig.appSecret,
    })
    const result = await readJson<{
      access_token: string
      expires_in?: number
      refresh_token?: string
      refresh_token_expires_in?: number
      scope?: string
    }>(
      await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body,
        signal: AbortSignal.timeout(20_000),
      })
    )
    return {
      accessToken: result.access_token,
      expiresIn: result.expires_in ?? null,
      refreshToken: result.refresh_token ?? null,
      refreshTokenExpiresIn: result.refresh_token_expires_in ?? null,
      scopes: result.scope?.split(/\s+/).filter(Boolean) ?? [...linkedinConfig.scopes],
    }
  }

  async managedOrganizations(token: string) {
    const result = await readJson<{
      elements: Array<{ organization: string; role: string; state: string }>
    }>(
      await fetch('https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&state=APPROVED', {
        headers: this.headers(token),
        signal: AbortSignal.timeout(20_000),
      })
    )
    const allowedRoles = new Set([
      'ADMINISTRATOR',
      'CONTENT_ADMIN',
      'DIRECT_SPONSORED_CONTENT_POSTER',
    ])
    return result.elements
      .filter((item) => item.state === 'APPROVED' && allowedRoles.has(item.role))
      .map((item) => {
        const id = item.organization.split(':').at(-1) ?? ''
        return { id, name: `Organisation LinkedIn ${id}`, role: item.role }
      })
      .filter((item) => /^\d+$/.test(item.id))
  }
}

class MockLinkedInOAuthClient implements LinkedInOAuthClient {
  authorizationUrl(state: string) {
    const query = new URLSearchParams({ code: 'mock-linkedin-code', state })
    return `${linkedinConfig.redirectUri}?${query}`
  }
  async exchangeCode() {
    return {
      accessToken: 'mock-linkedin-access-token',
      expiresIn: 5_184_000,
      refreshToken: 'mock-linkedin-refresh-token',
      refreshTokenExpiresIn: 31_536_000,
      scopes: [...linkedinConfig.scopes],
    }
  }
  async refreshToken() {
    return {
      accessToken: 'mock-linkedin-refreshed-access-token',
      expiresIn: 5_184_000,
      refreshToken: 'mock-linkedin-refreshed-refresh-token',
      refreshTokenExpiresIn: 31_536_000,
      scopes: [...linkedinConfig.scopes],
    }
  }
  async managedOrganizations() {
    return [{ id: '123456789', name: 'Wepost Test', role: 'ADMINISTRATOR' }]
  }
}

let client: LinkedInOAuthClient | undefined

export function getLinkedInOAuthClient() {
  client ??=
    linkedinConfig.driver === 'linkedin'
      ? new OfficialLinkedInOAuthClient()
      : new MockLinkedInOAuthClient()
  return client
}

export function setLinkedInOAuthClient(next?: LinkedInOAuthClient) {
  client = next
}

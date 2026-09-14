import { linkedinScopes } from '#config/linkedin'
import { OfficialLinkedInOAuthClient } from '#services/social/linkedin_oauth_client'
import { test } from '@japa/runner'

test.group('LinkedIn personal OAuth contract', () => {
  test('requests member permissions without organization access', ({ assert }) => {
    const client = new OfficialLinkedInOAuthClient()
    const url = new URL(client.authorizationUrl('protected-state', 'member'))
    assert.equal(url.origin, 'https://www.linkedin.com')
    assert.equal(url.searchParams.get('state'), 'protected-state')
    assert.equal(url.searchParams.get('scope'), 'openid profile w_member_social')
    assert.notInclude(url.searchParams.get('scope')!, 'organization')
    assert.deepEqual(linkedinScopes(), ['r_organization_admin', 'w_organization_social'])
  })

  test('obtains the author only from authenticated userinfo', async ({ assert }) => {
    const original = globalThis.fetch
    try {
      globalThis.fetch = async (url, options) => {
        assert.equal(url, 'https://api.linkedin.com/v2/userinfo')
        assert.equal(new Headers(options?.headers).get('authorization'), 'Bearer member-token')
        return Response.json({ sub: 'abc_123-z', name: 'Profil de test' })
      }
      assert.deepEqual(await new OfficialLinkedInOAuthClient().memberProfile('member-token'), {
        id: 'urn:li:person:abc_123-z',
        name: 'Profil de test',
        role: 'MEMBER',
      })
    } finally {
      globalThis.fetch = original
    }
  })

  test('rejects malformed identities and provider errors without exposing the response', async ({
    assert,
  }) => {
    const original = globalThis.fetch
    try {
      globalThis.fetch = async () => Response.json({ sub: 'urn:li:organization:12345' })
      await assert.rejects(
        () => new OfficialLinkedInOAuthClient().memberProfile('token'),
        'La connexion LinkedIn a échoué.'
      )
      globalThis.fetch = async () =>
        Response.json(
          { error: 'denied', error_description: 'secret-provider-detail' },
          { status: 403 }
        )
      await assert.rejects(
        () => new OfficialLinkedInOAuthClient().memberProfile('token'),
        'La connexion LinkedIn a échoué.'
      )
    } finally {
      globalThis.fetch = original
    }
  })

  test('keeps member scopes when the token response omits the unchanged grant', async ({
    assert,
  }) => {
    const original = globalThis.fetch
    try {
      globalThis.fetch = async () =>
        Response.json({ access_token: 'member-token', expires_in: 3600 })
      const token = await new OfficialLinkedInOAuthClient().exchangeCode('code', 'member')
      assert.deepEqual(token.scopes, ['openid', 'profile', 'w_member_social'])
      assert.isNull(token.refreshToken)
      globalThis.fetch = async () =>
        Response.json({ access_token: 'member-token', scope: 'openid,profile,w_member_social' })
      const explicitScopes = await new OfficialLinkedInOAuthClient().exchangeCode('code', 'member')
      assert.deepEqual(explicitScopes.scopes, token.scopes)
    } finally {
      globalThis.fetch = original
    }
  })
})

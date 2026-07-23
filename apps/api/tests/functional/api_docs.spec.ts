import { test } from '@japa/runner'

interface TestOpenApiOperation {
  'security'?: Array<Record<string, unknown[]>>
  'x-required-permission'?: string
}

interface TestOpenApiDocument {
  'openapi': string
  'info': { title: string }
  'paths': Record<string, Record<string, TestOpenApiOperation>>
  'x-route-count': number
}

test.group('API documentation', () => {
  test('serves an OpenAPI contract synchronized with the router', async ({ client, assert }) => {
    const response = await client.get('/api/openapi.json')

    response.assertStatus(200)
    assert.match(response.header('content-type') ?? '', /application\/json/)
    const specification = response.body() as unknown as TestOpenApiDocument
    assert.equal(specification.openapi, '3.1.0')
    assert.equal(specification.info.title, 'Wepost.pro REST API')
    const operationCount = Object.values(specification.paths).reduce(
      (total, path) => total + Object.keys(path).length,
      0
    )
    assert.equal(specification['x-route-count'], operationCount)
    assert.isAtLeast(operationCount, 146)
    assert.property(specification.paths, '/api/v1/auth/login')
    assert.property(specification.paths, '/api/v1/projects')
    assert.property(specification.paths, '/api/v1/social/facebook/publications/{id}/schedule')
    assert.equal(
      specification.paths['/api/v1/projects'].post['x-required-permission'],
      'projects.manage'
    )
    assert.deepEqual(specification.paths['/api/v1/auth/me'].get.security, [{ sessionCookie: [] }])

    const serialized = JSON.stringify(specification)
    assert.notInclude(serialized, 'encryptedAccessToken')
    assert.notInclude(serialized, 'encryptedRefreshToken')
    assert.notInclude(serialized, 'APP_KEY')
  })

  test('serves the accessible API catalog', async ({ client, assert }) => {
    const response = await client.get('/api/docs')

    response.assertStatus(200)
    assert.match(response.header('content-type') ?? '', /text\/html/)
    assert.include(response.text(), '<h1>Documentation API Wepost.pro</h1>')
    assert.include(response.text(), 'aria-live="polite"')
    assert.include(response.text(), 'href="/api/openapi.json"')
  })
})

import { test } from '@japa/runner'
import { R2MediaStorage } from '#services/media/media_storage'

const config = {
  accountId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bucket: 'wepost-demo-media',
  accessKeyId: 'test-only-id',
  secretAccessKey: 'test-only-secret',
  environmentPrefix: 'test',
}

test.group('R2 signed media requests', () => {
  test('signs a browser PUT without the checksum of an empty body', async ({ assert }) => {
    const request = await new R2MediaStorage(config).signUpload('test/image.jpg', 'image/jpeg')
    const url = new URL(request.url)
    assert.equal(request.method, 'PUT')
    assert.equal(request.headers['Content-Type'], 'image/jpeg')
    assert.equal(url.hostname, `wepost-demo-media.${config.accountId}.r2.cloudflarestorage.com`)
    assert.equal(url.pathname, '/test/image.jpg')
    assert.equal(url.searchParams.get('X-Amz-Expires'), '300')
    assert.isFalse(url.searchParams.has('x-amz-checksum-crc32'))
    assert.isTrue(url.searchParams.has('X-Amz-Signature'))
  })
  test('signs private reads without revealing the secret key', async ({ assert }) => {
    const request = await new R2MediaStorage(config).signRead('test/image.jpg')
    assert.equal(request.method, 'GET')
    assert.isFalse(request.url.includes(config.secretAccessKey))
    assert.equal(new URL(request.url).searchParams.get('X-Amz-Expires'), '300')
  })
  test('fails closed for incomplete storage configuration', ({ assert }) => {
    assert.throws(() => new R2MediaStorage({ ...config, secretAccessKey: '' }), /incomplète/)
  })
})

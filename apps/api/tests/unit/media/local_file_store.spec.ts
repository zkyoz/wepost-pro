import { LocalFileStore } from '#services/media/local_file_store'
import { test } from '@japa/runner'
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

test.group('Persistent local media', () => {
  test('survives a new store instance and supports deletion', ({ assert }) => {
    const directory = mkdtempSync(join(tmpdir(), 'wepost-media-test-'))
    try {
      const object = { bytes: Buffer.from('fixture'), contentType: 'image/png' }
      new LocalFileStore(directory).put('agency/media/opaque.png', object)
      const restarted = new LocalFileStore(directory)
      assert.deepEqual(restarted.get('agency/media/opaque.png'), object)
      restarted.delete('agency/media/opaque.png')
      assert.isUndefined(restarted.get('agency/media/opaque.png'))
      assert.doesNotThrow(() => restarted.delete('missing'))
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })

  test('hashes keys, uses private files and atomically replaces an object', ({ assert }) => {
    const directory = mkdtempSync(join(tmpdir(), 'wepost-media-test-'))
    try {
      const store = new LocalFileStore(directory)
      const key = '../../not-a-filesystem-path.png'
      store.put(key, { bytes: Buffer.from('first'), contentType: 'image/png' })
      store.put(key, { bytes: Buffer.from('second'), contentType: 'image/png' })
      const files = readdirSync(directory)
      assert.lengthOf(files, 1)
      assert.match(files[0], /^[a-f0-9]{64}\.json$/)
      assert.equal(statSync(join(directory, files[0])).mode & 0o777, 0o600)
      assert.equal(store.get(key)?.bytes.toString(), 'second')
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})

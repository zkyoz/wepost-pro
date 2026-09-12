import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

type LocalObject = { bytes: Buffer; contentType: string }

/** Small local-development store. R2 remains the production adapter. */
export class LocalFileStore {
  constructor(private directory: string) {}

  private filename(key: string) {
    return join(this.directory, `${createHash('sha256').update(key).digest('hex')}.json`)
  }

  put(key: string, object: LocalObject) {
    mkdirSync(this.directory, { recursive: true, mode: 0o700 })
    const destination = this.filename(key)
    const temporary = `${destination}.${randomUUID()}.tmp`
    try {
      writeFileSync(
        temporary,
        JSON.stringify({ contentType: object.contentType, data: object.bytes.toString('base64') }),
        { mode: 0o600, flag: 'wx' }
      )
      renameSync(temporary, destination)
    } catch (error) {
      try {
        unlinkSync(temporary)
      } catch (cleanupError) {
        if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw new AggregateError([error, cleanupError], 'Écriture du média local impossible')
        }
      }
      throw error
    }
  }

  get(key: string): LocalObject | undefined {
    try {
      const object = JSON.parse(readFileSync(this.filename(key), 'utf8')) as {
        contentType: string
        data: string
      }
      return { contentType: object.contentType, bytes: Buffer.from(object.data, 'base64') }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw error
    }
  }

  delete(key: string) {
    try {
      unlinkSync(this.filename(key))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }
}

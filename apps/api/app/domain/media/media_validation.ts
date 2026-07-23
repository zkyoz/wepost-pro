import { createHash, randomUUID } from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
}

export class InvalidMediaError extends Error {
  constructor(
    message: string,
    public code:
      | 'mime_not_allowed'
      | 'mime_mismatch'
      | 'size_mismatch'
      | 'size_exceeded'
      | 'checksum_mismatch'
      | 'alt_required'
  ) {
    super(message)
  }
}

export function createStorageKey(input: {
  environment: string
  agencyId: string
  mediaId: string
  mimeType: string
}) {
  const extension = extensions[input.mimeType]
  if (!extension) throw new InvalidMediaError('Type de fichier non autorisé.', 'mime_not_allowed')
  const prefix = input.environment.replaceAll(/[^a-zA-Z0-9_-]/g, '-')
  return `${prefix}/agencies/${input.agencyId}/media/${input.mediaId}/${randomUUID()}.${extension}`
}

export function validateAlternative(input: {
  mimeType: string
  altText?: string | null
  isDecorative: boolean
}) {
  if (input.mimeType.startsWith('image/') && !input.isDecorative && !input.altText?.trim()) {
    throw new InvalidMediaError(
      'Décrivez cette image ou marquez-la explicitement comme décorative.',
      'alt_required'
    )
  }
}

function readJpegSize(bytes: Buffer) {
  let offset = 2
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) break
    const marker = bytes[offset + 1]
    const length = bytes.readUInt16BE(offset + 2)
    if (marker && marker >= 0xc0 && marker <= 0xc3) {
      return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5) }
    }
    offset += 2 + length
  }
  return { width: null, height: null }
}

function readWebpSize(bytes: Buffer) {
  const kind = bytes.toString('ascii', 12, 16)
  if (kind === 'VP8X' && bytes.length >= 30) {
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    }
  }
  if (kind === 'VP8 ' && bytes.length >= 30) {
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff }
  }
  if (kind === 'VP8L' && bytes.length >= 25) {
    const bits = bytes.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  return { width: null, height: null }
}

function readMp4Metadata(bytes: Buffer) {
  let durationMs: number | null = null
  let width: number | null = null
  let height: number | null = null
  const mvhd = bytes.indexOf('mvhd', 0, 'ascii')
  if (mvhd >= 0 && mvhd + 32 < bytes.length) {
    const version = bytes[mvhd + 4]
    const scaleOffset = mvhd + (version === 1 ? 24 : 16)
    const durationOffset = mvhd + (version === 1 ? 28 : 20)
    const timescale = bytes.readUInt32BE(scaleOffset)
    const duration =
      version === 1
        ? Number(bytes.readBigUInt64BE(durationOffset))
        : bytes.readUInt32BE(durationOffset)
    if (timescale > 0) durationMs = Math.round((duration / timescale) * 1000)
  }
  const tkhd = bytes.indexOf('tkhd', 0, 'ascii')
  if (tkhd >= 0) {
    const version = bytes[tkhd + 4]
    const sizeOffset = tkhd + (version === 1 ? 92 : 80)
    if (sizeOffset + 8 <= bytes.length) {
      width = Math.round(bytes.readUInt32BE(sizeOffset) / 65_536)
      height = Math.round(bytes.readUInt32BE(sizeOffset + 4) / 65_536)
    }
  }
  return { width, height, durationMs }
}

export function readMediaMetadata(bytes: Buffer, mimeType: string) {
  if (mimeType === 'image/png' && bytes.length >= 24) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), durationMs: null }
  }
  if (mimeType === 'image/gif' && bytes.length >= 10) {
    return { width: bytes.readUInt16LE(6), height: bytes.readUInt16LE(8), durationMs: null }
  }
  if (mimeType === 'image/jpeg') return { ...readJpegSize(bytes), durationMs: null }
  if (mimeType === 'image/webp') return { ...readWebpSize(bytes), durationMs: null }
  if (mimeType === 'video/mp4') return readMp4Metadata(bytes)
  return { width: null, height: null, durationMs: null }
}

export async function validateMediaBuffer(input: {
  bytes: Buffer
  declaredMimeType: string
  expectedSize: number
  expectedChecksum: string
  allowedMimeTypes: readonly string[]
  maxBytes: number
}) {
  if (input.bytes.length > input.maxBytes) {
    throw new InvalidMediaError('Le fichier dépasse la taille autorisée.', 'size_exceeded')
  }
  if (input.bytes.length !== input.expectedSize) {
    throw new InvalidMediaError(
      'La taille reçue ne correspond pas à l’upload annoncé.',
      'size_mismatch'
    )
  }
  const detected = await fileTypeFromBuffer(input.bytes)
  if (!detected || !input.allowedMimeTypes.includes(detected.mime)) {
    throw new InvalidMediaError('Le type réel du fichier n’est pas autorisé.', 'mime_not_allowed')
  }
  if (detected.mime !== input.declaredMimeType) {
    throw new InvalidMediaError('Le type réel du fichier diffère du type annoncé.', 'mime_mismatch')
  }
  const checksum = createHash('sha256').update(input.bytes).digest('hex')
  if (checksum !== input.expectedChecksum.toLowerCase()) {
    throw new InvalidMediaError('Le checksum du fichier est invalide.', 'checksum_mismatch')
  }
  return { mimeType: detected.mime, checksum, ...readMediaMetadata(input.bytes, detected.mime) }
}

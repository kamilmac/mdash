import LZString from 'lz-string'
import { encryptContent } from './crypto.ts'

const URL_LIMIT = 32000

function encode(content: string): string {
  return LZString.compressToEncodedURIComponent(content)
}

function decode(encoded: string): string {
  return LZString.decompressFromEncodedURIComponent(encoded)
}

interface TruncationResult {
  encoded: string
  truncated: boolean
}

function encodeWithTruncation(content: string, limit: number): TruncationResult {
  let encoded = encode(content)
  if (encoded.length <= limit) {
    return { encoded, truncated: false }
  }
  const ratio = encoded.length / content.length
  let targetLen = Math.floor(limit / ratio * 0.9)
  let truncated = content.substring(0, targetLen)
  const lastNewline = truncated.lastIndexOf('\n')
  if (lastNewline > targetLen * 0.5) {
    truncated = truncated.substring(0, lastNewline)
  }
  encoded = encode(truncated)
  if (encoded.length > limit) {
    targetLen = Math.floor(targetLen * (limit / encoded.length) * 0.95)
    truncated = content.substring(0, targetLen)
    const ln = truncated.lastIndexOf('\n')
    if (ln > targetLen * 0.5) truncated = truncated.substring(0, ln)
    encoded = encode(truncated)
  }
  return { encoded, truncated: true }
}

export async function updateURL(content: string, getPassword: () => string | null): Promise<void> {
  const truncBanner = document.getElementById('truncBanner')!
  const encStatus = document.getElementById('encStatus')!

  if (!content || !content.trim()) {
    history.replaceState(null, '', window.location.pathname)
    truncBanner.classList.remove('visible')
    return
  }

  const password = getPassword()
  if (password) {
    truncBanner.classList.remove('visible')
    const params = new URLSearchParams(window.location.search)
    params.delete('t')
    try {
      const encrypted = await encryptContent(content, password)
      const hash = 'e:' + encrypted
      if (hash.length > URL_LIMIT) {
        encStatus.textContent = 'too large'
        return
      }
      const search = params.toString() ? '?' + params.toString() : ''
      history.replaceState(null, '', search + '#' + hash)
    } catch {
      encStatus.textContent = 'error'
    }
    return
  }

  const result = encodeWithTruncation(content, URL_LIMIT)
  const params = new URLSearchParams(window.location.search)
  if (result.truncated) {
    params.set('t', '1')
    truncBanner.classList.add('visible')
  } else {
    params.delete('t')
    truncBanner.classList.remove('visible')
  }
  const search = params.toString() ? '?' + params.toString() : ''
  history.replaceState(null, '', search + '#' + result.encoded)
}

export type URLResult =
  | { encrypted: false; content: string | null }
  | { encrypted: true; data: string }

export function loadFromURL(): URLResult {
  const hash = window.location.hash.substring(1)
  if (!hash) return { encrypted: false, content: null }
  if (hash.startsWith('e:')) {
    return { encrypted: true, data: hash.substring(2) }
  }
  const content = decode(hash)
  if (new URLSearchParams(window.location.search).has('t')) {
    document.getElementById('truncBanner')!.classList.add('visible')
  }
  return { encrypted: false, content }
}

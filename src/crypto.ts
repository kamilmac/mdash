import LZString from 'lz-string'

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptContent(content: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const compressed = LZString.compressToEncodedURIComponent(content)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(compressed)
  )
  const packed = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
  packed.set(salt, 0)
  packed.set(iv, salt.length)
  packed.set(new Uint8Array(ciphertext), salt.length + iv.length)
  let binary = ''
  for (let i = 0; i < packed.length; i++) binary += String.fromCharCode(packed[i])
  let b64 = btoa(binary)
  b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return b64
}

export async function decryptContent(data: string, password: string): Promise<string> {
  let b64 = data.replace(/-/g, '+').replace(/_/g, '/')
  while (b64.length % 4) b64 += '='
  const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const salt = raw.slice(0, 16)
  const iv = raw.slice(16, 28)
  const ciphertext = raw.slice(28)
  const key = await deriveKey(password, salt)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  )
  const compressed = new TextDecoder().decode(decrypted)
  return LZString.decompressFromEncodedURIComponent(compressed)
}

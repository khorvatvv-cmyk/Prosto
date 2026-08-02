const encoder = new TextEncoder()
const decoder = new TextDecoder()
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60

function bytesToBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, character => character.charCodeAt(0))
}

async function importHmacKey(secret, usage) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage,
  )
}

export async function hashPassword(password, secret) {
  if (!secret) throw new Error('PASSWORD_PEPPER is not configured')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const saltValue = bytesToBase64Url(salt)
  const key = await importHmacKey(secret, ['sign'])
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`prosto-password-v1\0${saltValue}\0${password}`),
  )
  return `hmac-sha256$${saltValue}$${bytesToBase64Url(new Uint8Array(signature))}`
}

export async function verifyPassword(password, storedHash, secret) {
  if (!secret) throw new Error('PASSWORD_PEPPER is not configured')
  const [algorithm, saltValue, expectedValue] = String(storedHash || '').split('$')
  if (algorithm !== 'hmac-sha256' || !saltValue || !expectedValue) return false

  const key = await importHmacKey(secret, ['verify'])
  return crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(expectedValue),
    encoder.encode(`prosto-password-v1\0${saltValue}\0${password}`),
  )
}

export async function signToken(userId, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret) throw new Error('JWT_SECRET is not configured')
  const header = bytesToBase64Url(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({
    userId,
    iat: nowSeconds,
    exp: nowSeconds + TOKEN_TTL_SECONDS,
  })))
  const unsignedToken = `${header}.${payload}`
  const key = await importHmacKey(secret, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(unsignedToken))
  return `${unsignedToken}.${bytesToBase64Url(new Uint8Array(signature))}`
}

export async function verifyToken(token, secret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!secret) throw new Error('JWT_SECRET is not configured')
  const parts = String(token || '').split('.')
  if (parts.length !== 3) return null

  const [headerValue, payloadValue, signatureValue] = parts
  const key = await importHmacKey(secret, ['verify'])
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(signatureValue),
    encoder.encode(`${headerValue}.${payloadValue}`),
  )
  if (!valid) return null

  try {
    const payload = JSON.parse(decoder.decode(base64UrlToBytes(payloadValue)))
    if (!Number.isInteger(payload.userId) || !Number.isFinite(payload.exp) || payload.exp <= nowSeconds) return null
    return payload
  } catch {
    return null
  }
}

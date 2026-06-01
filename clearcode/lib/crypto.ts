const getKey = async (): Promise<CryptoKey> => {
  const hex = process.env.TOKEN_ENCRYPTION_KEY!
  const raw = Buffer.from(hex, 'hex')
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

export async function encrypt(text: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(text)
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const result = new Uint8Array(iv.length + encrypted.byteLength)
  result.set(iv, 0)
  result.set(new Uint8Array(encrypted), iv.length)
  return Buffer.from(result).toString('base64')
}

export async function decrypt(encryptedText: string): Promise<string> {
  const key = await getKey()
  const data = Buffer.from(encryptedText, 'base64')
  const iv = data.subarray(0, 12)
  const encrypted = data.subarray(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return new TextDecoder().decode(decrypted)
}

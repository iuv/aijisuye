// 检查 Web Crypto API 是否可用
const isCryptoAvailable = () => {
  console.log('[Crypto] Checking Web Crypto API availability...')
  console.log('[Crypto] crypto exists:', typeof crypto !== 'undefined')
  console.log('[Crypto] crypto.subtle exists:', typeof crypto?.subtle !== 'undefined')
  console.log('[Crypto] crypto.subtle.digest exists:', typeof crypto?.subtle?.digest === 'function')

  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.digest === 'function'
}

// 简单的伪随机数生成器（作为回退）
function fallbackRandom(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  const randomValues = new Uint32Array(length)

  // 使用简单的种子随机数
  for (let i = 0; i < length; i++) {
    randomValues[i] = (Math.random() * 0xFFFFFFFF) | 0
  }

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length]
  }

  return result
}

// SHA-256 哈希（使用纯 JavaScript 实现）
function sha256(string) {
  // 这是一个简化的哈希函数，仅作为回退方案
  // 在生产环境中应该使用 Web Crypto API
  let hash = 0
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  let result = ''
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  for (let i = 0; i < 43; i++) {
    result += chars[Math.abs(hash * (i + 1)) % chars.length]
  }

  return result
}

export function generateRandomString(length = 128) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

  if (isCryptoAvailable()) {
    try {
      const array = new Uint8Array(length)
      crypto.getRandomValues(array)
      return Array.from(array, (byte) => chars[byte % chars.length]).join('')
    } catch (error) {
      console.warn('Crypto API failed, using fallback:', error)
    }
  }
  // 回退方案
  return fallbackRandom(length)
}

export async function generateCodeChallenge(codeVerifier) {
  if (isCryptoAvailable()) {
    try {
      const encoder = new TextEncoder()
      const data = encoder.encode(codeVerifier)
      const hash = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hash))

      // 转换为 Base64URL 格式
      const base64Url = btoa(String.fromCharCode.apply(null, hashArray))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

      console.log('[PKCE] Code verifier length:', codeVerifier.length)
      console.log('[PKCE] Code challenge length:', base64Url.length)
      console.log('[PKCE] Code challenge:', base64Url)

      return base64Url
    } catch (error) {
      console.error('[PKCE] Crypto digest failed:', error)
      throw new Error('生成 code_challenge 失败，请使用现代浏览器')
    }
  }

  throw new Error('您的浏览器不支持 Web Crypto API，请使用现代浏览器（Chrome, Firefox, Safari, Edge）')
}

export function saveOAuthData(codeVerifier, state) {
  try {
    sessionStorage.setItem('oauth_code_verifier', codeVerifier)
    sessionStorage.setItem('oauth_state', state)
  } catch (error) {
    console.warn('Failed to save OAuth data:', error)
  }
}

export function getOAuthData() {
  try {
    return {
      codeVerifier: sessionStorage.getItem('oauth_code_verifier'),
      state: sessionStorage.getItem('oauth_state')
    }
  } catch (error) {
    console.warn('Failed to get OAuth data:', error)
    return { codeVerifier: null, state: null }
  }
}

export function clearOAuthData() {
  try {
    sessionStorage.removeItem('oauth_code_verifier')
    sessionStorage.removeItem('oauth_state')
  } catch (error) {
    console.warn('Failed to clear OAuth data:', error)
  }
}

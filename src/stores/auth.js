import { defineStore } from 'pinia'
import { generateRandomString, generateCodeChallenge, saveOAuthData, getOAuthData, clearOAuthData } from '@/utils/crypto'

// 安全访问 localStorage
const safeLocalStorage = {
  getItem(key) {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn('localStorage access failed:', error)
      return null
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.warn('localStorage set failed:', error)
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('localStorage remove failed:', error)
    }
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null,
    accessToken: null
  }),

  getters: {
    githubToken: (state) => state.accessToken
  },

  actions: {
    async login() {
      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
      const redirectUri = `${window.location.origin}/auth/callback`

      console.log('[Auth] Starting OAuth login flow')
      console.log('[Auth] Client ID:', clientId)
      console.log('[Auth] Redirect URI:', redirectUri)

      // 生成 PKCE 参数
      const codeVerifier = generateRandomString(128)
      console.log('[Auth] Code verifier generated (length:', codeVerifier.length + ')')

      const codeChallenge = await generateCodeChallenge(codeVerifier)
      console.log('[Auth] Code challenge generated (length:', codeChallenge.length + ')')

      const state = generateRandomString(32)
      console.log('[Auth] State generated (length:', state.length + ')')

      // 保存 OAuth 数据
      saveOAuthData(codeVerifier, state)
      console.log('[Auth] OAuth data saved to sessionStorage')

      // 构建授权 URL
      const scope = 'read:user user:email repo'
      const authUrl = new URL('https://github.com/login/oauth/authorize')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('scope', scope)
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      console.log('[Auth] Authorization URL constructed')
      console.log('[Auth] Redirecting to GitHub OAuth page...')

      window.location.href = authUrl.toString()
    },

    async handleCallback(code, state) {
      console.log('[Auth] Handling OAuth callback')
      console.log('[Auth] Received code:', code ? code.substring(0, 20) + '...' : 'null')
      console.log('[Auth] Received state:', state ? state.substring(0, 10) + '...' : 'null')

      const { codeVerifier, state: savedState } = getOAuthData()

      if (!codeVerifier) {
        throw new Error('未找到 code_verifier，请重新登录')
      }

      if (!state || !savedState) {
        throw new Error('未找到 state 参数，请重新登录')
      }

      if (state !== savedState) {
        console.error('[Auth] State mismatch!')
        console.error('[Auth] Received:', state)
        console.error('[Auth] Saved:', savedState)
        throw new Error('State 参数不匹配，可能存在安全风险')
      }

      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID

      if (!clientId || clientId === 'your_github_client_id') {
        throw new Error('请在 .env.development 中配置正确的 VITE_GITHUB_CLIENT_ID')
      }

      console.log('[Auth] Requesting access token from GitHub...')
      console.log('[Auth] Client ID:', clientId)

      const requestBody = {
        client_id: clientId,
        code,
        code_verifier: codeVerifier,
        redirect_uri: `${window.location.origin}/auth/callback`
      }

      console.log('[Auth] Request body:', {
        ...requestBody,
        code_verifier: codeVerifier.substring(0, 10) + '...',
        code: code.substring(0, 10) + '...'
      })

      let tokenData
      try {
        // 检查是否配置了 OAuth 代理
        const oauthProxyUrl = import.meta.env.VITE_OAUTH_PROXY_URL
        const tokenUrl = oauthProxyUrl || 'https://github.com/login/oauth/access_token'

        console.log('[Auth] Using token URL:', tokenUrl)

        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        console.log('[Auth] Token response status:', tokenResponse.status)
        console.log('[Auth] Token response headers:', Object.fromEntries(tokenResponse.headers.entries()))

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error('[Auth] Token request failed:', errorText)
          throw new Error(`获取 token 失败 (${tokenResponse.status}): ${errorText}`)
        }

        tokenData = await tokenResponse.json()
        console.log('[Auth] Token data received')

        if (tokenData.error) {
          console.error('[Auth] Token error:', tokenData.error)
          console.error('[Auth] Error description:', tokenData.error_description)
          throw new Error(tokenData.error_description || 'Failed to get access token')
        }

        console.log('[Auth] Access token obtained successfully')
      } catch (error) {
        if (error.message.includes('CORS')) {
          console.error('[Auth] CORS error detected')
          console.error('[Auth] This may be due to:')
          console.error('[Auth] 1. GitHub OAuth App callback URL not configured correctly')
          console.error('[Auth] 2. Client ID is invalid')
          console.error('[Auth] 3. Network/firewall issues')
          throw new Error('CORS 错误：请检查 GitHub OAuth App 的回调 URL 配置是否正确')
        }
        throw error
      }

      const newAccessToken = tokenData.access_token

      console.log('[Auth] Fetching user information...')

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${newAccessToken}`
        }
      })

      if (!userResponse.ok) {
        const errorText = await userResponse.text()
        console.error('[Auth] Failed to fetch user info:', errorText)
        throw new Error('获取用户信息失败')
      }

      const userData = await userResponse.json()

      console.log('[Auth] User authenticated:', userData.login)

      this.accessToken = newAccessToken
      this.user = userData
      this.isAuthenticated = true

      safeLocalStorage.setItem('github_access_token', newAccessToken)
      safeLocalStorage.setItem('github_user', JSON.stringify(userData))

      clearOAuthData()

      console.log('[Auth] Authentication completed successfully')
      return userData
    },

    logout() {
      this.isAuthenticated = false
      this.user = null
      this.accessToken = null
      safeLocalStorage.removeItem('github_access_token')
      safeLocalStorage.removeItem('github_user')
    },

    checkAuth() {
      const token = safeLocalStorage.getItem('github_access_token')
      const userData = safeLocalStorage.getItem('github_user')

      if (token && userData) {
        this.accessToken = token
        try {
          this.user = JSON.parse(userData)
        } catch (error) {
          console.warn('Failed to parse user data:', error)
          this.user = null
        }
        this.isAuthenticated = true
      }
    }
  }
})

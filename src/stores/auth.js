import { defineStore } from 'pinia'
import { generateRandomString, generateCodeChallenge, saveOAuthData, getOAuthData, clearOAuthData } from '@/utils/crypto'
import { safeLocalStorage } from '@/utils/helpers'

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

      // 生成 PKCE 参数
      const codeVerifier = generateRandomString(128)
      const codeChallenge = await generateCodeChallenge(codeVerifier)
      const state = generateRandomString(32)

      // 保存 OAuth 数据
      saveOAuthData(codeVerifier, state)

      // 构建授权 URL
      const scope = 'read:user user:email repo'
      const authUrl = new URL('https://github.com/login/oauth/authorize')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('scope', scope)
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', codeChallenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')

      window.location.href = authUrl.toString()
    },

    async handleCallback(code, state) {
      const { codeVerifier, state: savedState } = getOAuthData()

      if (!codeVerifier) {
        throw new Error('未找到 code_verifier，请重新登录')
      }

      if (!state || !savedState) {
        throw new Error('未找到 state 参数，请重新登录')
      }

      if (state !== savedState) {
        console.error('[Auth] State mismatch!')
        throw new Error('State 参数不匹配，可能存在安全风险')
      }

      const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID

      if (!clientId || clientId === 'your_github_client_id') {
        throw new Error('请在 .env.development 中配置正确的 VITE_GITHUB_CLIENT_ID')
      }

      const requestBody = {
        client_id: clientId,
        code,
        code_verifier: codeVerifier,
        redirect_uri: `${window.location.origin}/auth/callback`
      }

      let tokenData
      try {
        // 检查是否配置了 OAuth 代理
        const oauthProxyUrl = import.meta.env.VITE_OAUTH_PROXY_URL
        const tokenUrl = oauthProxyUrl || 'https://github.com/login/oauth/access_token'

        const tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text()
          console.error('[Auth] Token request failed:', errorText)
          throw new Error(`获取 token 失败 (${tokenResponse.status}): ${errorText}`)
        }

        tokenData = await tokenResponse.json()

        if (tokenData.error) {
          console.error('[Auth] Token error:', tokenData.error)
          throw new Error(tokenData.error_description || 'Failed to get access token')
        }
      } catch (error) {
        if (error.message.includes('CORS')) {
          console.error('[Auth] CORS error - check GitHub OAuth App callback URL configuration')
          throw new Error('CORS 错误：请检查 GitHub OAuth App 的回调 URL 配置是否正确')
        }
        throw error
      }

      const newAccessToken = tokenData.access_token

      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${newAccessToken}`
        }
      })

      if (!userResponse.ok) {
        console.error('[Auth] Failed to fetch user info')
        throw new Error('获取用户信息失败')
      }

      const userData = await userResponse.json()

      this.accessToken = newAccessToken
      this.user = userData
      this.isAuthenticated = true

      safeLocalStorage.setItem('github_access_token', newAccessToken)
      safeLocalStorage.setItem('github_user', JSON.stringify(userData))

      clearOAuthData()

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

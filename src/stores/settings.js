import { defineStore } from 'pinia'
import { createUserDataStore } from '@/utils/dataStore'
import { useAuthStore } from './auth'
import { useSyncStore } from './sync'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    settings: {
      siteName: '我的导航',
      siteDescription: '个人收藏的实用网站导航',
      language: 'zh-CN',
      showSearch: true,
      showCategories: true,
      showIcons: true,
      searchEngines: [
        { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={q}', icon: '🔍' },
        { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={q}', icon: '🔎' }
      ],
      defaultSearchEngine: 'google'
    },
    // 是否已从远程加载
    loaded: false
  }),

  actions: {
    async fetchSettings() {
      try {
        const authStore = useAuthStore()

        if (!authStore.accessToken && import.meta.env.VITE_DEV_MODE !== 'true') {
          return
        }

        // 先检查本地缓存
        const cachedSettings = localStorage.getItem('cached_settings')
        if (cachedSettings && this.loaded) {
          console.log('[Settings] Using cached settings')
          this.settings = JSON.parse(cachedSettings)
          return
        }

        // 从远程加载
        console.log('[Settings] Fetching from remote')
        const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)
        const settingsData = await dataStore.getSettings()

        if (settingsData) {
          this.settings = settingsData
          // 缓存到本地
          localStorage.setItem('cached_settings', JSON.stringify(settingsData))
          this.loaded = true
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        // 如果远程加载失败，尝试使用缓存
        const cachedSettings = localStorage.getItem('cached_settings')
        if (cachedSettings) {
          console.log('[Settings] Using cached settings after fetch error')
          this.settings = JSON.parse(cachedSettings)
        }
      }
    },

    async updateSettings(updatedSettings) {
      const authStore = useAuthStore()

      if (!authStore.accessToken && import.meta.env.VITE_DEV_MODE !== 'true') {
        throw new Error('Not authenticated')
      }

      // 只在本地更新
      this.settings = { ...this.settings, ...updatedSettings }

      // 缓存到本地
      localStorage.setItem('cached_settings', JSON.stringify(this.settings))

      // 标记为有未同步的更改
      const syncStore = useSyncStore()
      syncStore.markAsModified()

      console.log('[Settings] Updated locally, marked as modified')
    },

    // 同步到远程
    async syncToRemote() {
      const authStore = useAuthStore()

      if (!authStore.accessToken && import.meta.env.VITE_DEV_MODE !== 'true') {
        throw new Error('Not authenticated')
      }

      console.log('[Settings] Syncing to remote')
      const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)
      await dataStore.saveSettings(this.settings, 'Update settings')

      // 更新本地缓存
      localStorage.setItem('cached_settings', JSON.stringify(this.settings))
      console.log('[Settings] Synced to remote successfully')
    }
  }
})

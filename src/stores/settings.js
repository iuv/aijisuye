import { defineStore } from 'pinia'
import { createUserDataStore } from '@/utils/dataStore'
import { useAuthStore } from './auth'

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
    }
  }),

  actions: {
    async fetchSettings() {
      try {
        const authStore = useAuthStore()

        if (!authStore.accessToken && import.meta.env.VITE_DEV_MODE !== 'true') {
          return
        }

        // 使用登录用户的用户名
        const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)
        const settingsData = await dataStore.getSettings()

        if (settingsData) {
          this.settings = settingsData
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }
    },

    async updateSettings(updatedSettings) {
      const authStore = useAuthStore()

      if (!authStore.accessToken && import.meta.env.VITE_DEV_MODE !== 'true') {
        throw new Error('Not authenticated')
      }

      const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)
      this.settings = { ...this.settings, ...updatedSettings }

      // 同步到数据存储（开发模式同步到内存缓存）
      await dataStore.saveSettings(this.settings, 'Update settings')
    }
  }
})

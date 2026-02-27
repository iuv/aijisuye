import { defineStore } from 'pinia'
import { createDataStore } from '@/utils/dataStore'
import { defaultSkins } from '@/utils/defaultSkins'
import { useAuthStore } from './auth'

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
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const useSkinStore = defineStore('skin', {
  state: () => ({
    currentSkin: 'default',
    customSkins: [],  // 用户自定义皮肤
    loaded: false     // 是否已加载自定义皮肤
  }),

  getters: {
    // 默认皮肤列表
    defaultSkinsList: () => defaultSkins,

    // 所有皮肤（默认 + 自定义）
    allSkins: (state) => [...defaultSkins, ...state.customSkins],

    // 当前皮肤数据
    currentSkinData: (state) => {
      const allSkins = [...defaultSkins, ...state.customSkins]
      return allSkins.find(skin => skin.id === state.currentSkin) || allSkins[0]
    },

    // 检查皮肤是否为默认皮肤
    isDefaultSkin: () => (skinId) => {
      return defaultSkins.some(s => s.id === skinId)
    }
  },

  actions: {
    // 加载自定义皮肤（只在需要时调用）
    async fetchCustomSkins() {
      if (this.loaded) return

      try {
        const authStore = useAuthStore()
        const repo = import.meta.env.VITE_GITHUB_REPO_NAME

        // 开发模式或未认证时，不加载自定义皮肤
        if (import.meta.env.VITE_DEV_MODE === 'true' || !authStore.accessToken) {
          this.loaded = true
          return
        }

        const dataStore = createDataStore(authStore.accessToken, authStore.user?.login, repo)
        const skinsData = await dataStore.getSkins()

        if (skinsData && Array.isArray(skinsData) && skinsData.length > 0) {
          this.customSkins = skinsData
        }
        this.loaded = true
      } catch (error) {
        console.error('Failed to fetch custom skins:', error)
        this.loaded = true
      }
    },

    // 保存自定义皮肤
    async saveCustomSkins() {
      try {
        const authStore = useAuthStore()
        const repo = import.meta.env.VITE_GITHUB_REPO_NAME

        if (!authStore.accessToken) {
          throw new Error('Not authenticated')
        }

        const dataStore = createDataStore(authStore.accessToken, authStore.user?.login, repo)
        await dataStore.saveSkins(this.customSkins, 'Update custom skins')
      } catch (error) {
        console.error('Failed to save custom skins:', error)
        throw error
      }
    },

    // 添加自定义皮肤
    async addCustomSkin(skin) {
      const newSkin = {
        ...skin,
        id: skin.id || generateUUID(),
        isDefault: false,
        isSystem: false
      }
      this.customSkins.push(newSkin)
      await this.saveCustomSkins()
      return newSkin
    },

    // 更新自定义皮肤
    async updateCustomSkin(skinId, skinData) {
      const index = this.customSkins.findIndex(s => s.id === skinId)
      if (index !== -1) {
        this.customSkins[index] = { ...this.customSkins[index], ...skinData }
        await this.saveCustomSkins()
      }
    },

    // 删除自定义皮肤
    async deleteCustomSkin(skinId) {
      this.customSkins = this.customSkins.filter(s => s.id !== skinId)
      await this.saveCustomSkins()
    },

    applySkin(skinId) {
      const allSkins = [...defaultSkins, ...this.customSkins]
      const skin = allSkins.find(s => s.id === skinId)
      if (!skin) {
        console.warn(`Skin ${skinId} not found`)
        return
      }

      this.currentSkin = skinId

      const root = document.documentElement
      if (root && skin.variables) {
        Object.entries(skin.variables).forEach(([key, value]) => {
          root.style.setProperty(key, value)
        })
      }

      safeLocalStorage.setItem('current_skin', skinId)
    },

    async loadSavedSkin() {
      const savedSkinId = safeLocalStorage.getItem('current_skin')

      // 检查保存的皮肤是否在默认列表中
      if (savedSkinId && !defaultSkins.some(s => s.id === savedSkinId)) {
        // 不在默认列表，需要加载自定义皮肤
        await this.fetchCustomSkins()
      }

      // 应用保存的皮肤或默认皮肤
      const allSkins = [...defaultSkins, ...this.customSkins]
      if (savedSkinId && allSkins.some(s => s.id === savedSkinId)) {
        this.applySkin(savedSkinId)
      } else if (allSkins.length > 0) {
        this.applySkin(allSkins[0].id)
      }
    },

    // 同步到远程
    async syncToRemote() {
      if (this.customSkins.length > 0 || this.loaded) {
        await this.saveCustomSkins()
      }
      return Promise.resolve()
    }
  }
})

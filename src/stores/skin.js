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
    skins: []
  }),

  getters: {
    currentSkinData: (state) => {
      return state.skins.find(skin => skin.id === state.currentSkin) || state.skins[0]
    }
  },

  actions: {
    async fetchSkins() {
      try {
        const authStore = useAuthStore()
        const repo = import.meta.env.VITE_GITHUB_REPO_NAME

        // 开发模式或未认证时，直接使用默认皮肤
        if (import.meta.env.VITE_DEV_MODE === 'true' || !authStore.accessToken) {
          this.skins = defaultSkins
          return
        }

        const dataStore = createDataStore(authStore.accessToken, authStore.user?.login, repo)
        const skinsData = await dataStore.getSkins()

        // 如果获取失败或数据为空，使用默认皮肤
        if (skinsData && Array.isArray(skinsData) && skinsData.length > 0) {
          this.skins = skinsData
        } else {
          this.skins = defaultSkins
        }
      } catch (error) {
        console.error('Failed to fetch skins:', error)
        this.skins = defaultSkins
      }
    },

    applySkin(skinId) {
      const skin = this.skins.find(s => s.id === skinId)
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
      await this.fetchSkins()
      const savedSkinId = safeLocalStorage.getItem('current_skin')
      if (savedSkinId && this.skins.length > 0) {
        this.applySkin(savedSkinId)
      } else if (this.skins.length > 0) {
        this.applySkin(this.skins[0].id)
      }
    },

    // 同步到远程（皮肤数据通常不需要同步，因为用户只能选择不能修改）
    async syncToRemote() {
      console.log('[Skin] No sync needed for skin data')
      return Promise.resolve()
    }
  }
})

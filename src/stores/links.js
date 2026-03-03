import { defineStore } from 'pinia'
import { createUserDataStore } from '@/utils/dataStore'
import { useAuthStore } from './auth'
import { useSyncStore } from './sync'
import { generateUUID } from '@/utils/helpers'

export const useLinksStore = defineStore('links', {
  state: () => ({
    links: [],
    categories: [],
    loading: false,
    error: null,
    loaded: false
  }),

  actions: {
    async fetchData() {
      this.loading = true
      try {
        const authStore = useAuthStore()
        const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

        if (!authStore.accessToken && !isDevMode) {
          throw new Error('Not authenticated')
        }

        // 先检查本地缓存
        const cachedLinks = localStorage.getItem('cached_links')
        const cachedCategories = localStorage.getItem('cached_categories')
        if ((cachedLinks || cachedCategories) && this.loaded) {
          this.links = cachedLinks ? JSON.parse(cachedLinks) : []
          this.categories = cachedCategories ? JSON.parse(cachedCategories) : []
          return
        }

        // 从远程加载
        const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)
        const linksData = await dataStore.getLinks()
        const categoriesData = await dataStore.getCategories()

        this.links = linksData || []
        this.categories = categoriesData || []

        // 缓存到本地
        localStorage.setItem('cached_links', JSON.stringify(this.links))
        localStorage.setItem('cached_categories', JSON.stringify(this.categories))
        this.loaded = true
      } catch (error) {
        this.error = error.message
        // 如果远程加载失败，尝试使用缓存
        const cachedLinks = localStorage.getItem('cached_links')
        const cachedCategories = localStorage.getItem('cached_categories')
        if (cachedLinks || cachedCategories) {
          this.links = cachedLinks ? JSON.parse(cachedLinks) : []
          this.categories = cachedCategories ? JSON.parse(cachedCategories) : []
        }
      } finally {
        this.loading = false
      }
    },

    async addLink(link) {
      const newLink = {
        ...link,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.links.push(newLink)

      // 缓存到本地
      localStorage.setItem('cached_links', JSON.stringify(this.links))

      // 标记为有未同步的更改
      const syncStore = useSyncStore()
      syncStore.markAsModified()
    },

    async updateLink(linkId, updatedData) {
      const index = this.links.findIndex(l => l.id === linkId)
      if (index !== -1) {
        this.links[index] = {
          ...this.links[index],
          ...updatedData,
          updatedAt: new Date().toISOString()
        }

        // 缓存到本地
        localStorage.setItem('cached_links', JSON.stringify(this.links))

        // 标记为有未同步的更改
        const syncStore = useSyncStore()
        syncStore.markAsModified()
      }
    },

    async deleteLink(linkId) {
      this.links = this.links.filter(l => l.id !== linkId)

      // 缓存到本地
      localStorage.setItem('cached_links', JSON.stringify(this.links))

      // 标记为有未同步的更改
      const syncStore = useSyncStore()
      syncStore.markAsModified()
    },

    async addCategory(category) {
      const newCategory = {
        ...category,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.categories.push(newCategory)

      // 缓存到本地
      localStorage.setItem('cached_categories', JSON.stringify(this.categories))

      // 标记为有未同步的更改
      const syncStore = useSyncStore()
      syncStore.markAsModified()
    },

    async updateCategory(categoryId, updatedData) {
      const index = this.categories.findIndex(c => c.id === categoryId)
      if (index !== -1) {
        this.categories[index] = {
          ...this.categories[index],
          ...updatedData,
          updatedAt: new Date().toISOString()
        }

        // 缓存到本地
        localStorage.setItem('cached_categories', JSON.stringify(this.categories))

        // 标记为有未同步的更改
        const syncStore = useSyncStore()
        syncStore.markAsModified()
      }
    },

    async deleteCategory(categoryId) {
      this.categories = this.categories.filter(c => c.id !== categoryId)
      this.links = this.links.filter(l => l.categoryId !== categoryId)

      // 缓存到本地
      localStorage.setItem('cached_categories', JSON.stringify(this.categories))
      localStorage.setItem('cached_links', JSON.stringify(this.links))

      // 标记为有未同步的更改
      const syncStore = useSyncStore()
      syncStore.markAsModified()
    },

    // 同步到远程
    async syncToRemote() {
      const authStore = useAuthStore()
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

      if (!authStore.accessToken && !isDevMode) {
        throw new Error('Not authenticated')
      }

      const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)

      // 同步链接
      await dataStore.saveLinks(this.links, 'Sync links')
      localStorage.setItem('cached_links', JSON.stringify(this.links))

      // 同步分类
      await dataStore.saveCategories(this.categories, 'Sync categories')
      localStorage.setItem('cached_categories', JSON.stringify(this.categories))
    }
  }
})

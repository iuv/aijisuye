import { defineStore } from 'pinia'
import { createUserDataStore } from '@/utils/dataStore'
import { useAuthStore } from './auth'

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export const useLinksStore = defineStore('links', {
  state: () => ({
    links: [],
    categories: [],
    loading: false,
    error: null
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

        // 使用登录用户的用户名
        const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)
        const linksData = await dataStore.getLinks()
        const categoriesData = await dataStore.getCategories()

        this.links = linksData || []
        this.categories = categoriesData || []
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async addLink(link) {
      const authStore = useAuthStore()
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

      const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)

      const newLink = {
        ...link,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.links.push(newLink)

      // 同步到数据存储（开发模式同步到内存缓存）
      await dataStore.saveLinks(this.links, `Add link: ${link.title}`)
    },

    async updateLink(linkId, updatedData) {
      const authStore = useAuthStore()
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'
      const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)

      const index = this.links.findIndex(l => l.id === linkId)
      if (index !== -1) {
        this.links[index] = {
          ...this.links[index],
          ...updatedData,
          updatedAt: new Date().toISOString()
        }

        // 同步到数据存储（开发模式同步到内存缓存）
        await dataStore.saveLinks(this.links, `Update link: ${updatedData.title}`)
      }
    },

    async deleteLink(linkId) {
      const authStore = useAuthStore()
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'
      const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)

      this.links = this.links.filter(l => l.id !== linkId)

      // 同步到数据存储（开发模式同步到内存缓存）
      await dataStore.saveLinks(this.links, `Delete link: ${linkId}`)
    },

    async addCategory(category) {
      const authStore = useAuthStore()
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'
      const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)

      const newCategory = {
        ...category,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.categories.push(newCategory)

      // 同步到数据存储（开发模式同步到内存缓存）
      await dataStore.saveCategories(this.categories, `Add category: ${category.name}`)
    },

    async updateCategory(categoryId, updatedData) {
      const authStore = useAuthStore()
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'
      const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)

      const index = this.categories.findIndex(c => c.id === categoryId)
      if (index !== -1) {
        this.categories[index] = {
          ...this.categories[index],
          ...updatedData,
          updatedAt: new Date().toISOString()
        }

        // 同步到数据存储（开发模式同步到内存缓存）
        await dataStore.saveCategories(this.categories, `Update category: ${updatedData.name}`)
      }
    },

    async deleteCategory(categoryId) {
      const authStore = useAuthStore()
      const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'
      const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)

      this.categories = this.categories.filter(c => c.id !== categoryId)
      this.links = this.links.filter(l => l.categoryId !== categoryId)

      // 同步到数据存储（开发模式同步到内存缓存）
      await dataStore.saveCategories(this.categories, `Delete category: ${categoryId}`)
      await dataStore.saveLinks(this.links, `Delete links for category: ${categoryId}`)
    }
  }
})

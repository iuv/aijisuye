import { defaultSkins } from './defaultSkins'

const memoryCache = new Map()

export class LocalDataStore {
  constructor(dataPath) {
    this.dataPath = dataPath
  }

  async getFile(path) {
    try {
      if (memoryCache.has(path)) {
        return JSON.parse(JSON.stringify(memoryCache.get(path)))
      }

      const fullPath = `${this.dataPath}/${path}`
      const response = await fetch(fullPath)
      if (!response.ok) {
        throw new Error(`File not found: ${path}`)
      }
      const data = await response.json()

      memoryCache.set(path, data)
      return data
    } catch (error) {
      console.warn(`Failed to read ${path}:`, error.message)

      if (path.includes('links.json')) return []
      if (path.includes('categories.json')) return []
      if (path.includes('settings.json')) {
        return {
          siteName: '我的导航',
          siteDescription: '个人收藏的实用网站导航',
          language: 'zh-CN',
          showSearch: true,
          showCategories: true,
          showIcons: true
        }
      }
      if (path.includes('skins.json')) return defaultSkins
      return null
    }
  }

  async writeFile(path, content, message) {
    try {
      memoryCache.set(path, content)
      console.log(`[Dev Mode] ${message}:`, path)
      console.log('Data saved to memory cache')
      return true
    } catch (error) {
      console.error('Write to memory error:', error)
      throw error
    }
  }

  async getLinks() {
    return this.getFile('links.json')
  }

  async saveLinks(links, message = 'Update links') {
    return this.writeFile('links.json', links, message)
  }

  async getCategories() {
    return this.getFile('categories.json')
  }

  async saveCategories(categories, message = 'Update categories') {
    return this.writeFile('categories.json', categories, message)
  }

  async getSettings() {
    return this.getFile('settings.json')
  }

  async saveSettings(settings, message = 'Update settings') {
    return this.writeFile('settings.json', settings, message)
  }

  async getSkins() {
    const data = await this.getFile('skins.json')
    // 兼容两种格式: { skins: [...] } 或直接数组
    if (data && data.skins) {
      return data.skins
    }
    return data
  }

  async saveSkins(skins, message = 'Update skins') {
    return this.writeFile('skins.json', skins, message)
  }

  clearCache() {
    memoryCache.clear()
  }

  getCacheStatus() {
    return {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys())
    }
  }
}

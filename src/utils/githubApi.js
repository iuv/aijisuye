import { Octokit } from 'octokit'

// 浏览器兼容的 base64 编解码函数
const toBase64 = (str) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  return btoa(String.fromCharCode(...data))
}

const fromBase64 = (str) => {
  const binaryString = atob(str)
  const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0))
  const decoder = new TextDecoder()
  return decoder.decode(bytes)
}

export class GitHubDataStore {
  constructor(accessToken, owner, repo) {
    this.octokit = new Octokit({ auth: accessToken })
    this.owner = owner
    this.repo = repo
  }

  /**
   * 检查仓库是否存在
   */
  async checkRepoExists() {
    try {
      await this.octokit.rest.repos.get({
        owner: this.owner,
        repo: this.repo
      })
      return true
    } catch (error) {
      if (error.status === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * 创建私有仓库并初始化数据文件
   */
  async createRepoAndInitData() {
    try {
      // 创建私有仓库
      await this.octokit.rest.repos.createForAuthenticatedUser({
        name: this.repo,
        private: true,
        description: '个人导航网站数据存储',
        auto_init: true
      })

      console.log('[GitHub] Private repository created:', `${this.owner}/${this.repo}`)

      // 等待仓库初始化
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 创建初始数据文件
      const initialData = {
        'data/links.json': [],
        'data/categories.json': [],
        'config/settings.json': {
          siteName: '我的导航',
          siteDescription: '个人收藏的实用网站导航',
          language: 'zh-CN',
          showSearch: true,
          showCategories: true,
          showIcons: true
        },
        'config/skins.json': { skins: [] }
      }

      // 批量创建文件
      for (const [path, content] of Object.entries(initialData)) {
        await this.octokit.rest.repos.createOrUpdateFileContents({
          owner: this.owner,
          repo: this.repo,
          path,
          message: `Initialize ${path}`,
          content: toBase64(JSON.stringify(content, null, 2))
        })
      }

      console.log('[GitHub] Initial data files created')
      return true
    } catch (error) {
      console.error('[GitHub] Failed to create repository:', error)
      throw error
    }
  }

  async getFile(path) {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path
      })
      const content = fromBase64(data.content)
      return JSON.parse(content)
    } catch (error) {
      if (error.status === 404) {
        return null
      }
      throw error
    }
  }

  async writeFile(path, content, message) {
    try {
      let sha = null
      try {
        const { data } = await this.octokit.rest.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path
        })
        sha = data.sha
      } catch (e) {
        // 文件不存在，创建新文件
      }

      const contentBase64 = toBase64(JSON.stringify(content, null, 2))

      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path,
        message,
        content: contentBase64,
        sha
      })

      return true
    } catch (error) {
      console.error('Write file error:', error)
      throw error
    }
  }

  async getLinks() {
    return this.getFile('data/links.json')
  }

  async saveLinks(links, message = 'Update links') {
    return this.writeFile('data/links.json', links, message)
  }

  async getCategories() {
    return this.getFile('data/categories.json')
  }

  async saveCategories(categories, message = 'Update categories') {
    return this.writeFile('data/categories.json', categories, message)
  }

  async getSettings() {
    return this.getFile('config/settings.json')
  }

  async saveSettings(settings, message = 'Update settings') {
    return this.writeFile('config/settings.json', settings, message)
  }

  async getSkins() {
    const data = await this.getFile('config/skins.json')
    // 兼容两种格式: { skins: [...] } 或直接数组
    if (data && data.skins) {
      return data.skins
    }
    return data
  }

  async saveSkins(skins, message = 'Update skins') {
    return this.writeFile('config/skins.json', { skins }, message)
  }
}

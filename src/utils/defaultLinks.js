// 默认分类和链接数据，供未登录用户查看
// ID 使用 default- 前缀，避免与用户 UUID 冲突

export const defaultCategories = [
  { id: 'default-cat-search', name: '搜索工具', icon: 'fas fa-search', order: 0 },
  { id: 'default-cat-dev', name: '开发工具', icon: 'fas fa-code', order: 1 },
  { id: 'default-cat-media', name: '影音娱乐', icon: 'fas fa-play-circle', order: 2 },
  { id: 'default-cat-social', name: '社交媒体', icon: 'fas fa-users', order: 3 },
  { id: 'default-cat-ai', name: 'AI 工具', icon: 'fas fa-robot', order: 4 }
]

export const defaultLinks = [
  // 搜索工具
  { id: 'default-link-google', title: 'Google', url: 'https://www.google.com', description: '全球最大搜索引擎', categoryId: 'default-cat-search' },
  { id: 'default-link-bing', title: 'Bing', url: 'https://www.bing.com', description: '微软搜索引擎', categoryId: 'default-cat-search' },
  { id: 'default-link-baidu', title: '百度', url: 'https://www.baidu.com', description: '中文搜索引擎', categoryId: 'default-cat-search' },
  { id: 'default-link-wikipedia', title: 'Wikipedia', url: 'https://www.wikipedia.org', description: '自由的百科全书', categoryId: 'default-cat-search' },

  // 开发工具
  { id: 'default-link-github', title: 'GitHub', url: 'https://github.com', description: '代码托管与协作平台', categoryId: 'default-cat-dev' },
  { id: 'default-link-stackoverflow', title: 'Stack Overflow', url: 'https://stackoverflow.com', description: '开发者问答社区', categoryId: 'default-cat-dev' },
  { id: 'default-link-mdn', title: 'MDN', url: 'https://developer.mozilla.org', description: 'Web 技术文档', categoryId: 'default-cat-dev' },
  { id: 'default-link-npm', title: 'npm', url: 'https://www.npmjs.com', description: 'Node.js 包管理器', categoryId: 'default-cat-dev' },

  // 影音娱乐
  { id: 'default-link-youtube', title: 'YouTube', url: 'https://www.youtube.com', description: '全球最大视频平台', categoryId: 'default-cat-media' },
  { id: 'default-link-bilibili', title: '哔哩哔哩', url: 'https://www.bilibili.com', description: '国内弹幕视频网站', categoryId: 'default-cat-media' },
  { id: 'default-link-netflix', title: 'Netflix', url: 'https://www.netflix.com', description: '流媒体影视平台', categoryId: 'default-cat-media' },

  // 社交媒体
  { id: 'default-link-twitter', title: 'X (Twitter)', url: 'https://x.com', description: '全球社交媒体平台', categoryId: 'default-cat-social' },
  { id: 'default-link-reddit', title: 'Reddit', url: 'https://www.reddit.com', description: '社区讨论平台', categoryId: 'default-cat-social' },
  { id: 'default-link-zhihu', title: '知乎', url: 'https://www.zhihu.com', description: '中文问答社区', categoryId: 'default-cat-social' },

  // AI 工具
  { id: 'default-link-chatgpt', title: 'ChatGPT', url: 'https://chat.openai.com', description: 'OpenAI 对话 AI', categoryId: 'default-cat-ai' },
  { id: 'default-link-claude', title: 'Claude', url: 'https://claude.ai', description: 'Anthropic 对话 AI', categoryId: 'default-cat-ai' },
  { id: 'default-link-midjourney', title: 'Midjourney', url: 'https://www.midjourney.com', description: 'AI 图像生成工具', categoryId: 'default-cat-ai' }
]

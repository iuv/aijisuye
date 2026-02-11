# GitHub 导航

基于 Vue 3 的多用户 GitHub 导航网站，支持 GitHub OAuth 登录和 GitHub Pages 部署。

## 功能特性

- ✅ GitHub OAuth 2.0 登录（PKCE 流程）
- ✅ 多用户支持，每个用户独立数据仓库
- ✅ 自动创建和管理 GitHub 仓库
- ✅ 响应式设计，支持移动端
- ✅ SPA 路由，支持 GitHub Pages 部署
- ✅ 本地开发模式，支持 dev-data 目录

## 快速开始

### 本地开发

1. **克隆仓库**
   ```bash
   git clone git@github.com:iuv/aijisuye.git
   cd aijisuye
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   # 复制示例文件
   cp .env.example .env.development

   # 编辑 .env.development，填入你的 GitHub Client ID
   VITE_GITHUB_CLIENT_ID=your_github_client_id_here
   VITE_GITHUB_REPO_NAME=jisuye-ext-data
   VITE_DEV_MODE=true
   VITE_DEV_DATA_PATH=./dev-data
   ```

4. **启动开发服务器**
   ```bash
   pnpm dev
   ```

   访问 http://localhost:5173

### GitHub Pages 部署

#### 1. 创建 GitHub OAuth App

访问 https://github.com/settings/developers，创建新的 OAuth App：

- **Application name**: GitHub 导航
- **Homepage URL**: `https://your-username.github.io/aijisuye/`
- **Authorization callback URL**: `https://your-username.github.io/aijisuye/auth/callback`

获取并保存 **Client ID**。

#### 2. 配置 GitHub Secrets

在 GitHub 仓库的 `Settings > Secrets and variables > Actions` 中添加：

- `CLIENT_ID`: 你的 GitHub OAuth App Client ID
- `REPO_NAME`: 数据仓库名称（可选，默认为 `jisuye-ext-data`）

#### 3. 启用 GitHub Pages

在 GitHub 仓库的 `Settings > Pages` 中：

- **Source**: GitHub Actions

#### 4. 推送代码

```bash
git add .
git commit -m "feat: initial commit"
git push origin main
```

GitHub Actions 会自动构建并部署到 GitHub Pages。

## 环境变量说明

### 开发环境变量（.env.development）

```bash
# 必填：GitHub OAuth App Client ID
VITE_GITHUB_CLIENT_ID=your_github_client_id_here

# 可选：GitHub 仓库名称（默认 jisuye-ext-data）
VITE_GITHUB_REPO_NAME=jisuye-ext-data

# 开发模式配置
VITE_DEV_MODE=true
VITE_DEV_DATA_PATH=./dev-data
```

### 生产环境变量（通过 GitHub Secrets）

生产环境不需要 `.env.production` 文件，通过 GitHub Secrets 提供：

- `CLIENT_ID`: GitHub OAuth App Client ID
- `REPO_NAME`: 数据仓库名称（可选，默认 jisuye-ext-data）

**注意**：GitHub Actions 在构建时会从 Secrets 读取这些环境变量，并通过 Vite 打包到构建产物中。

## 项目结构

```
aijisuye/
├── src/                    # 源代码
│   ├── components/          # Vue 组件
│   ├── stores/             # Pinia 状态管理
│   ├── utils/              # 工具函数
│   ├── views/              # 页面组件
│   ├── router/             # Vue Router 配置
│   ├── App.vue            # 根组件
│   └── main.js            # 入口文件
├── public/                # 静态资源
├── docs/                  # 文档
├── .github/workflows/      # GitHub Actions 配置
├── 404.html              # SPA 路由回退
├── .nojekyll            # 禁用 Jekyll
└── vite.config.js        # Vite 配置
```

## 技术栈

- **前端框架**: Vue 3
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **构建工具**: Vite
- **UI 组件**: Element Plus
- **样式**: Tailwind CSS
- **部署**: GitHub Pages + GitHub Actions

## GitHub OAuth 权限说明

应用需要以下 GitHub 权限：

- `read:user` - 读取用户信息
- `user:email` - 读取用户邮箱
- `repo` - 访问和管理私有仓库（用于数据存储）

## 常见问题

### Q: 本地开发时 OAuth 回调失败怎么办？

A: 确保 `.env.development` 中的 `VITE_GITHUB_CLIENT_ID` 正确，并且 GitHub OAuth App 的回调 URL 包含 `http://localhost:5173/auth/callback`。

### Q: 部署后访问 /auth/callback 报 404？

A: 确认 `dist/404.html` 和 `dist/.nojekyll` 文件存在，并已正确部署。详细说明请参考 `docs/SPAFALLBACK-LOGIC.md`。

### Q: 如何切换到不同的 GitHub 账号？

A: 点击"退出登录"按钮，清除本地存储的 access token，然后用新账号重新登录。

### Q: 数据存储在哪里？

A:
- **开发模式**: 本地 `dev-data/` 目录
- **生产模式**: 用户的 GitHub 私有仓库 `jisuye-ext-data`

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

<template>
  <div class="oauth-debug">
    <div class="debug-container">
      <h1>GitHub OAuth 诊断工具</h1>

      <el-card class="section">
        <template #header>
          <h3>1. 环境配置检查</h3>
        </template>
        <div class="check-item">
          <span>开发模式：</span>
          <el-tag :type="isDevMode ? 'success' : 'info'">
            {{ isDevMode ? '是' : '否' }}
          </el-tag>
        </div>
        <div class="check-item">
          <span>Client ID：</span>
          <el-tag :type="clientIdValid ? 'success' : 'danger'">
            {{ clientId || '未配置' }}
          </el-tag>
          <el-text v-if="!clientIdValid" type="danger" size="small">
            ⚠️ 请在 .env.development 中配置 VITE_GITHUB_CLIENT_ID
          </el-text>
        </div>
        <div class="check-item">
          <span>回调 URL：</span>
          <code>{{ callbackUrl }}</code>
        </div>
      </el-card>

      <el-card class="section">
        <template #header>
          <h3>2. Web Crypto API 检查</h3>
        </template>
        <div class="check-item">
          <span>crypto.subtle 可用：</span>
          <el-tag :type="cryptoAvailable ? 'success' : 'danger'">
            {{ cryptoAvailable ? '是' : '否' }}
          </el-tag>
        </div>
        <div v-if="!cryptoAvailable" class="warning">
          ⚠️ 您的浏览器不支持 Web Crypto API，请使用现代浏览器
        </div>
        <el-button @click="testPKCE" type="primary" style="margin-top: 16px">
          测试 PKCE 参数生成
        </el-button>
      </el-card>

      <el-card class="section">
        <template #header>
          <h3>3. GitHub OAuth App 配置指南</h3>
        </template>
        <div class="guide">
          <h4>步骤 1：创建 GitHub OAuth App</h4>
          <ol>
            <li>访问 <a href="https://github.com/settings/developers" target="_blank">GitHub Developer Settings</a></li>
            <li>点击 "OAuth Apps" → "New OAuth App"</li>
            <li>填写以下信息：
              <ul>
                <li><strong>Application name</strong>: 任意名称（如"我的导航"）</li>
                <li><strong>Homepage URL</strong>: {{ callbackUrl.replace('/auth/callback', '') }}</li>
                <li><strong>Authorization callback URL</strong>: {{ callbackUrl }}</li>
              </ul>
            </li>
            <li>点击 "Register application"</li>
          </ol>

          <h4>步骤 2：配置环境变量</h4>
          <p>在 <code>.env.development</code> 文件中配置：</p>
          <pre>{{ configExample }}</pre>

          <h4>步骤 3：重启开发服务器</h4>
          <p>修改环境变量后需要重启：</p>
          <pre>npm run dev
# 或
pnpm dev</pre>
        </div>
      </el-card>

      <el-card class="section" v-if="pkceTestResult">
        <template #header>
          <h3>4. PKCE 测试结果</h3>
        </template>
        <div class="result-item">
          <span>Code Verifier 长度：</span>
          <el-tag type="success">{{ pkceTestResult.codeVerifierLength }} 字符</el-tag>
        </div>
        <div class="result-item">
          <span>Code Verifier 字符集：</span>
          <el-tag type="success">✓ 符合 PKCE 规范</el-tag>
        </div>
        <div class="result-item">
          <span>Code Challenge 长度：</span>
          <el-tag :type="pkceTestResult.codeChallengeLength === 43 ? 'success' : 'danger'">
            {{ pkceTestResult.codeChallengeLength }} 字符
            <span v-if="pkceTestResult.codeChallengeLength !== 43"> (应为 43)</span>
          </el-tag>
        </div>
        <div class="result-item">
          <span>Code Challenge：</span>
          <code>{{ pkceTestResult.codeChallenge }}</code>
        </div>
      </el-card>

      <div class="actions">
        <el-button @click="goHome" type="primary">返回首页</el-button>
        <el-button @click="testLogin">测试登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { generateRandomString, generateCodeChallenge } from '@/utils/crypto'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const cryptoAvailable = computed(() => {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.digest === 'function'
})

const isDevMode = computed(() => {
  return import.meta.env.VITE_DEV_MODE === 'true'
})

const clientId = computed(() => {
  return import.meta.env.VITE_GITHUB_CLIENT_ID
})

const clientIdValid = computed(() => {
  return clientId.value && clientId.value !== 'your_github_client_id'
})

const callbackUrl = computed(() => {
  return `${window.location.origin}/auth/callback`
})

const configExample = computed(() => {
  return `VITE_GITHUB_CLIENT_ID=${clientId.value || 'your_github_client_id'}
VITE_GITHUB_REPO_NAME=jisuye-ext-data
VITE_DEV_MODE=true
VITE_DEV_DATA_PATH=./dev-data`
})

const pkceTestResult = ref(null)

async function testPKCE() {
  try {
    const codeVerifier = generateRandomString(128)
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    // 验证字符集
    const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
    const invalidChars = [...codeVerifier].filter(c => !validChars.includes(c))

    if (invalidChars.length > 0) {
      ElMessage.warning(`Code Verifier 包含无效字符: ${invalidChars.join(', ')}`)
      return
    }

    pkceTestResult.value = {
      codeVerifierLength: codeVerifier.length,
      codeChallengeLength: codeChallenge.length,
      codeChallenge: codeChallenge
    }

    ElMessage.success('PKCE 参数生成测试通过')
  } catch (error) {
    console.error('[PKCE Test] Error:', error)
    ElMessage.error('PKCE 参数生成失败: ' + error.message)
  }
}

function goHome() {
  router.push('/')
}

function testLogin() {
  authStore.login()
}
</script>

<style scoped>
.oauth-debug {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40px 20px;
}

.debug-container {
  max-width: 1000px;
  margin: 0 auto;
}

.debug-container h1 {
  text-align: center;
  margin-bottom: 40px;
  color: #333;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  margin: 0;
  font-size: 18px;
}

.check-item,
.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px 0;
}

.check-item span:first-child,
.result-item span:first-child {
  font-weight: 500;
  min-width: 180px;
}

code {
  background: #f4f4f5;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.warning {
  padding: 12px;
  background: #fef0f0;
  border-left: 4px solid #f56c6c;
  border-radius: 4px;
  margin-top: 12px;
  color: #f56c6c;
}

.guide {
  line-height: 1.6;
}

.guide h4 {
  margin-top: 20px;
  margin-bottom: 12px;
  color: #333;
}

.guide ol,
.guide ul {
  margin: 0;
  padding-left: 20px;
}

.guide li {
  margin-bottom: 8px;
}

.guide strong {
  color: #409eff;
}

.guide pre {
  background: #282c34;
  color: #abb2bf;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 12px 0;
}

.guide a {
  color: #409eff;
  text-decoration: none;
}

.guide a:hover {
  text-decoration: underline;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
}
</style>

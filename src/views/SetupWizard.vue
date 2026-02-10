<template>
  <div class="setup-wizard">
    <div class="wizard-container">
      <div class="wizard-content">
        <div v-if="checking" class="checking-state">
          <el-icon class="loading-icon" :size="48"><Loading /></el-icon>
          <h2>正在检查数据仓库...</h2>
          <p>请稍候，正在检查您的 GitHub 账户中是否存在数据仓库</p>
        </div>

        <div v-else-if="repoExists" class="repo-found">
          <el-icon class="success-icon" :size="48"><CircleCheck /></el-icon>
          <h2>数据仓库已存在</h2>
          <p>您的账户中已找到数据仓库：{{ repoFullName }}</p>
          <p class="repo-info">正在为您加载数据...</p>
          <el-button type="primary" @click="goHome" :loading="loading">
            进入导航网站
          </el-button>
        </div>

        <div v-else class="setup-required">
          <el-icon class="info-icon" :size="48"><InfoFilled /></el-icon>
          <h2>欢迎使用个人导航网站</h2>
          <div class="description">
            <p>为了存储您的导航数据，我们需要在您的 GitHub 账户中创建一个私有仓库。</p>
            <ul class="info-list">
              <li>仓库名称：<strong>{{ repoName }}</strong></li>
              <li>仓库类型：<strong>私有仓库</strong></li>
              <li>数据内容：<strong>链接、分类、设置等</strong></li>
              <li>隐私保护：<strong>只有您自己可以访问</strong></li>
            </ul>
            <p class="note">
              <el-icon><Warning /></el-icon>
              这个仓库将用于存储您的个人导航数据，不会公开显示。
            </p>
          </div>

          <div class="actions">
            <el-button type="primary" @click="createRepo" :loading="creating">
              <el-icon><Plus /></el-icon>
              创建数据仓库
            </el-button>
            <el-button @click="goHome">
              稍后再说
            </el-button>
          </div>

          <el-alert
            v-if="error"
            type="error"
            :title="error"
            :closable="false"
            style="margin-top: 20px"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, CircleCheck, InfoFilled, Plus, Warning } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { createUserDataStore } from '@/utils/dataStore'

const router = useRouter()
const authStore = useAuthStore()

const checking = ref(true)
const creating = ref(false)
const loading = ref(false)
const repoExists = ref(false)
const error = ref('')

const repoName = computed(() => {
  return import.meta.env.VITE_GITHUB_REPO_NAME || 'jisuye-ext-data'
})

const repoFullName = computed(() => {
  return authStore.user ? `${authStore.user.login}/${repoName.value}` : ''
})

async function checkRepo() {
  try {
    checking.value = true
    error.value = ''

    const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)
    const exists = await dataStore.checkRepoExists()

    if (exists) {
      repoExists.value = true
      console.log('[SetupWizard] Repository found:', repoFullName.value)
    } else {
      repoExists.value = false
      console.log('[SetupWizard] Repository not found')
    }
  } catch (err) {
    console.error('[SetupWizard] Error checking repository:', err)
    error.value = '检查仓库时出错，请重试'
  } finally {
    checking.value = false
  }
}

async function createRepo() {
  try {
    creating.value = true
    error.value = ''

    const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)

    await dataStore.createRepoAndInitData()

    ElMessage.success('数据仓库创建成功！')

    // 等待一下再跳转，确保 GitHub API 完成
    setTimeout(() => {
      goHome()
    }, 1000)
  } catch (err) {
    console.error('[SetupWizard] Error creating repository:', err)
    error.value = '创建仓库失败：' + (err.message || '未知错误')
  } finally {
    creating.value = false
  }
}

function goHome() {
  loading.value = true
  router.push('/')
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    ElMessage.warning('请先登录')
    router.push('/')
    return
  }
  checkRepo()
})
</script>

<style scoped>
.setup-wizard {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.wizard-container {
  width: 100%;
  max-width: 600px;
}

.wizard-content {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.checking-state,
.repo-found,
.setup-required {
  text-align: center;
}

.loading-icon {
  color: #409eff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.success-icon {
  color: #67c23a;
  margin-bottom: 20px;
}

.info-icon {
  color: #409eff;
  margin-bottom: 20px;
}

h2 {
  font-size: 24px;
  margin: 20px 0;
  color: #333;
}

p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.repo-info {
  color: #909399;
  font-size: 14px;
}

.description {
  text-align: left;
  margin: 30px 0;
}

.info-list {
  list-style: none;
  padding: 0;
  margin: 20px 0;
}

.info-list li {
  padding: 10px 0;
  color: #555;
  border-bottom: 1px solid #eee;
}

.info-list li strong {
  color: #333;
  margin-left: 5px;
}

.note {
  background: #f4f4f5;
  padding: 12px 16px;
  border-radius: 4px;
  border-left: 4px solid #e6a23c;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e6a23c;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 30px;
}

.actions .el-button {
  min-width: 140px;
}
</style>

<template>
  <div class="callback">
    <div v-if="loading" class="loading">
      正在处理登录...
    </div>
    <div v-else-if="error" class="error">
      <h2>登录失败</h2>
      <p>{{ error }}</p>
      <el-button @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')

    if (code) {
      try {
        await authStore.handleCallback(code, state)
        router.push('/')
      } catch (e) {
        error.value = e.message
        loading.value = false
      }
    } else {
      error.value = '未收到授权码'
      loading.value = false
    }
  } catch (err) {
    console.error('Callback error:', err)
    error.value = '处理登录回调时出错'
    loading.value = false
  }
})

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.callback {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.loading, .error {
  text-align: center;
  padding: 40px;
}

.error {
  color: #F56C6C;
}

.error h2 {
  margin-bottom: 20px;
}
</style>

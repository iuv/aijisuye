<template>
  <div id="app-root">
    <div id="app-debug">
      <h3>应用调试信息</h3>
      <ul>
        <li>路由路径: {{ $route.path }}</li>
        <li>已认证: {{ authStore.isAuthenticated }}</li>
        <li>开发模式: {{ isDevMode }}</li>
        <li>用户: {{ authStore.user?.login || '未登录' }}</li>
        <li>当前组件: {{ currentComponent }}</li>
      </ul>
      <el-button type="primary" @click="goHome">返回首页</el-button>
    </div>
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { onMounted, ref } from 'vue'

const route = useRoute()
const authStore = useAuthStore()

const isDevMode = computed(() => import.meta.env.VITE_DEV_MODE === 'true')
const currentComponent = ref('unknown')

onMounted(() => {
  console.log('[Debug Page] Mounted')
  console.log('[Debug Page] Route:', route.path)
  console.log('[Debug Page] Auth:', authStore.isAuthenticated)

  // 尝试获取当前组件名称
  if (route.name) {
    currentComponent.value = route.name
  }
})

function goHome() {
  window.location.href = '/'
}
</script>

<style scoped>
#app-root {
  min-height: 100vh;
}

#app-debug {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 300px;
  background: white;
  border: 2px solid #409eff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 9999;
}

#app-debug h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #409eff;
}

#app-debug ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

#app-debug li {
  padding: 6px 0;
  border-bottom: 1px solid #eee;
  font-size: 14px;
}
</style>

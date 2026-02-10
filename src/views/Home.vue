<template>
  <div class="home">
    <header class="header">
      <h1 class="site-title">{{ settingsStore.settings.siteName }}</h1>
      <p class="site-description">{{ settingsStore.settings.siteDescription }}</p>

      <div v-if="!isDevMode" class="header-actions">
        <template v-if="authStore.isAuthenticated">
          <router-link to="/admin" class="btn">管理后台</router-link>
          <router-link to="/settings" class="btn">设置</router-link>
          <button @click="authStore.logout()" class="btn btn-logout">退出登录</button>
        </template>
        <button v-else @click="authStore.login()" class="btn btn-primary">登录</button>
      </div>

      <div v-else class="header-actions">
        <router-link to="/admin" class="btn">管理后台</router-link>
        <router-link to="/settings" class="btn">设置</router-link>
      </div>
    </header>

    <div v-if="linksStore.loading" class="loading">
      加载中...
    </div>

    <div v-else class="nav-container">
      <div v-for="category in linksStore.categories" :key="category.id" class="category">
        <h2 class="category-title">
          <i :class="category.icon"></i>
          {{ category.name }}
        </h2>
        <div class="links-grid">
          <a
            v-for="link in linksStore.links.filter(l => l.categoryId === category.id)"
            :key="link.id"
            :href="link.url"
            target="_blank"
            class="link-card"
          >
            <div class="link-content">
              <div class="link-title">{{ link.title }}</div>
              <div v-if="link.description" class="link-description">{{ link.description }}</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useLinksStore } from '@/stores/links'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'

const linksStore = useLinksStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()

// 判断是否为开发模式
const isDevMode = computed(() => {
  const devMode = import.meta.env.VITE_DEV_MODE === 'true'
  console.log('[Home] Development mode:', devMode)
  return devMode
})

onMounted(async () => {
  console.log('[Home] Component mounted')
  console.log('[Home] Auth state:', authStore.isAuthenticated)
  console.log('[Home] User:', authStore.user)

  try {
    authStore.checkAuth()
    console.log('[Home] After checkAuth - Auth state:', authStore.isAuthenticated)

    await Promise.all([
      linksStore.fetchData(),
      settingsStore.fetchSettings()
    ])

    console.log('[Home] Data loaded')
    console.log('[Home] Categories:', linksStore.categories)
    console.log('[Home] Links:', linksStore.links)
    console.log('[Home] Settings:', settingsStore.settings)
  } catch (error) {
    console.error('[Home] Failed to load data:', error)
  }
})
</script>

<style scoped>
.home {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.site-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.site-description {
  color: var(--text-color-secondary);
  font-size: 1.125rem;
}

.header-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
  transition: all 0.2s;
}

.btn:hover {
  background-color: var(--bg-color-secondary);
}

.btn-primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: var(--primary-color);
  filter: brightness(1.1);
}

.btn-logout {
  color: #f56c6c;
  border-color: #f56c6c;
}

.btn-logout:hover {
  background-color: #fef0f0;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.nav-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.category {
  width: 100%;
}

.category-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.links-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.link-card {
  display: block;
  padding: 1.25rem;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.link-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
}

.link-content {
  display: flex;
  flex-direction: column;
}

.link-title {
  color: var(--text-color);
  font-weight: 600;
  font-size: 1.125rem;
  margin-bottom: 0.5rem;
}

.link-description {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>

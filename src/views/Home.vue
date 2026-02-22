<template>
  <div class="home">
    <header class="header">
      <div class="header-left">
        <h1 class="site-title">{{ settingsStore.settings.siteName }}</h1>
        <p class="site-description">{{ settingsStore.settings.siteDescription }}</p>
      </div>

      <nav class="header-right">
        <div v-if="!isDevMode" class="nav-buttons">
          <template v-if="authStore.isAuthenticated">
            <router-link to="/admin" class="nav-link">{{ i18nStore.t('admin') }}</router-link>
            <router-link to="/settings" class="nav-link">{{ i18nStore.t('settings') }}</router-link>
            <a href="#" @click.prevent="authStore.logout()" class="nav-link nav-link-logout">{{ i18nStore.t('logout') }}</a>
          </template>
          <a v-else href="#" @click.prevent="authStore.login()" class="nav-link nav-link-login">{{ i18nStore.t('login') }}</a>
        </div>
        <div v-else class="nav-buttons">
          <router-link to="/admin" class="nav-link">{{ i18nStore.t('admin') }}</router-link>
          <router-link to="/settings" class="nav-link">{{ i18nStore.t('settings') }}</router-link>
        </div>
      </nav>
    </header>

    <!-- 搜索框 -->
    <div v-if="settingsStore.settings.showSearch && searchEngines" class="search-section">
      <div class="search-container">
        <div class="search-input-wrapper">
          <input
            v-model="searchQuery"
            @keyup.enter="performSearch"
            type="text"
            class="search-input"
            :placeholder="getSearchPlaceholder()"
          />
          <button @click="performSearch" class="search-btn">{{ i18nStore.t('search') }}</button>
        </div>
        <div class="search-engines">
          <button
            v-for="engine in searchEngines"
            :key="engine.id"
            @click="selectSearchEngine(engine.id)"
            :class="['search-engine-btn', { active: selectedSearchEngine === engine.id }]"
            :title="engine.name"
          >
            {{ engine.name }}
          </button>
        </div>
      </div>
    </div>

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

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <a href="https://github.com/iuv/aijisuye" target="_blank" class="footer-link">
          <i class="el-icon-github"></i>
          {{ i18nStore.t('sourceCode') }}
        </a>
        <span class="footer-divider">|</span>
        <span class="footer-copyright">{{ i18nStore.t('copyright') }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useLinksStore } from '@/stores/links'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useI18nStore } from '@/stores/i18n'

const linksStore = useLinksStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const i18nStore = useI18nStore()

// 搜索相关
const searchQuery = ref('')
const selectedSearchEngine = ref('google')

// 判断是否为开发模式
const isDevMode = computed(() => {
  const devMode = import.meta.env.VITE_DEV_MODE === 'true'
  console.log('[Home] Development mode:', devMode)
  return devMode
})

// 获取搜索引擎列表（带默认值）
const searchEngines = computed(() => {
  return settingsStore.settings.searchEngines || [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q={q}', icon: '🔍' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q={q}', icon: '🔎' }
  ]
})

// 获取当前选中的搜索引擎
const currentSearchEngine = computed(() => {
  const engines = searchEngines.value
  return engines.find(
    e => e.id === selectedSearchEngine.value
  ) || engines[0]
})

// 选择搜索引擎
function selectSearchEngine(engineId) {
  selectedSearchEngine.value = engineId
}

// 切换语言
function toggleLanguage() {
  i18nStore.toggleLocale()
}

// 获取搜索占位符
function getSearchPlaceholder() {
  const engine = currentSearchEngine.value
  return i18nStore.t('searchIn', { engine: engine ? engine.name : '' })
}

// 执行搜索
function performSearch() {
  if (!searchQuery.value.trim()) {
    return
  }

  const engine = currentSearchEngine.value
  if (!engine || !engine.url) {
    console.error('[Home] No search engine available')
    return
  }

  const url = engine.url.replace('{q}', encodeURIComponent(searchQuery.value))
  window.open(url, '_blank')
}

// 监听设置更新，设置默认搜索引擎
watch(() => settingsStore.settings.defaultSearchEngine, (newVal) => {
  if (newVal && !selectedSearchEngine.value) {
    selectedSearchEngine.value = newVal
  }
}, { immediate: true })

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

    // 设置默认搜索引擎
    if (settingsStore.settings.defaultSearchEngine) {
      selectedSearchEngine.value = settingsStore.settings.defaultSearchEngine
    } else {
      // 如果没有设置默认搜索引擎，使用第一个
      const firstEngine = searchEngines.value[0]
      if (firstEngine) {
        selectedSearchEngine.value = firstEngine.id
      }
    }

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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 3rem;
  gap: 2rem;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

.search-section {
  margin: 2rem 0;
}

.search-container {
  max-width: 700px;
  margin: 0 auto;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: 2px solid var(--border-color-light);
  border-radius: 12px;
  font-size: 1rem;
  background: var(--bg-color);
  color: var(--text-color);
  outline: none;
  transition: all 0.2s;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-btn {
  padding: 0.875rem 2rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover {
  background: var(--primary-color);
  filter: brightness(1.1);
}

.search-engines {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.search-engine-btn {
  padding: 0.5rem 1rem;
  border: 2px solid var(--border-color-light);
  background: var(--bg-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  color: var(--text-color);
}

.search-engine-btn:hover {
  border-color: var(--primary-color);
  background: var(--bg-color-secondary);
}

.search-engine-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: var(--text-color-secondary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
  cursor: pointer;
}

.nav-link:hover {
  color: var(--primary-color);
}

.nav-link:hover::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--primary-color);
  transition: all 0.2s;
}

.nav-link.router-link-active {
  color: var(--primary-color);
}

.nav-link-login {
  padding: 0.5rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
}

.nav-link-login:hover {
  color: white;
  filter: brightness(1.1);
}

.nav-link-login::after {
  display: none;
}

.nav-link-logout {
  color: #f56c6c;
}

.nav-link-logout:hover {
  color: #f56c6c;
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
  font-size: var(--category-font-size, 1.5rem);
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: var(--category-margin-bottom, 1.5rem);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transform: var(--category-title-scale, scale(1));
  transition: transform 0.3s ease;
}

.category-title:hover {
  transform: var(--category-title-scale, scale(1)) scale(1.05);
}

.links-grid {
  display: grid;
  grid-template-columns: var(--link-grid-columns, repeat(auto-fill, minmax(var(--link-card-min-width, 280px), 1fr)));
  gap: var(--link-grid-gap, 1rem);
}

.link-card {
  display: block;
  padding: var(--link-card-padding, 1.25rem);
  max-width: var(--link-card-max-width, none);
  background: var(--link-card-bg, var(--bg-color));
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius);
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
  backdrop-filter: var(--backdrop-filter, none);
  transform: var(--link-card-transform, translateY(0));
}

.link-card:hover {
  transform: var(--link-card-hover-transform, translateY(-4px) scale(1.02));
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
}

.link-content {
  display: flex;
  flex-direction: column;
  gap: var(--link-content-gap, 0.5rem);
}

.link-title {
  color: var(--text-color);
  font-weight: 600;
  font-size: var(--link-font-size, 1.125rem);
  margin-bottom: 0;
}

.link-description {
  color: var(--text-color-secondary);
  font-size: var(--link-description-font-size, 0.875rem);
  line-height: var(--link-description-line-height, 1.4);
}

.footer {
  margin-top: 5rem;
  padding: 2rem 0;
  border-top: 1px solid var(--border-color-light);
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  text-decoration: none;
  transition: all 0.2s;
}

.footer-link:hover {
  color: var(--primary-color);
}

.footer-divider {
  color: var(--border-color);
}

.footer-copyright {
  font-weight: 500;
}
</style>

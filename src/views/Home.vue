<template>
  <div class="home">
    <header class="header">
      <div class="header-left">
        <h1 class="site-title">{{ settingsStore.settings.siteName }}</h1>
        <p class="site-description">{{ settingsStore.settings.siteDescription }}</p>
      </div>

      <nav class="header-right">
        <!-- 同步按钮 -->
        <button
          v-if="syncStore.showSyncButton && !isDevMode"
          @click="handleSync"
          :disabled="syncStore.syncStatus === 'syncing'"
          class="sync-button"
          :class="{ 'sync-button-syncing': syncStore.syncStatus === 'syncing' }"
        >
          <span v-if="syncStore.syncStatus === 'syncing'">⏳</span>
          <span v-else>🔄</span>
          {{ syncStore.syncStatusText }}
        </button>

        <!-- 皮肤切换下拉 -->
        <div class="skin-dropdown" ref="skinDropdownRef">
          <button class="skin-trigger" @click="toggleSkinDropdown">
            <span class="skin-dot" :style="{ background: currentSkinPrimaryColor }"></span>
            <span class="skin-name">{{ currentSkinName }}</span>
            <span class="skin-arrow" :class="{ open: skinDropdownOpen }">▾</span>
          </button>
          <div v-if="skinDropdownOpen" class="skin-dropdown-menu">
            <button
              v-for="skin in skinStore.allSkins"
              :key="skin.id"
              class="skin-option"
              :class="{ active: skinStore.currentSkin === skin.id }"
              @click="selectSkin(skin.id)"
            >
              <span class="skin-dot" :style="{ background: skin.variables['--primary-color'] }"></span>
              <span>{{ skin.name }}</span>
            </button>
          </div>
        </div>

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
    <div v-if="settingsStore.settings.showSearch && searchEngines && searchEngines.length > 0" class="search-section">
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

    <div v-else class="nav-container" :style="linkSizeStyle">
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
import { onMounted, computed, ref, watch, onBeforeUnmount } from 'vue'
import { useLinksStore } from '@/stores/links'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'
import { useI18nStore } from '@/stores/i18n'
import { useSyncStore } from '@/stores/sync'
import { useSkinStore } from '@/stores/skin'

const linksStore = useLinksStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const i18nStore = useI18nStore()
const syncStore = useSyncStore()
const skinStore = useSkinStore()

// 皮肤下拉菜单
const skinDropdownOpen = ref(false)
const skinDropdownRef = ref(null)

const currentSkinName = computed(() => skinStore.currentSkinData?.name || '经典')
const currentSkinPrimaryColor = computed(() => skinStore.currentSkinData?.variables?.['--primary-color'] || '#409eff')

function toggleSkinDropdown() {
  skinDropdownOpen.value = !skinDropdownOpen.value
}

function selectSkin(skinId) {
  skinStore.applySkin(skinId)
  skinDropdownOpen.value = false
}

function handleClickOutside(event) {
  if (skinDropdownRef.value && !skinDropdownRef.value.contains(event.target)) {
    skinDropdownOpen.value = false
  }
}

// 链接显示大小
const linkSizeStyle = computed(() => {
  const size = settingsStore.settings.linkSize || 'medium'
  if (size === 'small') {
    return {
      '--link-card-padding': '0.625rem 0.75rem',
      '--link-font-size': '0.875rem',
      '--link-description-font-size': '0.75rem',
      '--link-content-gap': '0.25rem',
      '--category-font-size': '1.125rem',
      '--category-margin-bottom': '0.75rem'
    }
  }
  if (size === 'large') {
    return {
      '--link-card-padding': '2rem',
      '--link-font-size': '1.5rem',
      '--link-description-font-size': '1.0625rem',
      '--link-content-gap': '0.75rem',
      '--category-font-size': '2rem',
      '--category-margin-bottom': '2rem'
    }
  }
  return {}
})

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

// 处理同步
async function handleSync() {
  try {
    await syncStore.syncToRemote()
  } catch (error) {
    console.error('[Home] Sync failed:', error)
  }
}

// 处理页面关闭前的提示
function handleBeforeUnload(event) {
  if (syncStore.checkUnsavedChanges()) {
    event.preventDefault()
    event.returnValue = ''
    return ''
  }
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

    // 从远程加载初始数据
    await syncStore.loadFromRemote()

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
    console.log('[Home] Sync state:', syncStore.hasUnsyncedChanges)

    // 添加页面关闭事件监听
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleClickOutside)
  } catch (error) {
    console.error('[Home] Failed to load data:', error)
  }
})

onBeforeUnmount(() => {
  // 移除页面关闭事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload)
  document.removeEventListener('click', handleClickOutside)
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

.sync-button {
  padding: 0.5rem 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.sync-button:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.sync-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.sync-button-syncing {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
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

/* 皮肤下拉菜单 */
.skin-dropdown {
  position: relative;
}

.skin-trigger {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  background: var(--bg-color-secondary, #f5f7fa);
  color: var(--text-color);
  border: 1px solid var(--border-color-light);
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.skin-trigger:hover {
  border-color: var(--primary-color);
}

.skin-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skin-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skin-arrow {
  font-size: 0.75rem;
  transition: transform 0.2s;
}

.skin-arrow.open {
  transform: rotate(180deg);
}

.skin-dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 160px;
  max-height: 320px;
  overflow-y: auto;
  background: var(--bg-color, #fff);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  box-shadow: var(--shadow, 0 2px 12px rgba(0,0,0,0.1));
  z-index: 1000;
  padding: 4px 0;
}

.skin-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 1rem;
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.skin-option:hover {
  background: var(--bg-color-secondary, #f5f7fa);
}

.skin-option.active {
  color: var(--primary-color);
  font-weight: 600;
}
</style>

<template>
  <div class="settings">
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ i18nStore.t('settings') }}</h1>
      </div>

      <nav class="header-right">
        <!-- 同步按钮 -->
        <button
          v-if="syncStore.showSyncButton"
          @click="handleSync"
          :disabled="syncStore.syncStatus === 'syncing'"
          class="sync-button"
          :class="{ 'sync-button-syncing': syncStore.syncStatus === 'syncing' }"
        >
          <span v-if="syncStore.syncStatus === 'syncing'">⏳</span>
          <span v-else>🔄</span>
          {{ syncStore.syncStatusText }}
        </button>

        <div class="nav-buttons">
          <router-link to="/" class="nav-link">{{ i18nStore.t('home') }}</router-link>
          <router-link to="/admin" class="nav-link">{{ i18nStore.t('admin') }}</router-link>
        </div>
      </nav>
    </header>

    <el-form :model="settingsForm" label-width="120px">
      <el-form-item :label="i18nStore.t('siteNameLabel')">
        <el-input v-model="settingsForm.siteName" :placeholder="i18nStore.locale === 'zh-CN' ? '我的导航' : 'My Nav'" />
      </el-form-item>

      <el-form-item :label="i18nStore.t('siteDescriptionLabel')">
        <el-input v-model="settingsForm.siteDescription" :placeholder="i18nStore.locale === 'zh-CN' ? '个人收藏的实用网站导航' : 'My collection of useful websites'" />
      </el-form-item>

      <el-form-item :label="i18nStore.t('language')">
        <el-select v-model="settingsForm.language">
          <el-option :label="i18nStore.t('simpleChinese')" value="zh-CN" />
          <el-option :label="i18nStore.t('english')" value="en-US" />
        </el-select>
      </el-form-item>

      <el-form-item :label="i18nStore.t('showSearch')">
        <el-switch v-model="settingsForm.showSearch" />
      </el-form-item>

      <el-form-item :label="i18nStore.t('showCategories')">
        <el-switch v-model="settingsForm.showCategories" />
      </el-form-item>

      <el-form-item :label="i18nStore.t('showIcons')">
        <el-switch v-model="settingsForm.showIcons" />
      </el-form-item>

      <el-form-item :label="i18nStore.t('defaultSearchEngine')">
        <el-select v-model="settingsForm.defaultSearchEngine" style="width: 100%">
          <el-option
            v-for="engine in settingsForm.searchEngines"
            :key="engine.id"
            :label="engine.name"
            :value="engine.id"
          />
        </el-select>
        <div style="color: #909399; font-size: 12px; margin-top: 0.5rem;">
          {{ i18nStore.t('manageSearchEngines') }} <router-link to="/admin" style="color: var(--primary-color);">{{ i18nStore.t('admin') }}</router-link>
        </div>
      </el-form-item>

      <el-form-item :label="i18nStore.t('linkSize')">
        <el-radio-group v-model="settingsForm.linkSize">
          <el-radio-button value="small">{{ i18nStore.t('linkSizeSmall') }}</el-radio-button>
          <el-radio-button value="medium">{{ i18nStore.t('linkSizeMedium') }}</el-radio-button>
          <el-radio-button value="large">{{ i18nStore.t('linkSizeLarge') }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <!-- 皮肤选择 — 点击即生效 -->
    <div class="skin-section">
      <h2 class="skin-section-title">{{ i18nStore.t('skinLabel') }}</h2>
      <div class="skin-grid">
        <div
          v-for="skin in allSkins"
          :key="skin.id"
          class="skin-card"
          :class="{ active: skinStore.currentSkin === skin.id }"
          @click="applySkin(skin.id)"
        >
          <div class="skin-card-preview" :style="getSkinPreviewStyle(skin)">
            <div class="skin-card-preview-title" :style="{ color: skin.variables['--text-color'] }">Aa</div>
            <div class="skin-card-preview-cards">
              <span
                class="skin-card-preview-dot"
                :style="{ background: skin.variables['--primary-color'] }"
              ></span>
              <span
                class="skin-card-preview-dot"
                :style="{ background: skin.variables['--secondary-color'] || skin.variables['--primary-color'] }"
              ></span>
              <span
                class="skin-card-preview-dot"
                :style="{ background: skin.variables['--accent-color'] || skin.variables['--primary-color'] }"
              ></span>
            </div>
          </div>
          <div class="skin-card-name">
            {{ i18nStore.locale === 'zh-CN' ? skin.name : skin.nameEn }}
            <span v-if="!skin.isSystem" class="skin-card-tag">自定义</span>
          </div>
        </div>
      </div>
      <div class="skin-actions">
        <el-button size="small" @click="showCustomSkinDialog = true">
          {{ i18nStore.t('createCustomSkin') }}
        </el-button>
        <el-button
          v-if="skinStore.currentSkin && !skinStore.isDefaultSkin(skinStore.currentSkin)"
          size="small"
          type="danger"
          @click="handleDeleteCustomSkin"
        >
          {{ i18nStore.t('deleteCurrentSkin') }}
        </el-button>
      </div>
    </div>

    <div class="form-actions">
      <el-button type="primary" @click="saveSettings">保存</el-button>
      <el-button @click="goHome">返回首页</el-button>
    </div>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <a href="https://github.com/iuv/aijisuye" target="_blank" class="footer-link">
          原码库
        </a>
        <span class="footer-divider">|</span>
        <span class="footer-copyright">© 2026 jisuye.com</span>
      </div>
    </footer>

    <!-- 自定义皮肤创建对话框 -->
    <el-dialog
      v-model="showCustomSkinDialog"
      :title="i18nStore.t('createCustomSkin')"
      width="500px"
    >
      <el-form :model="customSkinForm" label-width="100px">
        <el-form-item :label="i18nStore.t('skinName')">
          <el-input v-model="customSkinForm.name" :placeholder="i18nStore.t('skinNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="i18nStore.t('baseSkin')">
          <el-select v-model="customSkinForm.baseSkinId" style="width: 100%">
            <el-option
              v-for="skin in skinStore.defaultSkinsList"
              :key="skin.id"
              :label="i18nStore.locale === 'zh-CN' ? skin.name : skin.nameEn"
              :value="skin.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="i18nStore.t('primaryColor')">
          <el-color-picker v-model="customSkinForm.variables['--primary-color']" />
        </el-form-item>
        <el-form-item :label="i18nStore.t('bgColor')">
          <el-color-picker v-model="customSkinForm.variables['--bg-color']" />
        </el-form-item>
        <el-form-item :label="i18nStore.t('textColor')">
          <el-color-picker v-model="customSkinForm.variables['--text-color']" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCustomSkinDialog = false">{{ i18nStore.t('cancel') }}</el-button>
        <el-button type="primary" @click="handleCreateCustomSkin">{{ i18nStore.t('create') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/stores/settings'
import { useSkinStore } from '@/stores/skin'
import { useI18nStore } from '@/stores/i18n'
import { useSyncStore } from '@/stores/sync'

const router = useRouter()
const settingsStore = useSettingsStore()
const skinStore = useSkinStore()
const i18nStore = useI18nStore()
const syncStore = useSyncStore()

const settingsForm = ref({
  siteName: '',
  siteDescription: '',
  language: 'zh-CN',
  showSearch: true,
  showCategories: true,
  showIcons: true,
  searchEngines: [],
  defaultSearchEngine: 'google'
})

const showCustomSkinDialog = ref(false)
const customSkinForm = ref({
  name: '',
  baseSkinId: 'default',
  variables: {
    '--primary-color': '#409eff',
    '--bg-color': '#ffffff',
    '--text-color': '#303133'
  }
})

const allSkins = computed(() => skinStore.allSkins)

function getSkinPreviewStyle(skin) {
  const v = skin.variables
  return {
    background: v['--bg-color-secondary'] || v['--bg-color'],
    borderRadius: v['--radius'] || '8px',
    borderColor: v['--border-color-light'] || v['--border-color']
  }
}

// 点击即生效
function applySkin(skinId) {
  skinStore.applySkin(skinId)
}

async function saveSettings() {
  await settingsStore.updateSettings(settingsForm.value)
  ElMessage.success(i18nStore.t('operationSuccess'))
}

// 创建自定义皮肤
async function handleCreateCustomSkin() {
  if (!customSkinForm.value.name.trim()) {
    ElMessage.warning(i18nStore.t('pleaseInputSkinName'))
    return
  }

  try {
    // 获取基础皮肤变量
    const baseSkin = skinStore.defaultSkinsList.find(s => s.id === customSkinForm.value.baseSkinId)
    const baseVariables = baseSkin ? { ...baseSkin.variables } : {}

    // 合并自定义变量
    const newSkin = {
      name: customSkinForm.value.name,
      nameEn: customSkinForm.value.name,
      variables: {
        ...baseVariables,
        ...customSkinForm.value.variables
      }
    }

    await skinStore.addCustomSkin(newSkin)
    showCustomSkinDialog.value = false

    // 重置表单
    customSkinForm.value = {
      name: '',
      baseSkinId: 'default',
      variables: {
        '--primary-color': '#409eff',
        '--bg-color': '#ffffff',
        '--text-color': '#303133'
      }
    }

    ElMessage.success(i18nStore.t('createSuccess'))
  } catch (error) {
    console.error('Failed to create custom skin:', error)
    ElMessage.error(i18nStore.t('createFailed'))
  }
}

// 删除当前选中的自定义皮肤
async function handleDeleteCustomSkin() {
  if (!skinStore.currentSkin || skinStore.isDefaultSkin(skinStore.currentSkin)) {
    return
  }

  try {
    await skinStore.deleteCustomSkin(skinStore.currentSkin)
    skinStore.applySkin('default')
    ElMessage.success(i18nStore.t('deleteSuccess'))
  } catch (error) {
    console.error('Failed to delete custom skin:', error)
    ElMessage.error(i18nStore.t('deleteFailed'))
  }
}

// 处理同步
async function handleSync() {
  try {
    await syncStore.syncToRemote()
  } catch (error) {
    console.error('[Settings] Sync failed:', error)
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

onMounted(async () => {
  // 先从GitHub仓库加载设置数据
  await settingsStore.fetchSettings()

  // 加载用户保存的皮肤（会自动判断是否需要加载自定义皮肤）
  await skinStore.loadSavedSkin()

  // 加载自定义皮肤列表（设置页面需要显示）
  await skinStore.fetchCustomSkins()

  // 将加载的设置数据赋值给表单
  settingsForm.value = { ...settingsStore.settings }

  // 添加页面关闭事件监听
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  // 移除页面关闭事件监听
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.settings {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color-light);
}

.header-left {
  flex: 1;
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
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
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

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

/* 皮肤选择区 */
.skin-section {
  margin: 2rem 0;
}

.skin-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.skin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
}

.skin-card {
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.skin-card:hover {
  transform: translateY(-2px);
}

.skin-card-preview {
  width: 100%;
  aspect-ratio: 4 / 3;
  border: 2px solid var(--border-color-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
  overflow: hidden;
}

.skin-card.active .skin-card-preview {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color);
}

.skin-card:hover .skin-card-preview {
  border-color: var(--primary-color);
}

.skin-card-preview-title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1;
}

.skin-card-preview-cards {
  display: flex;
  gap: 0.375rem;
}

.skin-card-preview-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.skin-card-name {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skin-card-tag {
  font-size: 0.625rem;
  padding: 0 0.25rem;
  border-radius: 2px;
  background: var(--primary-color);
  color: #fff;
  vertical-align: middle;
}

.skin-actions {
  margin-top: 1rem;
}

.form-actions {
  margin-top: 2rem;
}

.footer {
  margin-top: 4rem;
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

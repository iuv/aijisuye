<template>
  <div class="settings">
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ i18nStore.t('settings') }}</h1>
      </div>

      <nav class="header-right">
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

      <el-form-item :label="i18nStore.t('skinLabel')">
        <el-select v-model="selectedSkin" :placeholder="i18nStore.t('selectSkin')" style="width: 100%">
          <el-option
            v-for="skin in skinStore.skins"
            :key="skin.id"
            :label="i18nStore.locale === 'zh-CN' ? skin.name : skin.nameEn"
            :value="skin.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item :label="i18nStore.t('skinPreview')">
        <div class="skin-preview" :style="skinStyle">
          <div class="preview-header">
            <h2 class="preview-category-title">
              <i class="el-icon-star"></i>
              {{ i18nStore.t('categoryTitle') }}
            </h2>
          </div>
          <div class="preview-links-grid">
            <a href="#" class="preview-link-card">
              <div class="preview-link-content">
                <div class="preview-link-title">Google 搜索</div>
                <div class="preview-link-desc">全球最大的搜索引擎</div>
              </div>
            </a>
            <a href="#" class="preview-link-card">
              <div class="preview-link-content">
                <div class="preview-link-title">GitHub</div>
                <div class="preview-link-desc">代码托管平台</div>
              </div>
            </a>
            <a href="#" class="preview-link-card">
              <div class="preview-link-content">
                <div class="preview-link-title">Bilibili</div>
                <div class="preview-link-desc">国内知名视频网站</div>
              </div>
            </a>
            <a href="#" class="preview-link-card">
              <div class="preview-link-content">
                <div class="preview-link-title">知乎</div>
                <div class="preview-link-desc">中文问答社区</div>
              </div>
            </a>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <el-button type="primary" @click="saveSettings">保存</el-button>
    <el-button @click="goHome">返回首页</el-button>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useSettingsStore } from '@/stores/settings'
import { useSkinStore } from '@/stores/skin'
import { useI18nStore } from '@/stores/i18n'

const router = useRouter()
const settingsStore = useSettingsStore()
const skinStore = useSkinStore()
const i18nStore = useI18nStore()

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

const selectedSkin = ref('default')

const skinStyle = computed(() => {
  const skin = skinStore.skins.find(s => s.id === selectedSkin.value)
  if (!skin || !skin.variables) return {}
  return {
    ...skin.variables,
    padding: '1rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border-color)'
  }
})

onMounted(async () => {
  // 先从GitHub仓库加载设置数据
  await settingsStore.fetchSettings()

  await skinStore.fetchSkins()
  if (skinStore.skins.length > 0) {
    selectedSkin.value = skinStore.currentSkin || skinStore.skins[0].id
  }
  // 将加载的设置数据赋值给表单
  settingsForm.value = { ...settingsStore.settings }
})

async function saveSettings() {
  await settingsStore.updateSettings(settingsForm.value)
  skinStore.applySkin(selectedSkin.value)
  ElMessage.success(i18nStore.t('operationSuccess'))
}

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

.skin-preview {
  width: 100%;
  min-height: 280px;
  background: var(--bg-color-secondary, var(--bg-color));
  border-radius: var(--radius);
  padding: var(--link-card-padding, 1.5rem);
  backdrop-filter: var(--backdrop-filter, none);
}

.preview-header {
  margin-bottom: var(--category-margin-bottom, 1.5rem);
}

.preview-category-title {
  font-size: var(--category-font-size, 1.5rem);
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transform: var(--category-title-scale, scale(1));
}

.preview-links-grid {
  display: grid;
  grid-template-columns: var(--link-grid-columns, repeat(2, 1fr));
  gap: var(--link-grid-gap, 1rem);
}

.preview-link-card {
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

.preview-link-card:hover {
  transform: var(--link-card-hover-transform, translateY(-4px) scale(1.02));
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
}

.preview-link-content {
  display: flex;
  flex-direction: column;
  gap: var(--link-content-gap, 0.5rem);
}

.preview-link-title {
  color: var(--text-color);
  font-weight: 600;
  font-size: var(--link-font-size, 1.125rem);
  margin-bottom: 0;
}

.preview-link-desc {
  color: var(--text-color-secondary);
  font-size: var(--link-description-font-size, 0.875rem);
  line-height: var(--link-description-line-height, 1.4);
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

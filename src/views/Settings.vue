<template>
  <div class="settings">
    <h1>设置</h1>

    <el-form :model="settingsForm" label-width="120px">
      <el-form-item label="站点名称">
        <el-input v-model="settingsForm.siteName" placeholder="我的导航" />
      </el-form-item>

      <el-form-item label="站点描述">
        <el-input v-model="settingsForm.siteDescription" placeholder="个人收藏的实用网站导航" />
      </el-form-item>

      <el-form-item label="语言">
        <el-select v-model="settingsForm.language">
          <el-option label="简体中文" value="zh-CN" />
          <el-option label="English" value="en-US" />
        </el-select>
      </el-form-item>

      <el-form-item label="显示搜索">
        <el-switch v-model="settingsForm.showSearch" />
      </el-form-item>

      <el-form-item label="显示分类">
        <el-switch v-model="settingsForm.showCategories" />
      </el-form-item>

      <el-form-item label="显示图标">
        <el-switch v-model="settingsForm.showIcons" />
      </el-form-item>

      <el-form-item label="选择皮肤">
        <el-select v-model="selectedSkin" placeholder="选择皮肤" style="width: 100%">
          <el-option
            v-for="skin in skinStore.skins"
            :key="skin.id"
            :label="settingsForm.language === 'zh-CN' ? skin.name : skin.nameEn"
            :value="skin.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="皮肤预览">
        <div class="skin-preview" :style="skinStyle">
          <div class="preview-title">预览效果</div>
          <div class="preview-content">
            <div class="preview-card">卡片样式</div>
            <div class="preview-card">另一个卡片</div>
          </div>
        </div>
      </el-form-item>
    </el-form>

    <el-button type="primary" @click="saveSettings">保存</el-button>
    <el-button @click="goHome">返回首页</el-button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useSkinStore } from '@/stores/skin'

const router = useRouter()
const settingsStore = useSettingsStore()
const skinStore = useSkinStore()

const settingsForm = ref({
  siteName: '我的导航',
  siteDescription: '个人收藏的实用网站导航',
  language: 'zh-CN',
  showSearch: true,
  showCategories: true,
  showIcons: true
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
  await skinStore.fetchSkins()
  if (skinStore.skins.length > 0) {
    selectedSkin.value = skinStore.currentSkin || skinStore.skins[0].id
  }
  settingsForm.value = { ...settingsStore.settings }
})

async function saveSettings() {
  await settingsStore.updateSettings(settingsForm.value)
  skinStore.applySkin(selectedSkin.value)
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

.skin-preview {
  width: 100%;
  min-height: 200px;
  background-color: var(--bg-color-secondary);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.preview-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.preview-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.preview-card {
  background-color: var(--bg-color);
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius);
  padding: 1rem;
  text-align: center;
  color: var(--text-color);
  box-shadow: var(--shadow);
}
</style>

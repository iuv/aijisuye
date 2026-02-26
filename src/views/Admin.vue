<template>
  <div class="admin">
    <header class="header">
      <div class="header-left">
        <h1 class="page-title">{{ i18nStore.t('admin') }}</h1>
      </div>

      <nav class="header-right">
        <div class="nav-buttons">
          <router-link to="/" class="nav-link">{{ i18nStore.t('home') }}</router-link>
          <router-link to="/settings" class="nav-link">{{ i18nStore.t('settings') }}</router-link>
        </div>
      </nav>
    </header>

    <el-tabs v-model="activeTab">
      <!-- 分类管理 -->
      <el-tab-pane :label="i18nStore.t('categoryManagement')" name="categories">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="primary" @click="showAddCategoryDialog">{{ i18nStore.t('addCategory') }}</el-button>
          </div>

          <el-table :data="linksStore.categories" style="width: 100%">
            <el-table-column prop="name" :label="i18nStore.t('name')" width="200" />
            <el-table-column prop="icon" :label="i18nStore.t('icon')" width="200" />
            <el-table-column prop="order" :label="i18nStore.t('order')" width="100" />
            <el-table-column :label="i18nStore.t('actions')" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="editCategory(row)">{{ i18nStore.t('edit') }}</el-button>
                <el-button size="small" type="danger" @click="deleteCategory(row.id)">{{ i18nStore.t('delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 链接管理 -->
      <el-tab-pane :label="i18nStore.t('linkManagement')" name="links">
        <div class="tab-content">
          <div class="toolbar">
            <el-select v-model="filterCategory" :placeholder="i18nStore.t('selectCategory')" clearable style="width: 200px; margin-right: 10px">
              <el-option
                v-for="cat in linksStore.categories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
            <el-button type="primary" @click="showAddLinkDialog">{{ i18nStore.t('addLink') }}</el-button>
          </div>

          <el-table :data="filteredLinks" style="width: 100%">
            <el-table-column prop="title" :label="i18nStore.t('title')" width="200" />
            <el-table-column prop="url" :label="i18nStore.t('url')" min-width="200" show-overflow-tooltip />
            <el-table-column prop="description" :label="i18nStore.t('description')" min-width="200" show-overflow-tooltip />
            <el-table-column prop="categoryId" :label="i18nStore.t('categoryManagement')" width="150">
              <template #default="{ row }">
                {{ getCategoryName(row.categoryId) }}
              </template>
            </el-table-column>
            <el-table-column prop="order" :label="i18nStore.t('order')" width="100" />
            <el-table-column :label="i18nStore.t('actions')" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="editLink(row)">{{ i18nStore.t('edit') }}</el-button>
                <el-button size="small" type="danger" @click="deleteLink(row.id)">{{ i18nStore.t('delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 搜索引擎管理 -->
      <el-tab-pane :label="i18nStore.t('searchEngines')" name="searchEngines">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="primary" @click="showAddSearchEngineDialog">{{ i18nStore.t('addSearchEngine') }}</el-button>
          </div>

          <el-table :data="settingsStore.settings.searchEngines" style="width: 100%">
            <el-table-column prop="icon" :label="i18nStore.t('icon')" width="80" />
            <el-table-column prop="name" :label="i18nStore.t('name')" width="150" />
            <el-table-column prop="url" :label="i18nStore.t('urlTemplate')" min-width="300" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.url }}<span style="color: #909399; margin-left: 10px;">{{ i18nStore.t('urlPlaceholder') }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="i18nStore.t('actions')" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="editSearchEngine(row)">{{ i18nStore.t('edit') }}</el-button>
                <el-button size="small" type="danger" @click="deleteSearchEngine(row.id)">{{ i18nStore.t('delete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 皮肤管理 -->
      <el-tab-pane :label="i18nStore.t('skinManagement')" name="skins">
        <div class="tab-content">
          <el-alert
            :title="i18nStore.t('skinPreview')"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            {{ i18nStore.t('clickToPreview') }}
          </el-alert>

          <div class="skins-grid">
            <div
              v-for="skin in skinStore.skins"
              :key="skin.id"
              @click="previewSkin(skin.id)"
              :class="['skin-card', { active: skinStore.currentSkin === skin.id, system: skin.isSystem }]"
            >
              <div class="skin-card-header">
                <h3 class="skin-name">{{ i18nStore.locale === 'zh-CN' ? skin.name : skin.nameEn }}</h3>
                <el-tag v-if="skin.isSystem" size="small" type="info">System</el-tag>
                <el-tag v-if="skin.isDefault" size="small" type="success">{{ i18nStore.t('current') }}</el-tag>
              </div>
              <div class="skin-card-preview" :style="getSkinPreviewStyle(skin)">
                <div class="preview-category">
                  <i class="el-icon-star"></i>
                  {{ i18nStore.t('categoryTitle') }}
                </div>
                <div class="preview-links">
                  <div class="preview-item">{{ i18nStore.t('previewLink1') }}</div>
                  <div class="preview-item">{{ i18nStore.t('previewLink2') }}</div>
                </div>
              </div>
              <div v-if="skinStore.currentSkin === skin.id" class="skin-card-current">{{ i18nStore.t('current') }}</div>
            </div>
          </div>

          <div class="skins-actions">
            <el-button @click="resetToDefaultSkin" type="warning">{{ i18nStore.t('resetToDefault') }}</el-button>
            <el-button @click="applyCurrentSkin" type="primary">{{ i18nStore.t('applySkin') }}</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 数据导出 -->
      <el-tab-pane label="数据导出" name="export">
        <div class="tab-content">
          <el-alert
            title="开发模式说明"
            type="info"
            :closable="false"
            style="margin-bottom: 20px"
          >
            在开发模式下，数据修改仅保存在内存中，刷新页面会重置。使用导出功能可以将数据保存为文件，然后手动更新到 dev-data 目录。
          </el-alert>

          <div class="export-buttons">
            <el-button type="primary" @click="exportData">导出所有数据</el-button>
          </div>

          <div v-if="exportedData" class="export-result">
            <h3>导出结果</h3>
            <p>复制以下内容并保存到对应的文件中：</p>
            <el-tabs>
              <el-tab-pane label="categories.json" name="categories">
                <el-input
                  type="textarea"
                  :rows="10"
                  :model-value="JSON.stringify(exportedData.categories, null, 2)"
                  readonly
                />
              </el-tab-pane>
              <el-tab-pane label="links.json" name="links">
                <el-input
                  type="textarea"
                  :rows="10"
                  :model-value="JSON.stringify(exportedData.links, null, 2)"
                  readonly
                />
              </el-tab-pane>
              <el-tab-pane label="settings.json" name="settings">
                <el-input
                  type="textarea"
                  :rows="10"
                  :model-value="JSON.stringify(exportedData.settings, null, 2)"
                  readonly
                />
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog v-model="categoryDialogVisible" :title="categoryDialogTitle" width="500px">
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item :label="i18nStore.t('name')">
          <el-input v-model="categoryForm.name" :placeholder="i18nStore.t('categoryNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="i18nStore.t('icon')">
          <el-input v-model="categoryForm.icon" :placeholder="i18nStore.t('categoryIconPlaceholder')" />
        </el-form-item>
        <el-form-item :label="i18nStore.t('order')">
          <el-input-number v-model="categoryForm.order" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">{{ i18nStore.t('cancel') }}</el-button>
        <el-button type="primary" @click="saveCategory">{{ i18nStore.t('confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑链接对话框 -->
    <el-dialog v-model="linkDialogVisible" :title="linkDialogTitle" width="600px">
      <el-form :model="linkForm" label-width="80px">
        <el-form-item label="URL">
          <el-input
            v-model="linkForm.url"
            placeholder="example.com 或 https://example.com"
            @blur="onUrlBlur"
            clearable
          />
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
            <el-button
              size="small"
              :loading="fetchingUrlInfo"
              @click="fetchUrlInfo"
              :disabled="!linkForm.url"
            >
              {{ fetchingUrlInfo ? i18nStore.t('fetching') : i18nStore.t('autoFetch') }}
            </el-button>
            <span style="color: #909399; font-size: 12px;">{{ i18nStore.t('urlAutoComplete') }}</span>
          </div>
        </el-form-item>
        <el-form-item :label="i18nStore.t('title')">
          <el-input v-model="linkForm.title" :placeholder="i18nStore.t('linkTitlePlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="i18nStore.t('description')">
          <el-input
            v-model="linkForm.description"
            type="textarea"
            :rows="2"
            :placeholder="i18nStore.t('linkDescriptionPlaceholder')"
          />
        </el-form-item>
        <el-form-item :label="i18nStore.t('categoryManagement')">
          <el-select v-model="linkForm.categoryId" :placeholder="i18nStore.t('selectCategory')" style="width: 100%">
            <el-option
              v-for="cat in linksStore.categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="i18nStore.t('order')">
          <el-input-number v-model="linkForm.order" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogVisible = false">{{ i18nStore.t('cancel') }}</el-button>
        <el-button type="primary" @click="saveLink">{{ i18nStore.t('confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑搜索引擎对话框 -->
    <el-dialog v-model="searchEngineDialogVisible" :title="searchEngineDialogTitle" width="500px">
      <el-form :model="searchEngineForm" label-width="100px">
        <el-form-item :label="i18nStore.t('searchEngines')">
          <el-input v-model="searchEngineForm.name" :placeholder="i18nStore.t('engineNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="i18nStore.t('icon')">
          <el-input v-model="searchEngineForm.icon" :placeholder="i18nStore.t('engineIconPlaceholder')" />
        </el-form-item>
        <el-form-item :label="i18nStore.t('urlTemplate')">
          <el-input v-model="searchEngineForm.url" placeholder="如：https://www.google.com/search?q=" />
          <span style="color: #909399; font-size: 12px;">{{ i18nStore.t('urlTemplateExample') }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="searchEngineDialogVisible = false">{{ i18nStore.t('cancel') }}</el-button>
        <el-button type="primary" @click="saveSearchEngine">{{ i18nStore.t('confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-content">
        <a href="https://github.com/iuv/aijisuye" target="_blank" class="footer-link">
          {{ i18nStore.t('sourceCode') }}
        </a>
        <span class="footer-divider">|</span>
        <span class="footer-copyright">{{ i18nStore.t('copyright') }}</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLinksStore } from '@/stores/links'
import { useSettingsStore } from '@/stores/settings'
import { useSkinStore } from '@/stores/skin'
import { useI18nStore } from '@/stores/i18n'

const router = useRouter()
const linksStore = useLinksStore()
const settingsStore = useSettingsStore()
const skinStore = useSkinStore()
const i18nStore = useI18nStore()

// 标签页
const activeTab = ref('categories')

// 组件挂载时加载设置数据
onMounted(async () => {
  // 确保从GitHub仓库加载设置数据
  await settingsStore.fetchSettings()
  await skinStore.fetchSkins()
})

// 过滤分类
const filterCategory = ref('')

// 分类对话框
const categoryDialogVisible = ref(false)
const categoryForm = reactive({
  id: '',
  name: '',
  icon: 'el-icon-star',
  order: 1
})
const isEditingCategory = ref(false)
const categoryDialogTitle = computed(() => isEditingCategory.value ? '编辑分类' : '添加分类')

// 链接对话框
const linkDialogVisible = ref(false)
const linkForm = reactive({
  id: '',
  title: '',
  url: '',
  description: '',
  categoryId: '',
  order: 1
})
const isEditingLink = ref(false)
const linkDialogTitle = computed(() => isEditingLink.value ? '编辑链接' : '添加链接')

// 导出数据
const exportedData = ref(null)

// 搜索引擎对话框
const searchEngineDialogVisible = ref(false)
const searchEngineForm = reactive({
  id: '',
  name: '',
  icon: '🔍',
  url: ''
})
const isEditingSearchEngine = ref(false)
const searchEngineDialogTitle = computed(() => isEditingSearchEngine.value ? '编辑搜索引擎' : '添加搜索引擎')

// 过滤后的链接
const filteredLinks = computed(() => {
  if (!filterCategory.value) {
    return linksStore.links
  }
  return linksStore.links.filter(l => l.categoryId === filterCategory.value)
})

// 获取分类名称
function getCategoryName(categoryId) {
  const cat = linksStore.categories.find(c => c.id === categoryId)
  return cat ? cat.name : '-'
}

// 显示添加分类对话框
function showAddCategoryDialog() {
  Object.assign(categoryForm, {
    id: '',
    name: '',
    icon: 'el-icon-star',
    order: 1
  })
  isEditingCategory.value = false
  categoryDialogVisible.value = true
}

// 编辑分类
function editCategory(category) {
  Object.assign(categoryForm, category)
  isEditingCategory.value = true
  categoryDialogVisible.value = true
}

// 保存分类
async function saveCategory() {
  if (!categoryForm.name.trim()) {
    ElMessage.warning('请输入分类名称')
    return
  }

  try {
    if (isEditingCategory.value) {
      await linksStore.updateCategory(categoryForm.id, {
        name: categoryForm.name,
        icon: categoryForm.icon,
        order: categoryForm.order
      })
      ElMessage.success('分类已更新')
    } else {
      await linksStore.addCategory(categoryForm)
      ElMessage.success('分类已添加')
    }
    categoryDialogVisible.value = false
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

// 删除分类
async function deleteCategory(categoryId) {
  try {
    await ElMessageBox.confirm('确定要删除这个分类吗？分类下的所有链接也会被删除。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await linksStore.deleteCategory(categoryId)
    ElMessage.success('分类已删除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + error.message)
    }
  }
}

// 获取网站信息的状态
const fetchingUrlInfo = ref(false)

// URL输入框失焦时自动补全协议
function onUrlBlur() {
  if (!linkForm.url) return

  let url = linkForm.url.trim()
  // 自动补全 https://（如果URL不包含协议且不是以/开头）
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    linkForm.url = 'https://' + url
  }
}

// 从URL中提取域名作为标题
function extractDomainName(url) {
  try {
    const urlObj = new URL(url)
    // 移除www.前缀并提取域名
    let domain = urlObj.hostname.replace(/^www\./, '')
    // 首字母大写
    return domain.charAt(0).toUpperCase() + domain.slice(1)
  } catch {
    return ''
  }
}

// 获取网站信息
async function fetchUrlInfo() {
  if (!linkForm.url) return

  let url = linkForm.url.trim()
  // 自动补全协议
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = 'https://' + url
    linkForm.url = url
  }

  fetchingUrlInfo.value = true

  try {
    // 如果标题为空，从URL提取域名作为标题
    if (!linkForm.title) {
      const domainName = extractDomainName(url)
      if (domainName) {
        linkForm.title = domainName
        ElMessage.success(i18nStore.t('urlInfoFetched'))
      }
    }

    // 尝试获取网页的meta信息（可能会因CORS失败）
    try {
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      })

      if (response.ok) {
        const html = await response.text()
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')

        // 提取标题
        const title = doc.querySelector('title')?.textContent?.trim()
        if (title && !linkForm.title) {
          linkForm.title = title
        }

        // 提取描述
        const description = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim()
        if (description && !linkForm.description) {
          linkForm.description = description
        }

        ElMessage.success(i18nStore.t('urlInfoFetched'))
      }
    } catch (corsError) {
      // CORS错误是正常的，不影响用户体验
      console.log('[Admin] CORS error while fetching URL info (this is normal):', corsError.message)
      // 如果已经从域名提取了标题，不显示错误
      if (linkForm.title) {
        // 已经成功提取，不需要额外提示
      } else {
        ElMessage.info(i18nStore.t('urlInfoPartial'))
      }
    }
  } catch (error) {
    console.error('[Admin] Error fetching URL info:', error)
    ElMessage.warning(i18nStore.t('urlInfoFailed'))
  } finally {
    fetchingUrlInfo.value = false
  }
}

// 显示添加链接对话框
function showAddLinkDialog() {
  Object.assign(linkForm, {
    id: '',
    title: '',
    url: '',
    description: '',
    categoryId: linksStore.categories.length > 0 ? linksStore.categories[0].id : '',
    order: 1
  })
  isEditingLink.value = false
  linkDialogVisible.value = true
}

// 编辑链接
function editLink(link) {
  Object.assign(linkForm, link)
  isEditingLink.value = true
  linkDialogVisible.value = true
}

// 保存链接
async function saveLink() {
  if (!linkForm.title.trim()) {
    ElMessage.warning('请输入链接标题')
    return
  }
  if (!linkForm.url.trim()) {
    ElMessage.warning('请输入链接URL')
    return
  }

  // 确保URL有协议
  let url = linkForm.url.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    url = 'https://' + url
  }

  try {
    if (isEditingLink.value) {
      await linksStore.updateLink(linkForm.id, {
        title: linkForm.title,
        url: url,
        description: linkForm.description,
        categoryId: linkForm.categoryId,
        order: linkForm.order
      })
      ElMessage.success('链接已更新')
    } else {
      await linksStore.addLink({
        ...linkForm,
        url: url
      })
      ElMessage.success('链接已添加')
    }
    linkDialogVisible.value = false
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

// 删除链接
async function deleteLink(linkId) {
  try {
    await ElMessageBox.confirm('确定要删除这个链接吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await linksStore.deleteLink(linkId)
    ElMessage.success('链接已删除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + error.message)
    }
  }
}

// 导出数据
function exportData() {
  exportedData.value = {
    categories: linksStore.categories,
    links: linksStore.links,
    settings: settingsStore.settings
  }
  ElMessage.success('数据已导出，请复制下方内容')
}

// 显示添加搜索引擎对话框
function showAddSearchEngineDialog() {
  Object.assign(searchEngineForm, {
    id: '',
    name: '',
    icon: '🔍',
    url: ''
  })
  isEditingSearchEngine.value = false
  searchEngineDialogVisible.value = true
}

// 编辑搜索引擎
function editSearchEngine(engine) {
  Object.assign(searchEngineForm, engine)
  isEditingSearchEngine.value = true
  searchEngineDialogVisible.value = true
}

// 保存搜索引擎
async function saveSearchEngine() {
  if (!searchEngineForm.name.trim()) {
    ElMessage.warning('请输入搜索引擎名称')
    return
  }
  if (!searchEngineForm.url.trim()) {
    ElMessage.warning('请输入URL模板')
    return
  }

  try {
    const engines = [...settingsStore.settings.searchEngines]
    if (isEditingSearchEngine.value) {
      const index = engines.findIndex(e => e.id === searchEngineForm.id)
      if (index !== -1) {
        engines[index] = { ...searchEngineForm }
      }
      ElMessage.success('搜索引擎已更新')
    } else {
      engines.push({
        ...searchEngineForm,
        id: 'engine_' + Date.now()
      })
      ElMessage.success('搜索引擎已添加')
    }
    await settingsStore.updateSettings({ searchEngines: engines })
    searchEngineDialogVisible.value = false
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  }
}

// 删除搜索引擎
async function deleteSearchEngine(engineId) {
  const engines = settingsStore.settings.searchEngines
  if (engines.length <= 1) {
    ElMessage.warning('至少保留一个搜索引擎')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除这个搜索引擎吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const newEngines = engines.filter(e => e.id !== engineId)
    if (settingsStore.settings.defaultSearchEngine === engineId) {
      settingsStore.settings.defaultSearchEngine = newEngines[0].id
    }
    await settingsStore.updateSettings({ searchEngines: newEngines })
    ElMessage.success('搜索引擎已删除')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败: ' + error.message)
    }
  }
}

// 返回首页
function goHome() {
  router.push('/')
}

// 皮肤管理
function getSkinPreviewStyle(skin) {
  return {
    '--primary-color': skin.variables['--primary-color'],
    '--secondary-color': skin.variables['--secondary-color'],
    '--accent-color': skin.variables['--accent-color'],
    '--bg-color': skin.variables['--bg-color'],
    '--bg-color-secondary': skin.variables['--bg-color-secondary'],
    '--text-color': skin.variables['--text-color'],
    '--text-color-secondary': skin.variables['--text-color-secondary'],
    '--text-color-placeholder': skin.variables['--text-color-placeholder'],
    '--border-color': skin.variables['--border-color'],
    '--border-color-light': skin.variables['--border-color-light'],
    '--shadow': skin.variables['--shadow'],
    '--shadow-hover': skin.variables['--shadow-hover'],
    '--radius': skin.variables['--radius'],
    '--link-card-transform': skin.variables['--link-card-transform'] || 'translateY(0)',
    '--link-card-bg': skin.variables['--link-card-bg'] || 'var(--bg-color)',
    '--category-title-scale': skin.variables['--category-title-scale'] || 'scale(1)',
    '--backdrop-filter': skin.variables['--backdrop-filter'] || 'none',
    '--link-grid-columns': skin.variables['--link-grid-columns'] || 'repeat(auto-fill, minmax(280px, 1fr))',
    '--link-grid-gap': skin.variables['--link-grid-gap'] || '1rem',
    '--link-card-padding': skin.variables['--link-card-padding'] || '1.25rem',
    '--link-font-size': skin.variables['--link-font-size'] || '1.125rem',
    '--link-description-font-size': skin.variables['--link-description-font-size'] || '0.875rem',
    '--link-content-gap': skin.variables['--link-content-gap'] || '0.5rem',
    '--category-font-size': skin.variables['--category-font-size'] || '1.5rem',
    '--category-margin-bottom': skin.variables['--category-margin-bottom'] || '1.5rem',
    '--link-card-max-width': skin.variables['--link-card-max-width'] || 'none',
    '--link-card-hover-transform': skin.variables['--link-card-hover-transform'] || 'translateY(-4px) scale(1.02)',
    '--link-description-line-height': skin.variables['--link-description-line-height'] || '1.4'
  }
}

function previewSkin(skinId) {
  skinStore.applySkin(skinId)
  ElMessage.success(`已预览 "${skinStore.skins.find(s => s.id === skinId)?.name || skinId}" 皮肤`)
}

function resetToDefaultSkin() {
  const defaultSkin = skinStore.skins.find(s => s.isDefault)
  if (defaultSkin) {
    skinStore.applySkin(defaultSkin.id)
    ElMessage.success('已恢复默认皮肤')
  }
}

function applyCurrentSkin() {
  skinStore.applySkin(skinStore.currentSkin)
  ElMessage.success('当前皮肤已应用')
}
</script>

<style scoped>
.admin {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
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

.tab-content {
  padding: 20px 0;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.export-buttons {
  margin: 20px 0;
}

.export-result {
  margin-top: 20px;
  padding: 20px;
  background: var(--bg-color-secondary);
  border-radius: var(--radius);
}

.export-result h3 {
  margin-top: 0;
  color: var(--text-color);
}

.export-result p {
  color: var(--text-color-secondary);
}

.skins-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}

.skin-card {
  position: relative;
  border: 2px solid var(--border-color-light);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.skin-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
}

.skin-card.active {
  border-color: var(--primary-color);
  border-width: 3px;
}

.skin-card.system {
  border-color: var(--accent-color);
}

.skin-card-header {
  padding: 1rem;
  background: var(--bg-color-secondary);
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.skin-name {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.skin-card-preview {
  padding: var(--link-card-padding, 1.5rem);
  min-height: 200px;
}

.preview-category {
  font-size: var(--category-font-size, 1.5rem);
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: var(--category-margin-bottom, 1rem);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transform: var(--category-title-scale, scale(1));
  transition: transform 0.3s ease;
}

.preview-links {
  display: grid;
  grid-template-columns: var(--link-grid-columns, repeat(2, 1fr));
  gap: var(--link-grid-gap, 0.75rem);
}

.preview-item {
  background: var(--link-card-bg, var(--bg-color));
  border: 1px solid var(--border-color-light);
  border-radius: var(--radius);
  padding: var(--link-card-padding, 0.875rem);
  max-width: var(--link-card-max-width, none);
  color: var(--text-color);
  text-align: center;
  font-size: var(--link-font-size, 0.875rem);
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  backdrop-filter: var(--backdrop-filter, none);
  transform: var(--link-card-transform, translateY(0));
}

.preview-item:hover {
  transform: var(--link-card-hover-transform, translateY(-4px) scale(1.02));
  box-shadow: var(--shadow-hover);
  border-color: var(--primary-color);
}

.skin-card-current {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  padding: 0.375rem 0.75rem;
  background: var(--primary-color);
  color: white;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.skins-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
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

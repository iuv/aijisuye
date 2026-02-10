<template>
  <div class="admin">
    <div class="admin-header">
      <h1>管理后台</h1>
      <el-button @click="goHome" type="info">返回首页</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <!-- 分类管理 -->
      <el-tab-pane label="分类管理" name="categories">
        <div class="tab-content">
          <div class="toolbar">
            <el-button type="primary" @click="showAddCategoryDialog">添加分类</el-button>
          </div>

          <el-table :data="linksStore.categories" style="width: 100%">
            <el-table-column prop="name" label="名称" width="200" />
            <el-table-column prop="icon" label="图标" width="200" />
            <el-table-column prop="order" label="排序" width="100" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="editCategory(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteCategory(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 链接管理 -->
      <el-tab-pane label="链接管理" name="links">
        <div class="tab-content">
          <div class="toolbar">
            <el-select v-model="filterCategory" placeholder="选择分类" clearable style="width: 200px; margin-right: 10px">
              <el-option
                v-for="cat in linksStore.categories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
            <el-button type="primary" @click="showAddLinkDialog">添加链接</el-button>
          </div>

          <el-table :data="filteredLinks" style="width: 100%">
            <el-table-column prop="title" label="标题" width="200" />
            <el-table-column prop="url" label="URL" min-width="200" show-overflow-tooltip />
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="categoryId" label="分类" width="150">
              <template #default="{ row }">
                {{ getCategoryName(row.categoryId) }}
              </template>
            </el-table-column>
            <el-table-column prop="order" label="排序" width="100" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="editLink(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteLink(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
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
        <el-form-item label="名称">
          <el-input v-model="categoryForm.name" placeholder="分类名称" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="categoryForm.icon" placeholder="el-icon-tools" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="categoryForm.order" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="categoryDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑链接对话框 -->
    <el-dialog v-model="linkDialogVisible" :title="linkDialogTitle" width="600px">
      <el-form :model="linkForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="linkForm.title" placeholder="网站标题" />
        </el-form-item>
        <el-form-item label="URL">
          <el-input v-model="linkForm.url" placeholder="https://example.com" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="linkForm.description"
            type="textarea"
            :rows="2"
            placeholder="网站描述"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="linkForm.categoryId" placeholder="选择分类" style="width: 100%">
            <el-option
              v-for="cat in linksStore.categories"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="linkForm.order" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="linkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLink">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLinksStore } from '@/stores/links'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const linksStore = useLinksStore()
const settingsStore = useSettingsStore()

// 标签页
const activeTab = ref('categories')

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

  try {
    if (isEditingLink.value) {
      await linksStore.updateLink(linkForm.id, {
        title: linkForm.title,
        url: linkForm.url,
        description: linkForm.description,
        categoryId: linkForm.categoryId,
        order: linkForm.order
      })
      ElMessage.success('链接已更新')
    } else {
      await linksStore.addLink(linkForm)
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

// 返回首页
function goHome() {
  router.push('/')
}
</script>

<style scoped>
.admin {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-header h1 {
  margin: 0;
  font-size: 24px;
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
</style>

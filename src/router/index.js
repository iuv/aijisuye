import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createUserDataStore } from '@/utils/dataStore'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/auth/callback',
    name: 'callback',
    component: () => import('../views/Callback.vue')
  },
  {
    path: '/debug',
    name: 'debug',
    component: () => import('../views/Debug.vue')
  },
  {
    path: '/oauth-debug',
    name: 'oauth-debug',
    component: () => import('../views/OAuthDebug.vue')
  },
  {
    path: '/setup',
    name: 'setup',
    component: () => import('../views/SetupWizard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/Admin.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 恢复从 404.html 保存的路径信息
function restoreFallbackPath() {
  const fallbackPath = sessionStorage.getItem('spa_fallback_path')
  const fallbackSearch = sessionStorage.getItem('spa_fallback_search')
  const fallbackHash = sessionStorage.getItem('spa_fallback_hash')

  if (fallbackPath && fallbackPath !== '/') {
    console.log('[Router] Restoring fallback path:', fallbackPath + fallbackSearch)

    // 清除保存的回退信息
    sessionStorage.removeItem('spa_fallback_path')
    sessionStorage.removeItem('spa_fallback_search')
    sessionStorage.removeItem('spa_fallback_hash')

    // 返回完整路径，让 Vue Router 处理
    return fallbackPath + fallbackSearch + fallbackHash
  }
  return null
}

router.beforeEach(async (to, from, next) => {
  // 首次导航时，检查是否需要恢复回退路径
  if (from.name === undefined && to.path === '/') {
    const fallbackPath = restoreFallbackPath()
    if (fallbackPath) {
      // 使用 Vue Router 的客户端路由跳转，而不是 window.location
      // 避免再次请求服务器导致 404 循环
      next(fallbackPath)
      return
    }
  }

  const authStore = useAuthStore()
  const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

  // 开发模式下允许访问所有路由
  if (isDevMode) {
    next()
    return
  }

  // 生产模式下检查认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/')
    return
  }

  // 如果已登录且不是在设置向导页面，检查是否需要设置仓库
  if (authStore.isAuthenticated && to.path !== '/setup') {
    // 检查是否已经标记为已检查过仓库
    const repoChecked = sessionStorage.getItem('repo_checked')

    if (!repoChecked) {
      try {
        const dataStore = createUserDataStore(authStore.accessToken, authStore.user?.login)
        const exists = await dataStore.checkRepoExists()

        if (!exists) {
          // 仓库不存在，跳转到设置向导
          next('/setup')
          return
        } else {
          // 仓库已存在，标记为已检查
          sessionStorage.setItem('repo_checked', 'true')
        }
      } catch (error) {
        console.error('[Router] Error checking repository:', error)
        // 出错时不跳转，继续访问
      }
    }
  }

  next()
})

export default router

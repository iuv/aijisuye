import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSettingsStore } from './settings'
import { useLinksStore } from './links'
import { useSkinStore } from './skin'

export const useSyncStore = defineStore('sync', {
  state: () => ({
    // 是否有未同步的数据
    hasUnsyncedChanges: false,
    
    // 上次同步时间
    lastSyncTime: null,
    
    // 同步状态：idle, syncing, error
    syncStatus: 'idle',
    
    // 同步错误信息
    syncError: null,
    
    // 定时器ID
    syncTimerId: null,
    
    // 自动同步间隔（5分钟）
    autoSyncInterval: 5 * 60 * 1000,
    
    // 是否已初始化
    initialized: false
  }),

  getters: {
    // 是否需要显示同步按钮
    showSyncButton: (state) => {
      return state.hasUnsyncedChanges || state.syncStatus === 'syncing'
    },
    
    // 同步状态文本
    syncStatusText: (state) => {
      switch (state.syncStatus) {
        case 'syncing':
          return '同步中...'
        case 'error':
          return '同步失败'
        case 'idle':
        default:
          return state.hasUnsyncedChanges ? '有未同步的更改' : '已同步'
      }
    }
  },

  actions: {
    // 标记数据已修改
    markAsModified() {
      this.hasUnsyncedChanges = true
      this.startAutoSync()
    },
    
    // 标记已同步
    markAsSynced() {
      this.hasUnsyncedChanges = false
      this.lastSyncTime = new Date().toISOString()
      this.syncStatus = 'idle'
      this.syncError = null
      this.stopAutoSync()
    },
    
    // 开始自动同步定时器
    startAutoSync() {
      // 如果已经有定时器，先清除
      if (this.syncTimerId) {
        return
      }
      
      console.log('[Sync] Starting auto-sync timer')
      this.syncTimerId = setInterval(async () => {
        console.log('[Sync] Auto-sync triggered')
        if (this.hasUnsyncedChanges) {
          await this.syncToRemote()
        }
      }, this.autoSyncInterval)
    },
    
    // 停止自动同步定时器
    stopAutoSync() {
      if (this.syncTimerId) {
        console.log('[Sync] Stopping auto-sync timer')
        clearInterval(this.syncTimerId)
        this.syncTimerId = null
      }
    },
    
    // 同步到远程仓库
    async syncToRemote() {
      if (this.syncStatus === 'syncing') {
        console.log('[Sync] Already syncing, skip')
        return
      }
      
      console.log('[Sync] Starting sync to remote')
      this.syncStatus = 'syncing'
      this.syncError = null
      
      try {
        const settingsStore = useSettingsStore()
        const linksStore = useLinksStore()
        const skinStore = useSkinStore()
        
        // 同步设置
        await settingsStore.syncToRemote()
        
        // 同步链接数据
        await linksStore.syncToRemote()
        
        // 同步皮肤数据
        await skinStore.syncToRemote()
        
        this.markAsSynced()
        console.log('[Sync] Sync completed successfully')
        
        return true
      } catch (error) {
        console.error('[Sync] Sync failed:', error)
        this.syncStatus = 'error'
        this.syncError = error.message
        throw error
      }
    },
    
    // 从远程加载初始数据
    async loadFromRemote() {
      console.log('[Sync] Loading data from remote')
      
      try {
        const settingsStore = useSettingsStore()
        const linksStore = useLinksStore()
        const skinStore = useSkinStore()
        
        // 并行加载所有数据
        await Promise.all([
          settingsStore.fetchSettings(),
          linksStore.fetchData(),
          skinStore.fetchSkins()
        ])
        
        this.lastSyncTime = new Date().toISOString()
        this.initialized = true
        console.log('[Sync] Data loaded successfully')
        
        return true
      } catch (error) {
        console.error('[Sync] Failed to load data:', error)
        throw error
      }
    },
    
    // 检查是否有未保存的更改
    checkUnsavedChanges() {
      return this.hasUnsyncedChanges
    }
  }
})

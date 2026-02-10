import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import fs from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'copy-static-files',
      writeBundle() {
        // 复制 404.html 到 dist 目录
        fs.copyFileSync(
          resolve(__dirname, '404.html'),
          resolve(__dirname, 'dist/404.html')
        )
        // 复制 .nojekyll 到 dist 目录（如果存在）
        if (fs.existsSync(resolve(__dirname, '.nojekyll'))) {
          fs.copyFileSync(
            resolve(__dirname, '.nojekyll'),
            resolve(__dirname, 'dist/.nojekyll')
          )
        }
        console.log('✓ 已复制 404.html 和 .nojekyll 到 dist 目录')
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  base: '/',  // GitHub Pages 部署使用根路径
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})

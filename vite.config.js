import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'

// 主进程里这些包保持外部引用（lowdb 7 是纯 ESM，交给 Node 原生 import 加载）
const MAIN_EXTERNAL = ['electron', 'lowdb', 'lowdb/node', 'steno']

export default defineConfig({
  plugins: [
    vue(),
    electron({
      main: {
        entry: 'electron/main.js',
        vite: {
          build: {
            rollupOptions: {
              external: (id) => MAIN_EXTERNAL.includes(id) || id.startsWith('node:')
            }
          }
        }
      },
      preload: {
        input: 'electron/preload.js'
      }
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500
  }
})


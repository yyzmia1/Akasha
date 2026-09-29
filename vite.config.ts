import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'child_process'

let gitBranch = 'feat/ai-copilot'
let gitCommit = ''
try {
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'feat/ai-copilot'
  gitCommit = execSync('git rev-parse --short HEAD').toString().trim()
} catch (_e) {}

const isBranch = gitBranch !== 'main' && gitBranch !== 'master' && gitBranch !== 'HEAD'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify('0.9.6'),
    __GIT_BRANCH__: JSON.stringify(gitBranch),
    __GIT_COMMIT__: JSON.stringify(gitCommit),
    __IS_BRANCH__: JSON.stringify(isBranch),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})

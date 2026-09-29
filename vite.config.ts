import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, './package.json'), 'utf-8'))

let gitBranch = 'main'
let gitCommit = ''
try {
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main'
  gitCommit = execSync('git rev-parse --short HEAD').toString().trim()
} catch (_e) {}

const isBranch = gitBranch !== 'main' && gitBranch !== 'master' && gitBranch !== 'HEAD'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
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

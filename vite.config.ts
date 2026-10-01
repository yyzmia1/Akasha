import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'

const pkg = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, './package.json'), 'utf-8'))

let gitBranch = process.env.VITE_GIT_BRANCH || process.env.GITHUB_REF_NAME || ''
let gitCommit = process.env.VITE_GIT_COMMIT || (process.env.GITHUB_SHA ? process.env.GITHUB_SHA.slice(0, 7) : '')

// 1. 尝试从构建时写入的 .git-commit 文件读取
if (!gitCommit) {
  try {
    const commitFile = path.resolve(import.meta.dirname, './.git-commit')
    if (fs.existsSync(commitFile)) {
      gitCommit = fs.readFileSync(commitFile, 'utf-8').trim()
    }
  } catch (_e) {}
}

// 2. 尝试从本地 git 环境读取
if (!gitCommit) {
  try {
    gitCommit = execSync('git rev-parse --short HEAD').toString().trim()
  } catch (_e) {}
}
if (!gitBranch) {
  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim() || 'main'
  } catch (_e) {}
}
if (!gitBranch) {
  gitBranch = 'main'
}

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

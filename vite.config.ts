import { defineConfig, type Plugin } from 'vite'
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

/**
 * 本地开发环境 AI 反向代理中间件（模拟 Nginx /api/ai-proxy 行为，规避本地调试时的浏览器跨域 CORS 拦截）
 */
function aiProxyDevPlugin(): Plugin {
  return {
    name: 'ai-proxy-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/ai-proxy/')) {
          return next()
        }
        const targetUrl = req.headers['x-target-url'] as string
        if (!targetUrl) {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Missing X-Target-Url header' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
          }
          const body = Buffer.concat(chunks)

          const authHeader = req.headers['authorization']
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          }
          if (authHeader) headers['Authorization'] = authHeader

          const upstreamRes = await fetch(targetUrl, {
            method: req.method || 'POST',
            headers,
            body: body.length > 0 ? body : undefined,
          })

          res.statusCode = upstreamRes.status
          upstreamRes.headers.forEach((val, key) => {
            if (key.toLowerCase() !== 'content-encoding') {
              res.setHeader(key, val)
            }
          })

          if (upstreamRes.body) {
            const reader = upstreamRes.body.getReader()
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              res.write(value)
            }
          }
          res.end()
        } catch (err: any) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: `AI Dev Proxy Error: ${err?.message || err}` }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), aiProxyDevPlugin()],
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

declare const __APP_VERSION__: string | undefined
declare const __GIT_BRANCH__: string | undefined
declare const __GIT_COMMIT__: string | undefined
declare const __IS_BRANCH__: boolean | undefined
declare const __BUILD_TIME__: string | undefined

export interface AppVersionInfo {
  version: string
  stage: string
  fullVersionString: string
  branch: string
  isBranch: boolean
  branchLabel: string
  commit: string
  buildTime: string
}

export function getAppVersionInfo(): AppVersionInfo {
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.9.6'
  const branch = typeof __GIT_BRANCH__ !== 'undefined' ? __GIT_BRANCH__ : 'feat/ai-copilot'
  const commit = typeof __GIT_COMMIT__ !== 'undefined' ? __GIT_COMMIT__ : 'b14edae'
  const isBranch = typeof __IS_BRANCH__ !== 'undefined' ? __IS_BRANCH__ : (branch !== 'main' && branch !== 'master')
  const buildTime = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString()

  return {
    version,
    stage: '内测版',
    fullVersionString: `${version} (内测版)`,
    branch,
    isBranch,
    branchLabel: isBranch ? `特性分支 · ${branch}` : `主线稳定 · ${branch}`,
    commit,
    buildTime,
  }
}

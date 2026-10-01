import { describe, it, expect } from 'vitest'
import { getAppVersionInfo } from '../src/utils/version'

describe('Version info utility', () => {
  it('returns valid app version information', () => {
    const info = getAppVersionInfo()
    expect(info).toBeDefined()
    expect(info.version).toBeTruthy()
    expect(info.fullVersionString).toContain(info.version)
    expect(info.branch).toBeTruthy()
    expect(typeof info.isBranch).toBe('boolean')
    expect(info.branchLabel).toBeTruthy()
    expect(typeof info.commit).toBe('string')
    expect(info.buildTime).toBeTruthy()
  })

  it('formats branchLabel accurately based on isBranch', () => {
    const info = getAppVersionInfo()
    if (!info.isBranch) {
      expect(info.branchLabel).toContain('主线稳定')
    } else {
      expect(info.branchLabel).toContain('特性分支')
    }
  })
})

import { describe, it, expect } from 'vitest'
import type { Area, Project } from '../src/types'
import {
  buildAreaTree,
  flattenAreaTree,
  getAreaDescendantIds,
  getAreaAncestorIds,
  getAreaBreadcrumbs,
  canSetAreaParent,
  getProjectsInAreaBranch,
} from '../src/utils/areaTree'

describe('areaTree utility', () => {
  const mockAreas: Area[] = [
    { id: 'tech', title: '技术领域', order: 0, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'life', title: '生活领域', order: 1, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'cs', parentId: 'tech', title: '计算机领域', order: 0, createdAt: '2026-01-02T00:00:00Z' },
    { id: 'embedded', parentId: 'tech', title: '嵌入式领域', order: 1, createdAt: '2026-01-02T00:00:00Z' },
    { id: 'rtos', parentId: 'embedded', title: 'RTOS 架构', order: 0, createdAt: '2026-01-03T00:00:00Z' },
    { id: 'hardware', parentId: 'embedded', title: '硬件电路', order: 1, createdAt: '2026-01-03T00:00:00Z' },
  ]

  const mockProjects: Project[] = [
    { id: 'p-top', areaId: 'tech', title: '全栈技术规划', order: 0, createdAt: '2026-01-01' },
    { id: 'p-cs1', areaId: 'cs', title: 'Akasha 个人系统', order: 0, createdAt: '2026-01-02' },
    { id: 'p-cs2', areaId: 'cs', title: '算法刷题', order: 1, createdAt: '2026-01-02' },
    { id: 'p-emb', areaId: 'embedded', title: 'STM32 控制器', order: 0, createdAt: '2026-01-03' },
    { id: 'p-rtos', areaId: 'rtos', title: 'FreeRTOS 移植', order: 0, createdAt: '2026-01-04' },
    { id: 'p-life', areaId: 'life', title: '家庭理财', order: 0, createdAt: '2026-01-05' },
  ]

  it('builds empty tree when areas are empty', () => {
    expect(buildAreaTree([])).toEqual([])
  })

  it('builds backwards-compatible flat tree when no parentIds are present', () => {
    const flatAreas: Area[] = [
      { id: '1', title: '工作', order: 1, createdAt: '2026-01-01' },
      { id: '2', title: '学习', order: 0, createdAt: '2026-01-01' },
    ]
    const tree = buildAreaTree(flatAreas)
    expect(tree).toHaveLength(2)
    expect(tree[0].id).toBe('2')
    expect(tree[1].id).toBe('1')
    expect(tree[0].children).toHaveLength(0)
    expect(tree[0].depth).toBe(0)
  })

  it('builds multi-level hierarchy with accurate depth and project counts', () => {
    const tree = buildAreaTree(mockAreas, mockProjects)
    expect(tree).toHaveLength(2) // tech, life

    const techNode = tree.find((n) => n.id === 'tech')!
    expect(techNode).toBeDefined()
    expect(techNode.depth).toBe(0)
    expect(techNode.projectCount).toBe(1) // p-top
    // tech total: 1 (tech) + 2 (cs) + 1 (embedded) + 1 (rtos) = 5
    expect(techNode.totalProjectCount).toBe(5)
    expect(techNode.children).toHaveLength(2) // cs, embedded

    const csNode = techNode.children[0]
    expect(csNode.id).toBe('cs')
    expect(csNode.depth).toBe(1)
    expect(csNode.projectCount).toBe(2)
    expect(csNode.totalProjectCount).toBe(2)

    const embeddedNode = techNode.children[1]
    expect(embeddedNode.id).toBe('embedded')
    expect(embeddedNode.depth).toBe(1)
    expect(embeddedNode.projectCount).toBe(1) // p-emb
    expect(embeddedNode.totalProjectCount).toBe(2) // p-emb + p-rtos
    expect(embeddedNode.children).toHaveLength(2) // rtos, hardware

    const rtosNode = embeddedNode.children[0]
    expect(rtosNode.id).toBe('rtos')
    expect(rtosNode.depth).toBe(2)
    expect(rtosNode.projectCount).toBe(1)
    expect(rtosNode.totalProjectCount).toBe(1)
  })

  it('flattens tree with DFS ordering', () => {
    const tree = buildAreaTree(mockAreas)
    const flat = flattenAreaTree(tree)
    expect(flat.map((n) => n.id)).toEqual([
      'tech',
      'cs',
      'embedded',
      'rtos',
      'hardware',
      'life',
    ])
    expect(flat.find((n) => n.id === 'rtos')?.depth).toBe(2)
  })

  it('computes breadcrumbs accurately from root to leaf', () => {
    const breadcrumbs = getAreaBreadcrumbs('rtos', mockAreas)
    expect(breadcrumbs.map((b) => b.id)).toEqual(['tech', 'embedded', 'rtos'])

    const rootBreadcrumbs = getAreaBreadcrumbs('tech', mockAreas)
    expect(rootBreadcrumbs.map((b) => b.id)).toEqual(['tech'])

    const invalid = getAreaBreadcrumbs('nonexistent', mockAreas)
    expect(invalid).toEqual([])
  })

  it('retrieves descendant IDs properly', () => {
    const techDescendants = getAreaDescendantIds('tech', mockAreas)
    expect(techDescendants).toContain('cs')
    expect(techDescendants).toContain('embedded')
    expect(techDescendants).toContain('rtos')
    expect(techDescendants).toContain('hardware')
    expect(techDescendants).not.toContain('life')

    const rtosDescendants = getAreaDescendantIds('rtos', mockAreas)
    expect(rtosDescendants).toHaveLength(0)
  })

  it('retrieves ancestor IDs properly', () => {
    const rtosAncestors = getAreaAncestorIds('rtos', mockAreas)
    expect(rtosAncestors).toEqual(['tech', 'embedded'])

    const techAncestors = getAreaAncestorIds('tech', mockAreas)
    expect(techAncestors).toHaveLength(0)
  })

  it('validates parent assignments and prevents cyclic loops', () => {
    // 1. Setting to null is always valid
    expect(canSetAreaParent('rtos', null, mockAreas)).toBe(true)

    // 2. Setting to another root is valid
    expect(canSetAreaParent('rtos', 'life', mockAreas)).toBe(true)

    // 3. Setting to self is invalid
    expect(canSetAreaParent('tech', 'tech', mockAreas)).toBe(false)

    // 4. Setting to a descendant is invalid (would create cyclic loop)
    expect(canSetAreaParent('tech', 'embedded', mockAreas)).toBe(false)
    expect(canSetAreaParent('tech', 'rtos', mockAreas)).toBe(false)
    expect(canSetAreaParent('embedded', 'rtos', mockAreas)).toBe(false)
  })

  it('aggregates projects across an entire branch', () => {
    const techProjects = getProjectsInAreaBranch('tech', mockAreas, mockProjects)
    expect(techProjects.map((p) => p.id)).toEqual(['p-top', 'p-cs1', 'p-cs2', 'p-emb', 'p-rtos'])

    const embeddedProjects = getProjectsInAreaBranch('embedded', mockAreas, mockProjects)
    expect(embeddedProjects.map((p) => p.id)).toEqual(['p-emb', 'p-rtos'])

    const lifeProjects = getProjectsInAreaBranch('life', mockAreas, mockProjects)
    expect(lifeProjects.map((p) => p.id)).toEqual(['p-life'])
  })
})

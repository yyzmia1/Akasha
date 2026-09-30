import type { Area, AreaTreeNode, Project } from '@/types'

/**
 * 将扁平的 Area 数组构建为层级分明的 AreaTreeNode 树形结构
 * 
 * @param areas 扁平领域列表
 * @param projects 可选的项目列表，若提供则自动计算直属与级联汇总项目数
 * @returns 顶级领域节点树（按 order 升序排列）
 */
export function buildAreaTree(areas: Area[], projects?: Project[]): AreaTreeNode[] {
  if (!areas || areas.length === 0) return []

  // 1. 统计每个领域的直属项目数
  const directProjectCountMap = new Map<string, number>()
  if (projects && projects.length > 0) {
    for (const p of projects) {
      if (!p.areaId) continue
      directProjectCountMap.set(p.areaId, (directProjectCountMap.get(p.areaId) || 0) + 1)
    }
  }

  // 2. 初始化所有节点
  const nodeMap = new Map<string, AreaTreeNode>()
  for (const a of areas) {
    nodeMap.set(a.id, {
      ...a,
      parentId: a.parentId || null,
      children: [],
      depth: 0,
      projectCount: directProjectCountMap.get(a.id) || 0,
      totalProjectCount: directProjectCountMap.get(a.id) || 0,
    })
  }

  // 3. 构建父子层级关系，检测并防止意外环路
  const rootNodes: AreaTreeNode[] = []

  for (const a of areas) {
    const node = nodeMap.get(a.id)!
    const parentId = node.parentId

    if (parentId && nodeMap.has(parentId)) {
      const parentNode = nodeMap.get(parentId)!
      // 避免自身作为父级的死循环
      if (parentId !== node.id) {
        parentNode.children.push(node)
      } else {
        rootNodes.push(node)
      }
    } else {
      // 无 parentId 或 parentId 不在列表中，视作顶级根领域
      rootNodes.push(node)
    }
  }

  // 4. 递归计算深度 depth、汇总项目总数 totalProjectCount、并按 order 排序
  function processNode(node: AreaTreeNode, currentDepth: number): number {
    node.depth = currentDepth

    // 子节点排序：先按 order 升序，再按 createdAt 升序
    node.children.sort((a, b) => {
      const orderA = a.order ?? 0
      const orderB = b.order ?? 0
      if (orderA !== orderB) return orderA - orderB
      return (a.createdAt || '').localeCompare(b.createdAt || '')
    })

    let subProjectsTotal = 0
    for (const child of node.children) {
      subProjectsTotal += processNode(child, currentDepth + 1)
    }

    node.totalProjectCount = (node.projectCount || 0) + subProjectsTotal
    return node.totalProjectCount
  }

  // 根节点排序
  rootNodes.sort((a, b) => {
    const orderA = a.order ?? 0
    const orderB = b.order ?? 0
    if (orderA !== orderB) return orderA - orderB
    return (a.createdAt || '').localeCompare(b.createdAt || '')
  })

  for (const root of rootNodes) {
    processNode(root, 0)
  }

  return rootNodes
}

/**
 * 深度优先遍历拍平树状结构（保留 depth 信息），常用于下拉框选择、列表缩发展示等
 */
export function flattenAreaTree(tree: AreaTreeNode[]): AreaTreeNode[] {
  const result: AreaTreeNode[] = []

  function dfs(nodes: AreaTreeNode[]) {
    for (const n of nodes) {
      result.push(n)
      if (n.children && n.children.length > 0) {
        dfs(n.children)
      }
    }
  }

  dfs(tree)
  return result
}

/**
 * 获取指定领域的所有后代（子领域、孙领域...）ID 列表
 */
export function getAreaDescendantIds(areaId: string, allAreas: Area[]): string[] {
  if (!areaId || !allAreas || allAreas.length === 0) return []

  const childrenMap = new Map<string, string[]>()
  for (const a of allAreas) {
    if (a.parentId) {
      if (!childrenMap.has(a.parentId)) {
        childrenMap.set(a.parentId, [])
      }
      childrenMap.get(a.parentId)!.push(a.id)
    }
  }

  const descendants: string[] = []
  const queue = [...(childrenMap.get(areaId) || [])]
  const visited = new Set<string>(queue)

  while (queue.length > 0) {
    const currentId = queue.shift()!
    descendants.push(currentId)

    const nextChildren = childrenMap.get(currentId) || []
    for (const nextId of nextChildren) {
      if (!visited.has(nextId)) {
        visited.add(nextId)
        queue.push(nextId)
      }
    }
  }

  return descendants
}

/**
 * 获取指定领域的所有祖先（从根到直接父级）ID 列表
 */
export function getAreaAncestorIds(areaId: string, allAreas: Area[]): string[] {
  if (!areaId || !allAreas || allAreas.length === 0) return []

  const areaMap = new Map<string, Area>(allAreas.map((a) => [a.id, a]))
  const ancestors: string[] = []
  let current = areaMap.get(areaId)
  const visited = new Set<string>()

  while (current && current.parentId && areaMap.has(current.parentId)) {
    const parentId = current.parentId
    if (visited.has(parentId)) break // 防环
    visited.add(parentId)
    ancestors.unshift(parentId)
    current = areaMap.get(parentId)
  }

  return ancestors
}

/**
 * 获取从顶级领域到当前领域的完整面包屑路径数组
 * 例如：[技术领域, 嵌入式领域, RTOS架构]
 */
export function getAreaBreadcrumbs(areaId: string, allAreas: Area[]): Area[] {
  if (!areaId || !allAreas || allAreas.length === 0) return []

  const areaMap = new Map<string, Area>(allAreas.map((a) => [a.id, a]))
  const path: Area[] = []
  let current = areaMap.get(areaId)
  const visited = new Set<string>()

  while (current) {
    if (visited.has(current.id)) break
    visited.add(current.id)
    path.unshift(current)
    if (current.parentId && areaMap.has(current.parentId)) {
      current = areaMap.get(current.parentId)
    } else {
      break
    }
  }

  return path
}

/**
 * 校验是否可以将 targetArea 的父级设置为 newParentId（防止循环引用）
 * 规则：不能以自身为父级；不能将自己的后代（子领域/孙领域）设置为自己的父级。
 */
export function canSetAreaParent(
  targetAreaId: string,
  newParentId: string | null | undefined,
  allAreas: Area[]
): boolean {
  if (!newParentId) return true // 设为根节点总是合法
  if (targetAreaId === newParentId) return false // 不能以自己为父节点

  // 不能以自己的任何后代作为父节点
  const descendantIds = new Set(getAreaDescendantIds(targetAreaId, allAreas))
  if (descendantIds.has(newParentId)) return false

  return true
}

/**
 * 获取归属于指定领域或其所有子孙领域的所有项目（用于穿透汇总大盘视图）
 */
export function getProjectsInAreaBranch(
  areaId: string,
  allAreas: Area[],
  allProjects: Project[]
): Project[] {
  if (!areaId || !allProjects || allProjects.length === 0) return []

  const branchAreaIds = new Set<string>([areaId, ...getAreaDescendantIds(areaId, allAreas)])
  return allProjects.filter((p) => p.areaId && branchAreaIds.has(p.areaId))
}

/**
 * 拖拽调整领域层级或同级排序
 * @param draggedId 被拖拽的领域 ID
 * @param targetId 目标领域 ID（如果是 'all' 则置为顶级根领域末尾）
 * @param position 投放位置：'before'（排在目标前）、'after'（排在目标后）、'inside'（成为目标的子领域）
 * @param allAreas 所有领域列表
 * @returns 调整后的新 Area 数组（已更新 parentId 与 order），如果操作不合法（如循环嵌套）则返回 null
 */
export function reorderAreaNode(
  draggedId: string,
  targetId: string,
  position: 'before' | 'after' | 'inside',
  allAreas: Area[]
): Area[] | null {
  const dragged = allAreas.find((a) => a.id === draggedId)
  if (!dragged) return null

  // 1. 如果拖到 "all"，表示移到顶级根目录末尾
  if (targetId === 'all' || targetId === 'root') {
    const rootAreas = allAreas
      .filter((a) => !a.parentId && a.id !== draggedId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    const updatedAreas = allAreas.map((a) => ({ ...a }))
    const targetItem = updatedAreas.find((a) => a.id === draggedId)!
    targetItem.parentId = null
    targetItem.order = rootAreas.length
    return updatedAreas
  }

  const target = allAreas.find((a) => a.id === targetId)
  if (!target || target.id === draggedId) return null

  // 2. 作为子节点拖入 inside
  if (position === 'inside') {
    if (!canSetAreaParent(draggedId, target.id, allAreas)) return null
    const existingChildren = allAreas
      .filter((a) => a.parentId === target.id && a.id !== draggedId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const updatedAreas = allAreas.map((a) => ({ ...a }))
    const draggedItem = updatedAreas.find((a) => a.id === draggedId)!
    draggedItem.parentId = target.id
    draggedItem.order = existingChildren.length
    return updatedAreas
  }

  // 3. 作为同级前后排序 before / after
  const newParentId = target.parentId ?? null
  if (!canSetAreaParent(draggedId, newParentId, allAreas)) return null

  const siblings = allAreas
    .filter((a) => (a.parentId ?? null) === newParentId && a.id !== draggedId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const targetIndex = siblings.findIndex((a) => a.id === target.id)
  if (targetIndex === -1) return null

  const insertIndex = position === 'before' ? targetIndex : targetIndex + 1
  siblings.splice(insertIndex, 0, dragged)

  // 重新分配该层级下所有 siblings 的 order
  const updatedAreas = allAreas.map((a) => ({ ...a }))
  const orderMap = new Map<string, number>()
  siblings.forEach((item, idx) => {
    orderMap.set(item.id, idx)
  })

  for (const a of updatedAreas) {
    if (orderMap.has(a.id)) {
      a.order = orderMap.get(a.id)!
      if (a.id === draggedId) {
        a.parentId = newParentId
      }
    }
  }

  return updatedAreas
}

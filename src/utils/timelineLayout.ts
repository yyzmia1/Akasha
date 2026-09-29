/**
 * 连续时间网格与智能多栏防重叠排布算法 (Timeline Grid & Overlap Layout Engine)
 * 基于成熟的工业级日历算法 (Google Calendar / FullCalendar Interval Graph Partitioning)
 */

export interface RawDayTimelineItem {
  id: string
  type: 'schedule' | 'habit' | 'todo'
  title: string
  timeStr: string
  startMinutes: number
  endMinutes: number
  durationMinutes: number
  isAllDay: boolean
  completed?: boolean
  projectColor?: string
  projectName?: string
  importance?: number
  isScheduled?: boolean
  data?: any
  slotLabel?: string
}

export interface TimedGridItem extends RawDayTimelineItem {
  top: number
  height: number
  leftPercent: number
  widthPercent: number
  colIndex: number
  colSpan: number
  totalCols: number
  hasOverlap: boolean
}

export interface AgendaListItem extends RawDayTimelineItem {
  overlapWithNext: number
}

/**
 * 解析 "HH:mm" 为当日起始分钟数 (0 ~ 1439)
 */
export function parseMinutes(t?: string): number | null {
  if (!t || !t.includes(':')) return null
  const [h, m] = t.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

/**
 * 格式化持续时长
 */
export function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0分'
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分` : `${h}小时`
}

/**
 * 工业级日程防重叠分栏排布算法 (Greedy Interval Coloring with Adjacent Expansion)
 *
 * 核心逻辑：
 * 1. 排序：按 startMinutes 升序；若起始相同，持续时间更长者排在前面。
 * 2. 聚类：将具有交集的所有重叠事件划分为独立的连通集群 (Connected Overlapping Clusters)。
 * 3. 贪心分栏：在每个集群内，采用最先适应 (First-Fit) 算法为事件分配非重叠的列 (Column Index)。
 * 4. 水平弹性扩展 (Column Span)：如果事件右侧相邻列在此时段内无其它事件，则弹性扩展宽度填满空隙。
 * 5. 坐标映射：按 1 分钟 = pxPerMinute 计算垂直坐标 top 与高度 height（并保留最小易读高度）。
 */
export function computeGridEventLayout(
  items: RawDayTimelineItem[],
  pxPerMinute: number = 1,
  minHeight: number = 30
): TimedGridItem[] {
  if (!items.length) return []

  // 1. 升序排序
  const sorted = [...items].sort((a, b) => {
    if (a.startMinutes !== b.startMinutes) {
      return a.startMinutes - b.startMinutes
    }
    return (b.endMinutes - b.startMinutes) - (a.endMinutes - a.startMinutes)
  })

  // 2. 划分为连通重叠集群
  const clusters: RawDayTimelineItem[][] = []
  let currentCluster: RawDayTimelineItem[] = []
  let clusterEnd = -1

  for (const item of sorted) {
    if (currentCluster.length === 0) {
      currentCluster.push(item)
      clusterEnd = item.endMinutes
    } else if (item.startMinutes < clusterEnd) {
      currentCluster.push(item)
      clusterEnd = Math.max(clusterEnd, item.endMinutes)
    } else {
      clusters.push(currentCluster)
      currentCluster = [item]
      clusterEnd = item.endMinutes
    }
  }
  if (currentCluster.length > 0) {
    clusters.push(currentCluster)
  }

  // 3. 分栏与宽度弹性计算
  const result: TimedGridItem[] = []

  for (const cluster of clusters) {
    const columns: RawDayTimelineItem[][] = []
    const itemColMap = new Map<string, number>()

    for (const item of cluster) {
      let assignedCol = -1
      for (let c = 0; c < columns.length; c++) {
        const lastInCol = columns[c][columns[c].length - 1]
        if (lastInCol.endMinutes <= item.startMinutes) {
          columns[c].push(item)
          assignedCol = c
          break
        }
      }
      if (assignedCol === -1) {
        assignedCol = columns.length
        columns.push([item])
      }
      itemColMap.set(item.id, assignedCol)
    }

    const totalCols = columns.length
    const hasOverlap = totalCols > 1

    for (const item of cluster) {
      const colIdx = itemColMap.get(item.id)!
      let colSpan = 1
      for (let nextCol = colIdx + 1; nextCol < totalCols; nextCol++) {
        const collides = columns[nextCol].some((other) => {
          return other.startMinutes < item.endMinutes && item.startMinutes < other.endMinutes
        })
        if (!collides) {
          colSpan++
        } else {
          break
        }
      }

      const duration = item.endMinutes - item.startMinutes
      const computedHeight = Math.max(minHeight, duration * pxPerMinute)
      const top = item.startMinutes * pxPerMinute
      const leftPercent = (colIdx / totalCols) * 100
      const widthPercent = (colSpan / totalCols) * 100

      result.push({
        ...item,
        top,
        height: computedHeight,
        leftPercent,
        widthPercent,
        colIndex: colIdx,
        colSpan,
        totalCols,
        hasOverlap,
      })
    }
  }

  return result
}

/**
 * 清单模式辅助计算：时序重叠时间
 */
export function computeAgendaList(items: RawDayTimelineItem[]): AgendaListItem[] {
  const list = [...items].sort((a, b) => a.startMinutes - b.startMinutes)
  return list.map((item, idx) => {
    const next = list[idx + 1]
    const overlapWithNext = next && next.startMinutes < item.endMinutes
      ? item.endMinutes - next.startMinutes
      : 0
    return {
      ...item,
      overlapWithNext,
    }
  })
}

import { describe, it, expect } from 'vitest'
import type { Area, Project, ScheduleItem, TodoItem, Habit } from '../src/types'
import { getAreaDescendantIds } from '../src/utils/areaTree'

/**
 * 模拟 CalendarView 中的过滤计算逻辑
 */
function computeHiddenAndVisibleItems(params: {
  areas: Area[]
  projects: Project[]
  schedules: ScheduleItem[]
  todos: TodoItem[]
  habits: Habit[]
}) {
  const { areas, projects, schedules, todos, habits } = params

  const hiddenAreaIds = new Set<string>()
  for (const a of areas) {
    if (a.showOnCalendar === false) {
      hiddenAreaIds.add(a.id)
      const descendants = getAreaDescendantIds(a.id, areas)
      for (const d of descendants) {
        hiddenAreaIds.add(d)
      }
    }
  }

  const hiddenProjectIds = new Set<string>()
  if (hiddenAreaIds.size > 0 && projects.length > 0) {
    for (const p of projects) {
      if (p.areaId && hiddenAreaIds.has(p.areaId)) {
        hiddenProjectIds.add(p.id)
      }
    }
  }

  const visibleSchedules = hiddenProjectIds.size === 0
    ? schedules
    : schedules.filter((s) => !s.projectId || !hiddenProjectIds.has(s.projectId))

  const visibleTodos = hiddenProjectIds.size === 0
    ? todos
    : todos.filter((t) => !t.projectId || !hiddenProjectIds.has(t.projectId))

  const visibleHabits = hiddenProjectIds.size === 0
    ? habits
    : habits.filter((h) => !h.projectId || !hiddenProjectIds.has(h.projectId))

  return {
    hiddenAreaIds,
    hiddenProjectIds,
    visibleSchedules,
    visibleTodos,
    visibleHabits,
  }
}

describe('Area Calendar Visibility Logic', () => {
  const mockAreas: Area[] = [
    { id: 'work', title: '工作', order: 0, createdAt: '2026-01-01', showOnCalendar: true },
    { id: 'dev', parentId: 'work', title: '研发', order: 0, createdAt: '2026-01-02', showOnCalendar: true },
    { id: 'frontend', parentId: 'dev', title: '前端架构', order: 0, createdAt: '2026-01-03', showOnCalendar: true },
    { id: 'life', title: '生活', order: 1, createdAt: '2026-01-01', showOnCalendar: true },
  ]

  const mockProjects: Project[] = [
    { id: 'p-work-root', areaId: 'work', title: '部门周会规划', order: 0, createdAt: '2026-01-01' },
    { id: 'p-dev', areaId: 'dev', title: '微服务重构', order: 0, createdAt: '2026-01-02' },
    { id: 'p-fe', areaId: 'frontend', title: 'UI组件库', order: 0, createdAt: '2026-01-03' },
    { id: 'p-life', areaId: 'life', title: '健身锻炼', order: 0, createdAt: '2026-01-01' },
  ]

  const mockSchedules: ScheduleItem[] = [
    { id: 's-work', projectId: 'p-work-root', title: '周一早会', date: '2026-03-30', recurringType: 'none', createdAt: '2026-01-01' },
    { id: 's-fe', projectId: 'p-fe', title: '前端评审', date: '2026-03-30', recurringType: 'none', createdAt: '2026-01-01' },
    { id: 's-life', projectId: 'p-life', title: '晨跑', date: '2026-03-30', recurringType: 'none', createdAt: '2026-01-01' },
    { id: 's-public', projectId: null, title: '公用备忘日程', date: '2026-03-30', recurringType: 'none', createdAt: '2026-01-01' },
  ]

  const mockTodos: TodoItem[] = [
    { id: 't-fe', projectId: 'p-fe', parentId: null, title: '修复UI bug', completed: false, order: 0, dueDate: '2026-03-30', createdAt: '2026-01-01' },
    { id: 't-life', projectId: 'p-life', parentId: null, title: '买水果', completed: false, order: 0, dueDate: '2026-03-30', createdAt: '2026-01-01' },
    { id: 't-public', projectId: null, parentId: null, title: '独立待办', completed: false, order: 0, dueDate: '2026-03-30', createdAt: '2026-01-01' },
  ]

  const mockHabits: Habit[] = [
    { id: 'h-fe', projectId: 'p-fe', title: '代码重构1小时', frequency: 'daily', showOnCalendar: true, createdAt: '2026-01-01' },
    { id: 'h-life', projectId: 'p-life', title: '阅读半小时', frequency: 'daily', showOnCalendar: true, createdAt: '2026-01-01' },
    { id: 'h-public', projectId: null, title: '早睡早起', frequency: 'daily', showOnCalendar: true, createdAt: '2026-01-01' },
  ]

  it('keeps all items visible when all areas show on calendar', () => {
    const res = computeHiddenAndVisibleItems({
      areas: mockAreas,
      projects: mockProjects,
      schedules: mockSchedules,
      todos: mockTodos,
      habits: mockHabits,
    })

    expect(res.hiddenAreaIds.size).toBe(0)
    expect(res.hiddenProjectIds.size).toBe(0)
    expect(res.visibleSchedules).toHaveLength(4)
    expect(res.visibleTodos).toHaveLength(3)
    expect(res.visibleHabits).toHaveLength(3)
  })

  it('hides top-level area and all its sub-areas and descendant projects/items', () => {
    const areasWithWorkHidden = mockAreas.map((a) =>
      a.id === 'work' ? { ...a, showOnCalendar: false } : a
    )

    const res = computeHiddenAndVisibleItems({
      areas: areasWithWorkHidden,
      projects: mockProjects,
      schedules: mockSchedules,
      todos: mockTodos,
      habits: mockHabits,
    })

    // work 以及其后代 dev, frontend 均被隐藏
    expect(Array.from(res.hiddenAreaIds).sort()).toEqual(['dev', 'frontend', 'work'])
    // p-work-root, p-dev, p-fe 均被隐藏
    expect(Array.from(res.hiddenProjectIds).sort()).toEqual(['p-dev', 'p-fe', 'p-work-root'])

    // 日程只剩下 life 和 public
    expect(res.visibleSchedules.map((s) => s.id)).toEqual(['s-life', 's-public'])
    // 待办只剩下 life 和 public
    expect(res.visibleTodos.map((t) => t.id)).toEqual(['t-life', 't-public'])
    // 习惯只剩下 life 和 public
    expect(res.visibleHabits.map((h) => h.id)).toEqual(['h-life', 'h-public'])
  })

  it('hides only sub-area branch when child area showOnCalendar is false', () => {
    const areasWithDevHidden = mockAreas.map((a) =>
      a.id === 'dev' ? { ...a, showOnCalendar: false } : a
    )

    const res = computeHiddenAndVisibleItems({
      areas: areasWithDevHidden,
      projects: mockProjects,
      schedules: mockSchedules,
      todos: mockTodos,
      habits: mockHabits,
    })

    // dev 及其子级 frontend 被隐藏，但父级 work 仍显示
    expect(Array.from(res.hiddenAreaIds).sort()).toEqual(['dev', 'frontend'])
    expect(Array.from(res.hiddenProjectIds).sort()).toEqual(['p-dev', 'p-fe'])

    // work 根项目日程保留，fe 日程隐藏
    expect(res.visibleSchedules.map((s) => s.id)).toEqual(['s-work', 's-life', 's-public'])
    expect(res.visibleTodos.map((t) => t.id)).toEqual(['t-life', 't-public'])
    expect(res.visibleHabits.map((h) => h.id)).toEqual(['h-life', 'h-public'])
  })
})

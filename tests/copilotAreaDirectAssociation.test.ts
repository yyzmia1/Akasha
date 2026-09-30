import { describe, it, expect } from 'vitest'
import type { Area, Project, ScheduleItem, TodoItem, Habit } from '../src/types'
import type { ScheduleDraft, TodoDraft, HabitDraft } from '../src/types/copilot'

describe('Copilot Draft Area Direct Association & Empty Project Handling', () => {
  it('formats dropdown values properly for project, area, and unassigned', () => {
    function getDraftSelectedValue(draft: { suggestedProjectTitle?: string; suggestedAreaTitle?: string }) {
      if (draft.suggestedProjectTitle) {
        return 'proj:' + draft.suggestedProjectTitle
      }
      if (draft.suggestedAreaTitle) {
        return 'area:' + draft.suggestedAreaTitle
      }
      return ''
    }

    expect(getDraftSelectedValue({})).toBe('')
    expect(getDraftSelectedValue({ suggestedProjectTitle: '考研二战' })).toBe('proj:考研二战')
    expect(getDraftSelectedValue({ suggestedAreaTitle: '学业提升' })).toBe('area:学业提升')
    // Project takes precedence if both somehow exist
    expect(getDraftSelectedValue({ suggestedProjectTitle: '考研二战', suggestedAreaTitle: '学业提升' })).toBe('proj:考研二战')
  })

  it('updates draft target when selecting project or area or unassigned', () => {
    const existingProjects: Project[] = [
      {
        id: 'proj-1',
        areaId: 'area-1',
        title: 'Akasha 系统开发',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      },
    ]

    function handleDraftProjectOrAreaChange(
      draft: { suggestedProjectTitle?: string; suggestedAreaTitle?: string; projectId?: string | null },
      val: string
    ) {
      if (!val) {
        draft.suggestedProjectTitle = undefined
        draft.projectId = null
        draft.suggestedAreaTitle = undefined
        return
      }
      if (val.startsWith('proj:')) {
        const title = val.slice(5)
        draft.suggestedProjectTitle = title
        draft.suggestedAreaTitle = undefined
        const matchingProj = existingProjects.find((p) => p.title.trim().toLowerCase() === title.trim().toLowerCase())
        draft.projectId = matchingProj ? matchingProj.id : null
      } else if (val.startsWith('area:')) {
        const title = val.slice(5)
        draft.suggestedProjectTitle = undefined
        draft.projectId = null
        draft.suggestedAreaTitle = title
      }
    }

    const draft: { suggestedProjectTitle?: string; suggestedAreaTitle?: string; projectId?: string | null } = {}

    // 1. Select project
    handleDraftProjectOrAreaChange(draft, 'proj:Akasha 系统开发')
    expect(draft.suggestedProjectTitle).toBe('Akasha 系统开发')
    expect(draft.projectId).toBe('proj-1')
    expect(draft.suggestedAreaTitle).toBeUndefined()

    // 2. Select area directly
    handleDraftProjectOrAreaChange(draft, 'area:健康生活')
    expect(draft.suggestedAreaTitle).toBe('健康生活')
    expect(draft.suggestedProjectTitle).toBeUndefined()
    expect(draft.projectId).toBeNull()

    // 3. Clear assignment
    handleDraftProjectOrAreaChange(draft, '')
    expect(draft.suggestedAreaTitle).toBeUndefined()
    expect(draft.suggestedProjectTitle).toBeUndefined()
    expect(draft.projectId).toBeNull()
  })

  it('resolves existing project under area or creates default project when applying plan', async () => {
    const areas: Area[] = [
      { id: 'area-1', title: '学习成长', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
      { id: 'area-2', title: '个人健康', color: '#10b981', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ]

    const projects: Project[] = [
      { id: 'proj-study-1', areaId: 'area-1', title: '英语六级备考', createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ]

    const createdProjectIds: string[] = []
    const projectTitleMap = new Map<string, string>()
    for (const p of projects) {
      projectTitleMap.set(p.title.trim().toLowerCase(), p.id)
    }

    const areaTitleToRealId = new Map<string, string>()
    for (const a of areas) {
      areaTitleToRealId.set(a.title.trim().toLowerCase(), a.id)
    }

    function resolveParentAreaId(rawParent: string | null | undefined): string | null {
      if (!rawParent) return null
      const trimmed = rawParent.trim()
      if (areas.some((a) => a.id === trimmed)) return trimmed
      const lower = trimmed.toLowerCase()
      if (areaTitleToRealId.has(lower)) return areaTitleToRealId.get(lower)!
      for (const [title, id] of areaTitleToRealId.entries()) {
        if (title.includes(lower) || lower.includes(title)) {
          return id
        }
      }
      return null
    }

    const resolveOrCreateProjectForArea = async (areaRef: string): Promise<string | null> => {
      const resolvedAreaId = resolveParentAreaId(areaRef)
      if (!resolvedAreaId) return null

      // Check existing project
      const existingProj = projects.find((p) => p.areaId === resolvedAreaId)
      if (existingProj) {
        return existingProj.id
      }

      // Auto-create default project for this area
      const targetArea = areas.find((a) => a.id === resolvedAreaId)
      const projectTitle = targetArea ? `${targetArea.title}常规事务` : '常规事务'
      const newProj: Project = {
        id: 'proj-auto-' + Date.now(),
        areaId: resolvedAreaId,
        title: projectTitle,
        color: targetArea?.color || '#3b82f6',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      createdProjectIds.push(newProj.id)
      projects.push(newProj)
      projectTitleMap.set(newProj.title.trim().toLowerCase(), newProj.id)
      return newProj.id
    }

    // Case 1: Item associated with '学习成长', which already has 'proj-study-1'
    const projId1 = await resolveOrCreateProjectForArea('学习成长')
    expect(projId1).toBe('proj-study-1')
    expect(createdProjectIds.length).toBe(0)

    // Case 2: Item associated with '个人健康', which has no projects yet
    const projId2 = await resolveOrCreateProjectForArea('个人健康')
    expect(projId2).toBeDefined()
    expect(createdProjectIds.length).toBe(1)
    const created = projects.find((p) => p.id === projId2)
    expect(created?.title).toBe('个人健康常规事务')
    expect(created?.areaId).toBe('area-2')
    expect(created?.color).toBe('#10b981')

    // Case 3: Subsequent item associated with '个人健康' should reuse the auto-created project
    const projId3 = await resolveOrCreateProjectForArea('个人健康')
    expect(projId3).toBe(projId2)
    expect(createdProjectIds.length).toBe(1)
  })
})

import { describe, it, expect } from 'vitest'
import { detectScheduleConflict, annotateConflicts } from '@/services/conflictDetector'
import type { ScheduleItem } from '@/types'
import type { ScheduleDraft } from '@/types/copilot'

describe('conflictDetector (本地日程冲突检测引擎)', () => {
  const existingMeeting: ScheduleItem = {
    id: 'sch-1',
    title: '团队周会',
    date: '2026-09-28',
    time: '14:00',
    endDate: '2026-09-28',
    endTime: '15:00',
    recurringType: 'none',
  }

  const existingWeeklyGym: ScheduleItem = {
    id: 'sch-2',
    title: '周一健身打卡',
    date: '2026-09-01',
    time: '19:00',
    endTime: '20:30',
    recurringType: 'weekly',
    recurringDayOfWeek: 1, // 2026-09-28 is Monday (1)
  }

  it('能够敏锐检测出同日时间区间重叠冲突', () => {
    const draft: ScheduleDraft = {
      id: 'draft-1',
      type: 'schedule',
      title: '客户电话沟通',
      date: '2026-09-28',
      time: '14:30',
      endTime: '15:30',
      recurringType: 'none',
      selected: true,
    }

    const result = detectScheduleConflict(draft, [existingMeeting])
    expect(result.isConflict).toBe(true)
    expect(result.reason).toContain('团队周会')
    expect(result.reason).toContain('时间重叠')
  })

  it('相邻但无交集的时段不应判定为冲突', () => {
    const draft: ScheduleDraft = {
      id: 'draft-2',
      type: 'schedule',
      title: '研讨会',
      date: '2026-09-28',
      time: '15:00',
      endTime: '16:00',
      recurringType: 'none',
      selected: true,
    }

    const result = detectScheduleConflict(draft, [existingMeeting])
    expect(result.isConflict).toBe(false)
  })

  it('不同时段的日程不应判定为冲突', () => {
    const draft: ScheduleDraft = {
      id: 'draft-3',
      type: 'schedule',
      title: '早间阅读',
      date: '2026-09-28',
      time: '09:00',
      endTime: '10:00',
      recurringType: 'none',
      selected: true,
    }

    const result = detectScheduleConflict(draft, [existingMeeting])
    expect(result.isConflict).toBe(false)
  })

  it('能够正确识别周循环(weekly)日程在对应星期的冲突', () => {
    // 2026-09-28 是周一 (Day 1)
    const draft: ScheduleDraft = {
      id: 'draft-4',
      type: 'schedule',
      title: '朋友聚餐',
      date: '2026-09-28',
      time: '19:30',
      endTime: '21:00',
      recurringType: 'none',
      selected: true,
    }

    const result = detectScheduleConflict(draft, [existingWeeklyGym])
    expect(result.isConflict).toBe(true)
    expect(result.reason).toContain('周一健身打卡')
  })

  it('若未提供 endTime，应自动按开始时间后 60 分钟推算冲突', () => {
    const draftWithoutEndTime: ScheduleDraft = {
      id: 'draft-5',
      type: 'schedule',
      title: '临时沟通',
      date: '2026-09-28',
      time: '14:20', // 默认算到 15:20，与 14:00~15:00 重叠
      recurringType: 'none',
      selected: true,
    }

    const result = detectScheduleConflict(draftWithoutEndTime, [existingMeeting])
    expect(result.isConflict).toBe(true)
  })

  it('annotateConflicts 能够批量标注草稿列表的冲突状态', () => {
    const drafts: ScheduleDraft[] = [
      {
        id: 'draft-a',
        type: 'schedule',
        title: '冲突日程',
        date: '2026-09-28',
        time: '14:15',
        endTime: '14:45',
        recurringType: 'none',
        selected: true,
      },
      {
        id: 'draft-b',
        type: 'schedule',
        title: '正常日程',
        date: '2026-09-28',
        time: '16:00',
        endTime: '17:00',
        recurringType: 'none',
        selected: true,
      },
    ]

    const annotated = annotateConflicts(drafts, [existingMeeting])
    expect(annotated).toHaveLength(2)
    expect(annotated[0].isConflict).toBe(true)
    expect(annotated[0].conflictReason).toBeDefined()
    expect(annotated[1].isConflict).toBe(false)
  })
})

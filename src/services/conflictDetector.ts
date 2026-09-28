import type { ScheduleItem } from '@/types'
import type { ScheduleDraft } from '@/types/copilot'

/**
 * 转换时间字符串为以分钟为单位的数值 (00:00 -> 0, 23:59 -> 1439)
 */
function parseTimeToMinutes(t?: string): number | null {
  if (!t) return null
  const parts = t.split(':').map(Number)
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1]
  }
  return null
}

/**
 * 检测某草稿日程与现有所有日程是否存在重叠冲突
 */
export function detectScheduleConflict(
  draft: ScheduleDraft,
  existingSchedules: ScheduleItem[]
): { isConflict: boolean; reason?: string } {
  if (!draft.date) return { isConflict: false }

  const draftStartMin = parseTimeToMinutes(draft.time)
  // 如果没有提供具体结束时间，默认以开始时间后 60 分钟作为预期块计算冲突
  const draftEndMin = parseTimeToMinutes(draft.endTime) ?? (draftStartMin !== null ? draftStartMin + 60 : null)

  const draftDateObj = new Date(draft.date + 'T00:00:00')
  const draftDayOfWeek = draftDateObj.getDay() // 0-6
  const draftDayOfMonth = draftDateObj.getDate() // 1-31

  for (const existing of existingSchedules) {
    // 匹配日期或重复规则
    let isSameDay = false

    if (existing.recurringType === 'weekly') {
      if (existing.recurringDayOfWeek === draftDayOfWeek) {
        isSameDay = true
      }
    } else if (existing.recurringType === 'monthly') {
      if (existing.recurringDayOfMonth === draftDayOfMonth) {
        isSameDay = true
      }
    } else {
      // 单次日程
      const eDate = existing.date || existing.createdAt?.substring(0, 10)
      const eEndDate = existing.endDate || eDate
      if (eDate && draft.date >= eDate && draft.date <= eEndDate) {
        isSameDay = true
      }
    }

    if (!isSameDay) continue

    // 如果草稿或现有日程有一个没有指定具体时间（全天日程），则给出轻度提示
    const existStartMin = parseTimeToMinutes(existing.time)
    const existEndMin = parseTimeToMinutes(existing.endTime) ?? (existStartMin !== null ? existStartMin + 60 : null)

    // 精确时间冲突比对
    if (draftStartMin !== null && draftEndMin !== null && existStartMin !== null && existEndMin !== null) {
      const hasOverlap = Math.max(draftStartMin, existStartMin) < Math.min(draftEndMin, existEndMin)
      if (hasOverlap) {
        const timeDisplay = existing.endTime ? `${existing.time} - ${existing.endTime}` : `${existing.time}`
        return {
          isConflict: true,
          reason: `与已有日程「${existing.title}」(${timeDisplay}) 时间重叠`,
        }
      }
    }
  }

  return { isConflict: false }
}

/**
 * 批量为所有日程草稿执行冲突检测标记
 */
export function annotateConflicts(
  drafts: ScheduleDraft[],
  existingSchedules: ScheduleItem[]
): ScheduleDraft[] {
  return drafts.map((draft) => {
    const res = detectScheduleConflict(draft, existingSchedules)
    return {
      ...draft,
      isConflict: res.isConflict,
      conflictReason: res.reason,
    }
  })
}

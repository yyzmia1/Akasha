import type { ScheduleItem } from '@/types'
import type { ScheduleDraft } from '@/types/copilot'
import { addDays, formatDate, parseDate } from '@/utils/date'
import { scheduleOccursOn } from '@/utils/schedule'

function parseTimeToMinutes(time?: string): number | null {
  if (!time) return null
  const [hours, minutes] = time.split(':').map(Number)
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null
}

function timeRangeForDay(schedule: ScheduleItem | ScheduleDraft, date: string): [number, number] | null {
  const start = parseTimeToMinutes(schedule.time)
  if (start === null) return null
  const end = parseTimeToMinutes(schedule.endTime) ?? start + 60
  if (schedule.recurringType === 'none' && schedule.endDate && schedule.endDate !== schedule.date) {
    return [schedule.date === date ? start : 0, schedule.endDate === date ? end : 1440]
  }
  return [start, end]
}

export function detectScheduleConflict(
  draft: ScheduleDraft,
  existingSchedules: Array<ScheduleItem | ScheduleDraft>,
): { isConflict: boolean; reason?: string } {
  for (const existing of existingSchedules) {
    const start = [draft.date, existing.date].filter(Boolean).sort().at(-1) || formatDate(new Date())
    const finiteEnds = [draft, existing].filter(s => s.recurringType === 'none').map(s => s.endDate || s.date).filter(Boolean).sort()
    // ponytail: one year covers monthly/weekly intersections and the 50-week course protocol.
    const horizon = formatDate(addDays(parseDate(start), 365))
    const end = finiteEnds[0] && finiteEnds[0] < horizon ? finiteEnds[0] : horizon
    for (let day = parseDate(start); formatDate(day) <= end; day = addDays(day, 1)) {
      const date = formatDate(day)
      if (!scheduleOccursOn(draft, date) || !scheduleOccursOn(existing, date)) continue
      const a = timeRangeForDay(draft, date)
      const b = timeRangeForDay(existing, date)
      if (a && b && Math.max(a[0], b[0]) < Math.min(a[1], b[1])) {
        return { isConflict: true, reason: '与已有日程「' + existing.title + '」(' + existing.time + (existing.endTime ? ' - ' + existing.endTime : '') + ') 时间重叠' }
      }
    }
  }
  return { isConflict: false }
}

export function annotateConflicts(drafts: ScheduleDraft[], existingSchedules: ScheduleItem[]): ScheduleDraft[] {
  return drafts.map(draft => {
    const peers = drafts.filter(peer => peer.id !== draft.id && peer.selected)
    const result = detectScheduleConflict(draft, [...existingSchedules, ...peers])
    return { ...draft, isConflict: result.isConflict, conflictReason: result.reason }
  })
}

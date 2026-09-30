import type { ScheduleItem } from '@/types'
import { addDays, formatDate, getMonday, parseDate } from './date'

type ScheduleRule = Pick<ScheduleItem, 'date' | 'endDate' | 'recurringType' | 'recurringDayOfWeek' | 'recurringDayOfMonth' | 'recurringWeeks'>

export function scheduleOccursOn(schedule: ScheduleRule, dateStr: string): boolean {
  const day = parseDate(dateStr)
  if (Number.isNaN(day.getTime())) return false
  if (!schedule.recurringType || schedule.recurringType === 'none') {
    return !!schedule.date && dateStr >= schedule.date && dateStr <= (schedule.endDate || schedule.date)
  }
  if (schedule.date && dateStr < schedule.date) return false
  if (schedule.recurringType === 'weekly') {
    // Legacy vision results used 7 for Sunday; the current protocol uses 0.
    if (schedule.recurringDayOfWeek === undefined || day.getDay() !== schedule.recurringDayOfWeek % 7) return false
    if (schedule.recurringWeeks) {
      if (!schedule.date) return false // A course needs an explicit week-1 anchor.
      const week = Math.round((getMonday(day).getTime() - getMonday(parseDate(schedule.date)).getTime()) / 604800000) + 1
      return schedule.recurringWeeks.includes(week)
    }
    return true
  }
  return day.getDate() === schedule.recurringDayOfMonth
}

export function nextScheduleDate(schedule: ScheduleRule, from = formatDate(new Date())): string | null {
  if (!schedule.recurringType || schedule.recurringType === 'none') {
    return schedule.date && (schedule.endDate || schedule.date) >= from ? (schedule.date > from ? schedule.date : from) : null
  }
  if (schedule.recurringWeeks && !schedule.date) return null
  const start = parseDate(schedule.date && schedule.date > from ? schedule.date : from)
  // ponytail: scan at most a year for monthly dates and courses (up to 50 weeks).
  for (let offset = 0; offset < 366; offset++) {
    const date = formatDate(addDays(start, offset))
    if (scheduleOccursOn(schedule, date)) return date
  }
  return null
}

export function scheduleOccurrence<T extends ScheduleRule>(schedule: T, date: string): T {
  return schedule.recurringType && schedule.recurringType !== 'none' ? { ...schedule, date, endDate: date } : schedule
}

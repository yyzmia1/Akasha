export interface CourseItem {
  id: string
  name: string
  teacher?: string
  location?: string
  dayOfWeek: number // 1 - 7 (1 represents Monday, 7 represents Sunday)
  startSection: number // 1-based start section (e.g. 1)
  step: number // continuous sections (e.g. 2 for sections 1-2)
  weeks: number[] // sorted array of active weeks (e.g. [1, 2, 3, 4, ...])
  rawWeeksStr?: string // original week string representation (e.g. "1-16", "1-15单")
  color?: string // badge color hex
  notes?: string
}

export interface SectionTimeSlot {
  section: number
  startTime: string // "HH:mm"
  endTime: string // "HH:mm"
}

export interface AcademicScheduleConfig {
  semesterName: string
  semesterStartDate: string // YYYY-MM-DD (Monday of Week 1)
  totalWeeks: number // Default 20
  timeSlots: SectionTimeSlot[]
  courses: CourseItem[]
  targetAreaTitle: string // Default "学业"
  targetProjectTitle: string // Default "2026-2027学年第1学期课表"
  importMode: 'dates' | 'weekly' // 'dates' generates all dates, 'weekly' generates recurring weekly items
}

export const COURSE_COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#84cc16', // lime
  '#e11d48', // rose
  '#0284c7', // sky
]

export const DEFAULT_SECTION_TIMES: SectionTimeSlot[] = [
  { section: 1, startTime: '08:00', endTime: '08:45' },
  { section: 2, startTime: '08:55', endTime: '09:40' },
  { section: 3, startTime: '10:00', endTime: '10:45' },
  { section: 4, startTime: '10:55', endTime: '11:40' },
  { section: 5, startTime: '14:00', endTime: '14:45' },
  { section: 6, startTime: '14:55', endTime: '15:40' },
  { section: 7, startTime: '16:00', endTime: '16:45' },
  { section: 8, startTime: '16:55', endTime: '17:40' },
  { section: 9, startTime: '19:00', endTime: '19:45' },
  { section: 10, startTime: '19:55', endTime: '20:40' },
  { section: 11, startTime: '20:50', endTime: '21:35' },
  { section: 12, startTime: '21:45', endTime: '22:30' },
]

export type AcademicImportSource = 'crawler' | 'csv' | 'ics' | 'json'

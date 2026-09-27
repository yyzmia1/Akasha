import type { Project, ScheduleItem, TodoItem, Habit } from '@/types'

export type AiProviderType = 'deepseek' | 'openai' | 'siliconflow' | 'ollama' | 'newapi' | 'custom'

export interface AiProviderConfig {
  provider: AiProviderType
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  useProxy: boolean // 是否使用后端 Nginx 反向代理
}

export type CopilotMode = 'smart' | 'schedule' | 'todo' | 'habit'

export interface BaseDraftItem {
  id: string
  selected: boolean
  isConflict?: boolean
  conflictReason?: string
}

export interface ScheduleDraft extends BaseDraftItem {
  type: 'schedule'
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:mm
  endDate?: string // YYYY-MM-DD
  endTime?: string // HH:mm
  recurringType: 'none' | 'weekly' | 'monthly'
  recurringDayOfWeek?: number
  projectId?: string | null
  suggestedProjectTitle?: string
}

export interface TodoDraft extends BaseDraftItem {
  type: 'todo'
  title: string
  importance: number // 1-4
  startDate?: string
  startTime?: string
  dueDate?: string
  dueTime?: string
  notes?: string
  projectId?: string | null
  suggestedProjectTitle?: string
  subtasks?: string[]
}

export interface HabitDraft extends BaseDraftItem {
  type: 'habit'
  title: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'biweekly'
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'anytime'
  time?: string
  targetDaysOfWeek?: number[]
  targetCount?: number
  icon?: string
  color?: string
  projectId?: string | null
  suggestedProjectTitle?: string
}

export interface ProjectDraft extends BaseDraftItem {
  type: 'project'
  title: string
  color?: string
  description?: string
  areaId?: string
}

export interface CopilotPlanResult {
  reasoning: string
  projects: ProjectDraft[]
  schedules: ScheduleDraft[]
  todos: TodoDraft[]
  habits: HabitDraft[]
}

export interface CopilotMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  planResult?: CopilotPlanResult
  timestamp: number
}

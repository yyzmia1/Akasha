import type { Project, ScheduleItem, TodoItem, Habit } from '@/types'

export type AiProviderType = 'deepseek' | 'openai' | 'siliconflow' | 'ollama' | 'newapi' | 'custom'

// 单个 AI 接口端点配置定义（供文字或识图复用）
export interface SingleAiEndpointConfig {
  provider: AiProviderType
  baseUrl: string
  apiKey: string
  model: string
  temperature?: number
  useProxy: boolean // 是否使用后端 Nginx 反向代理
}

export interface AiProviderConfig {
  // === 主文字模式 API (Text / Chat Copilot) ===
  provider: AiProviderType
  baseUrl: string
  apiKey: string
  model: string
  temperature: number
  useProxy: boolean // 是否使用后端 Nginx 反向代理

  // === 独立图片识别 API (Vision / Multimodal API) ===
  visionSeparate?: boolean // 是否开启独立的图片识别配置 (true: 使用专用视觉API; false: 复用主文字API)
  visionProvider?: AiProviderType
  visionBaseUrl?: string
  visionApiKey?: string
  visionModel?: string
  visionUseProxy?: boolean
}

export type CopilotMode = 'smart' | 'area' | 'schedule' | 'todo' | 'habit'

export interface BaseDraftItem {
  id: string
  selected: boolean
  isConflict?: boolean
  conflictReason?: string
}

export interface AreaDraft extends BaseDraftItem {
  type: 'area'
  title: string
  color?: string
  icon?: string
  parentId?: string | null
  suggestedParentTitle?: string
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
  suggestedAreaTitle?: string
  notes?: string
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
  suggestedAreaTitle?: string
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
  description?: string
  projectId?: string | null
  suggestedProjectTitle?: string
  suggestedAreaTitle?: string
}

export interface ProjectDraft extends BaseDraftItem {
  type: 'project'
  title: string
  color?: string
  description?: string
  areaId?: string | null
  suggestedAreaTitle?: string
}

export interface CopilotPlanResult {
  reasoning: string
  areas: AreaDraft[]
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

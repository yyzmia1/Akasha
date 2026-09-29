import type { Project, ScheduleItem, Habit, Area } from '@/types'
import type { AiProviderConfig, CopilotMode, CopilotPlanResult } from '@/types/copilot'
export interface VisionCourseItem {
  id: string
  name: string
  dayOfWeek: number
  startSection: number
  step: number
  weeks: number[]
  rawWeeksStr?: string
  location?: string
  teacher?: string
  color?: string
}

export const VISION_COLOR_PALETTE = [
  '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
  '#10b981', '#06b6d4', '#f59e0b', '#84cc16', '#14b8a6',
]

export const AI_CONFIG_KEY = 'flow_os_ai_config'

export const DEFAULT_AI_CONFIG: AiProviderConfig = {
  provider: 'deepseek',
  baseUrl: 'https://api.deepseek.com',
  apiKey: '',
  model: 'deepseek-chat',
  temperature: 0.3,
  useProxy: false,
}

export const PROVIDER_PRESETS: Record<
  AiProviderConfig['provider'],
  { label: string; baseUrl: string; defaultModel: string; models: string[] }
> = {
  deepseek: {
    label: 'DeepSeek (深度求索)',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  openai: {
    label: 'OpenAI 官方',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'o1-mini'],
  },
  siliconflow: {
    label: 'SiliconFlow (硅基流动)',
    baseUrl: 'https://api.siliconflow.cn/v1',
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: [
      'deepseek-ai/DeepSeek-V3',
      'deepseek-ai/DeepSeek-R1',
      'Qwen/Qwen2.5-7B-Instruct',
      'Qwen/Qwen2.5-14B-Instruct',
    ],
  },
  ollama: {
    label: '本地 Ollama',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'qwen2.5:latest',
    models: ['qwen2.5:latest', 'llama3.2:latest', 'deepseek-r1:latest'],
  },
  newapi: {
    label: 'NewAPI / OneAPI 聚合平台',
    baseUrl: '',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'deepseek-chat', 'claude-3-5-sonnet-20241022'],
  },
  custom: {
    label: '自定义通用 OpenAI 接口',
    baseUrl: '',
    defaultModel: '',
    models: [],
  },
}

let memoryAiConfig: AiProviderConfig | null = null

export function loadAiConfig(): AiProviderConfig {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(AI_CONFIG_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return { ...DEFAULT_AI_CONFIG, ...parsed }
      }
    } else if (memoryAiConfig) {
      return { ...DEFAULT_AI_CONFIG, ...memoryAiConfig }
    }
  } catch (_e) {}
  return memoryAiConfig ? { ...DEFAULT_AI_CONFIG, ...memoryAiConfig } : { ...DEFAULT_AI_CONFIG }
}

let aiConfigChangeListeners: Array<(cfg: AiProviderConfig) => void> = []

export function onAiConfigChange(callback: (cfg: AiProviderConfig) => void): () => void {
  aiConfigChangeListeners.push(callback)
  return () => {
    aiConfigChangeListeners = aiConfigChangeListeners.filter((fn) => fn !== callback)
  }
}

export function notifyAiConfigChanged(cfg: AiProviderConfig) {
  for (const fn of aiConfigChangeListeners) {
    try {
      fn(cfg)
    } catch (_e) {}
  }
}

export function saveAiConfig(cfg: AiProviderConfig) {
  try {
    memoryAiConfig = { ...cfg }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(cfg))
    }
  } catch (_e) {}
  notifyAiConfigChanged(cfg)
}

function resolveEndpoint(cfg: AiProviderConfig, path: string): { url: string; headers: Record<string, string> } {
  let target = cfg.baseUrl.replace(/\/+$/, '')
  if (!target.endsWith('/v1') && cfg.provider !== 'deepseek') {
    // 很多代理平台如未带 /v1 则补全
    if (!target.includes('/chat/completions')) {
      // 保持用户原始输入或默认规则
    }
  }
  const cleanPath = path.startsWith('/') ? path : '/' + path
  const targetUrl = `${target}${cleanPath}`

  if (cfg.useProxy) {
    // 走 Nginx 内部反向代理通道
    return {
      url: `/api/ai-proxy${cleanPath}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey || ''}`,
        'X-Target-Url': targetUrl,
      },
    }
  }

  return {
    url: targetUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey || ''}`,
    },
  }
}

/**
 * 测试大模型连通性与响应延时
 */
export async function testAiConnection(
  cfg: AiProviderConfig
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  const startTime = Date.now()
  try {
    const { url, headers } = resolveEndpoint(cfg, '/chat/completions')
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
      }),
    })

    const latencyMs = Date.now() - startTime
    if (!res.ok) {
      const text = await res.text()
      let errMsg = `HTTP ${res.status}`
      try {
        const json = JSON.parse(text)
        if (json.error?.message) errMsg = json.error.message
      } catch (_e) {
        errMsg = text.substring(0, 100) || errMsg
      }
      return { success: false, latencyMs, message: `连接失败: ${errMsg}` }
    }

    return { success: true, latencyMs, message: `连接成功 (耗时: ${latencyMs}ms)` }
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: `网络请求失败: ${err.message || err}`,
    }
  }
}

/**
 * 组装注入系统的全景上下文
 */
export function buildSystemPrompt(params: {
  mode: CopilotMode
  areas: Area[]
  projects: Project[]
  schedules: ScheduleItem[]
  habits: Habit[]
  activeHours?: { start: string; end: string }
}): string {
  const now = new Date()
  const daysOfWeekZh = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  const dayOfWeekStr = daysOfWeekZh[now.getDay()]

  const projectListStr = params.projects
    .map((p) => `- 项目名称:「${p.title}」(ID: ${p.id})`)
    .join('\n') || '暂无项目'

  // 提取近期已有日程，供避碰参考
  const upcomingSchedulesStr = params.schedules
    .filter((s) => {
      const sDate = s.date || s.createdAt?.substring(0, 10)
      return sDate && sDate >= dateStr
    })
    .slice(0, 20)
    .map((s) => `- 日期: ${s.date} 时间: ${s.time || '全天'} ~ ${s.endTime || ''} 事项:「${s.title}」`)
    .join('\n') || '近期暂无排程冲突项'

  const activeHoursStr = params.activeHours
    ? `白天清醒工作时段: ${params.activeHours.start} 至 ${params.activeHours.end}`
    : '工作活动时段: 08:00 至 22:00'

  return `你是由 Akasha 个人效能管理系统驱动的顶尖 AI 个人效能副驾驶（Copilot），对标 Amie、Motion、Notion Calendar。
你的任务是将用户的自然语言需求转换为结构化、严谨、避开冲突且易于执行的日程、待办、习惯与项目。

【当前基准环境】
- 当前时间：${dateStr} ${timeStr} (${dayOfWeekStr})
- ${activeHoursStr}
- 现有已有项目列表：
${projectListStr}
- 近期已有日程安排（注意避让时间冲突）：
${upcomingSchedulesStr}

【当前指令处理模式】：${
    params.mode === 'smart'
      ? '智能复合全自动识别（根据指令同时拆解出项目、日程、待办、习惯）'
      : params.mode === 'schedule'
      ? '专一模式：仅提取日程安排（Schedules）'
      : params.mode === 'todo'
      ? '专一模式：仅提取待办事项（Todos）'
      : '专一模式：仅提取日常打卡习惯（Habits）'
  }

【排程与生成准则】
1. 日程 (Schedules)：必须明确具体的 date (YYYY-MM-DD) 与 time (HH:mm)。若用户没说时长，默认安排 30~60 分钟。尽量避开上述已知冲突。
2. 待办 (Todos)：必须有 title，重要程度 importance 为 1(低) 至 4(紧急高优)。若任务复杂，可拆解 1~3 个简洁子任务在 subtasks 数组中。
3. 习惯 (Habits)：识别周期性打卡事务。frequency 为 daily/weekly/monthly，timeSlot 为 morning/afternoon/evening/anytime，可带推荐具体打卡时刻 time。
4. 项目匹配：优先匹配上述已有项目名（填入 suggestedProjectTitle 或 projectId）；若属于全新事项主题且任务量大，可在 projects 数组中创建新项目。
5. 必须返回纯合法的 JSON 格式，包裹在 \`\`\`json ... \`\`\` 代码块中，不要输出其他无关客套废话！

JSON 输出协议结构如下：
\`\`\`json
{
  "reasoning": "用一两句亲切自然的话阐述你的排程思考与避碰考量（如：已为您将研讨安排在周二15:00，避开了上午已有会议...）",
  "projects": [
    { "id": "proj-temp-1", "title": "项目名", "color": "#3b82f6" }
  ],
  "schedules": [
    {
      "id": "sch-temp-1",
      "title": "日程标题",
      "date": "2026-09-29",
      "time": "15:00",
      "endDate": "2026-09-29",
      "endTime": "16:00",
      "recurringType": "none",
      "suggestedProjectTitle": "已有或拟定项目名"
    }
  ],
  "todos": [
    {
      "id": "todo-temp-1",
      "title": "待办名称",
      "importance": 3,
      "dueDate": "2026-09-29",
      "dueTime": "18:00",
      "notes": "备注要点",
      "subtasks": ["子步骤1", "子步骤2"],
      "suggestedProjectTitle": "关联项目名"
    }
  ],
  "habits": [
    {
      "id": "habit-temp-1",
      "title": "习惯名称",
      "frequency": "daily",
      "timeSlot": "morning",
      "time": "07:30",
      "targetDaysOfWeek": [1, 2, 3, 4, 5],
      "suggestedProjectTitle": "关联项目名"
    }
  ]
}
\`\`\``
}

/**
 * 流式调用大模型并实时派发文本块
 */
export async function streamPlanGeneration(
  prompt: string,
  systemPrompt: string,
  cfg: AiProviderConfig,
  onChunk: (accumulatedText: string) => void
): Promise<CopilotPlanResult> {
  const { url, headers } = resolveEndpoint(cfg, '/chat/completions')

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: cfg.model,
      temperature: cfg.temperature ?? 0.3,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`API 响应异常 [${res.status}]: ${errText}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取响应数据流')

  const decoder = new TextDecoder('utf-8')
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const dataStr = trimmed.replace(/^data:\s*/, '')
      if (dataStr === '[DONE]') continue

      try {
        const parsed = JSON.parse(dataStr)
        const choice = parsed.choices?.[0]
        const delta = (choice?.delta?.reasoning_content || '') + (choice?.delta?.content || '')
        if (delta) {
          fullText += delta
          onChunk(fullText)
        }
      } catch (_e) {}
    }
  }

  // 从 fullText 中提取 JSON
  return parsePlanResultFromText(fullText)
}

/**
 * 解析大模型返回的 JSON
 */
export function parsePlanResultFromText(text: string): CopilotPlanResult {
  let jsonStr = text
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  if (match) {
    jsonStr = match[1]
  } else {
    const firstBrace = text.indexOf('{')
    const lastBrace = text.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonStr = text.substring(firstBrace, lastBrace + 1)
    }
  }

  try {
    const obj = JSON.parse(jsonStr)
    return {
      reasoning: obj.reasoning || '',
      projects: (obj.projects || []).map((p: any, idx: number) => ({
        id: p.id || `proj-draft-${Date.now()}-${idx}`,
        title: p.title || '新项目',
        color: p.color || '#3b82f6',
        description: p.description,
        selected: true,
      })),
      schedules: (obj.schedules || []).map((s: any, idx: number) => ({
        id: s.id || `sch-draft-${Date.now()}-${idx}`,
        title: s.title || '拟定日程',
        date: s.date || new Date().toISOString().substring(0, 10),
        time: s.time || undefined,
        endDate: s.endDate || s.date || undefined,
        endTime: s.endTime || undefined,
        recurringType: s.recurringType || 'none',
        recurringDayOfWeek: s.recurringDayOfWeek,
        suggestedProjectTitle: s.suggestedProjectTitle,
        selected: true,
      })),
      todos: (obj.todos || []).map((t: any, idx: number) => ({
        id: t.id || `todo-draft-${Date.now()}-${idx}`,
        title: t.title || '拟定待办',
        importance: t.importance || 2,
        startDate: t.startDate,
        startTime: t.startTime,
        dueDate: t.dueDate,
        dueTime: t.dueTime,
        notes: t.notes,
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        suggestedProjectTitle: t.suggestedProjectTitle,
        selected: true,
      })),
      habits: (obj.habits || []).map((h: any, idx: number) => ({
        id: h.id || `habit-draft-${Date.now()}-${idx}`,
        title: h.title || '拟定习惯',
        frequency: h.frequency || 'daily',
        timeSlot: h.timeSlot || 'anytime',
        time: h.time,
        targetDaysOfWeek: h.targetDaysOfWeek,
        suggestedProjectTitle: h.suggestedProjectTitle,
        selected: true,
      })),
    }
  } catch (err: any) {
    throw new Error(`AI 返回内容未能成功解析为计划数据，请重试。\n原始返回:\n${text.substring(0, 300)}...`)
  }
}

export function parseWeeksString(str: string): number[] {
  if (!str) return Array.from({ length: 16 }, (_, i) => i + 1)
  const isOddOnly = str.includes('单')
  const isEvenOnly = str.includes('双')
  const weeks = new Set<number>()
  const rangeMatches = str.matchAll(/(\d+)\s*(?:-|至|~)\s*(\d+)/g)
  for (const m of rangeMatches) {
    const start = parseInt(m[1], 10)
    const end = parseInt(m[2], 10)
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      for (let w = start; w <= end; w++) {
        if (isOddOnly && w % 2 === 0) continue
        if (isEvenOnly && w % 2 !== 0) continue
        weeks.add(w)
      }
    }
  }
  const singleMatches = str.matchAll(/(?:^|[^\d-])(\d+)(?=[^\d-]|$)/g)
  for (const m of singleMatches) {
    const val = parseInt(m[1], 10)
    if (!isNaN(val) && val > 0 && val <= 50) {
      if (isOddOnly && val % 2 === 0) continue
      if (isEvenOnly && val % 2 !== 0) continue
      weeks.add(val)
    }
  }
  const arr = Array.from(weeks).sort((a, b) => a - b)
  return arr.length > 0 ? arr : Array.from({ length: 16 }, (_, i) => i + 1)
}

const SECTION_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:55', end: '09:40' },
  3: { start: '10:05', end: '10:50' },
  4: { start: '11:00', end: '11:45' },
  5: { start: '14:00', end: '14:45' },
  6: { start: '14:55', end: '15:40' },
  7: { start: '16:00', end: '16:45' },
  8: { start: '16:55', end: '17:40' },
  9: { start: '19:00', end: '19:45' },
  10: { start: '19:55', end: '20:40' },
  11: { start: '20:50', end: '21:35' },
}

/**
 * 将解析出的多模态排程/课表数据规范化并转为 CopilotPlanResult
 */
export function convertVisionDataToPlanResult(parsed: any): CopilotPlanResult {
  const todayStr = new Date().toISOString().substring(0, 10)
  const schedules: CopilotPlanResult['schedules'] = []
  const todos: CopilotPlanResult['todos'] = []
  const habits: CopilotPlanResult['habits'] = []
  const projects: CopilotPlanResult['projects'] = []

  // 1. 若模型返回标准 schedules
  if (Array.isArray(parsed.schedules)) {
    parsed.schedules.forEach((s: any, idx: number) => {
      schedules.push({
        id: s.id || `sch-vision-${Date.now()}-${idx}`,
        type: 'schedule',
        title: s.title || '拟定事项',
        date: s.date || todayStr,
        time: s.time,
        endDate: s.endDate || s.date || todayStr,
        endTime: s.endTime,
        recurringType: s.recurringType || 'none',
        recurringDayOfWeek: s.recurringDayOfWeek,
        suggestedProjectTitle: s.suggestedProjectTitle,
        selected: true,
      })
    })
  }

  // 2. 若模型提取出 courses 列表（作息/排课表形式）
  if (Array.isArray(parsed.courses)) {
    parsed.courses.forEach((c: any, idx: number) => {
      const startSec = Number(c.startSection) || 1
      const step = Number(c.step) || 2
      const endSec = Math.min(11, startSec + step - 1)
      const startTime = c.time || SECTION_TIMES[startSec]?.start || '08:00'
      const endTime = c.endTime || SECTION_TIMES[endSec]?.end || '09:40'
      const locStr = c.location ? ` (${c.location})` : ''
      const teacherStr = c.teacher ? ` · ${c.teacher}` : ''

      schedules.push({
        id: `sch-vision-course-${Date.now()}-${idx}`,
        type: 'schedule',
        title: `${c.name}${locStr}${teacherStr}`,
        date: c.date || todayStr,
        time: startTime,
        endDate: c.endDate || c.date || todayStr,
        endTime: endTime,
        recurringType: 'weekly',
        recurringDayOfWeek: Number(c.dayOfWeek) || 1,
        suggestedProjectTitle: parsed.semesterInfo?.semesterName || '日程排期',
        selected: true,
      })
    })

    if (parsed.semesterInfo?.semesterName && !projects.some((p) => p.title === parsed.semesterInfo.semesterName)) {
      projects.push({
        id: `proj-vision-${Date.now()}`,
        type: 'project',
        title: parsed.semesterInfo.semesterName,
        color: '#6366f1',
        selected: true,
      })
    }
  }

  // 3. 若模型提取出 todos
  if (Array.isArray(parsed.todos)) {
    parsed.todos.forEach((t: any, idx: number) => {
      todos.push({
        id: t.id || `todo-vision-${Date.now()}-${idx}`,
        type: 'todo',
        title: t.title || '待办事项',
        importance: t.importance || 2,
        startDate: t.startDate,
        startTime: t.startTime,
        dueDate: t.dueDate,
        dueTime: t.dueTime,
        notes: t.notes,
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
        suggestedProjectTitle: t.suggestedProjectTitle,
        selected: true,
      })
    })
  }

  // 4. 若模型提取出 habits
  if (Array.isArray(parsed.habits)) {
    parsed.habits.forEach((h: any, idx: number) => {
      habits.push({
        id: h.id || `habit-vision-${Date.now()}-${idx}`,
        type: 'habit',
        title: h.title || '规律习惯',
        frequency: h.frequency || 'daily',
        timeSlot: h.timeSlot || 'anytime',
        time: h.time,
        targetDaysOfWeek: h.targetDaysOfWeek,
        suggestedProjectTitle: h.suggestedProjectTitle,
        selected: true,
      })
    })
  }

  const count = schedules.length + todos.length + habits.length
  return {
    reasoning: parsed.reasoning || `AI 视觉模型已从图片中解析出 ${count} 项排程与规划。`,
    projects,
    schedules,
    todos,
    habits,
  }
}

/**
 * 使用多模态视觉模型 (Vision) 识别图片中的排程与计划，转换为 CopilotPlanResult
 */
export async function recognizeScheduleFromImage(
  base64Image: string,
  userInstruction?: string,
  configOverride?: AiProviderConfig
): Promise<CopilotPlanResult> {
  const cfg = configOverride || loadAiConfig()

  if (!cfg.apiKey && cfg.provider !== 'ollama') {
    throw new Error('未检测到有效的 AI 接口密钥，请先在【AI 个人效能配置】中配置 API Key。建议使用支持视觉识别的模型（如 OpenAI gpt-4o-mini 或 SiliconFlow Qwen2.5-VL）。')
  }

  // 格式化 Data URI
  let imageUrl = base64Image
  if (!imageUrl.startsWith('data:')) {
    imageUrl = `data:image/jpeg;base64,${imageUrl}`
  }

  // 构建通用的排程多模态识图 Prompt
  const systemPrompt = `你是一个世界顶尖的日程图片与排程结构化解析专家。
请仔细分析用户上传的日程图片（包括作息表、日程清单、日历截图、会议安排、课程表、排班表、学习计划等）。
精准提取出图片中包含的所有日程、任务待办、习惯与归属项目，并严格按如下 JSON 结构输出：

{
  "reasoning": "一两句话概括识别结果与排程说明",
  "projects": [
    {
      "title": "项目名称 (例如 学业/工作/健康，如无可省略)",
      "color": "#3b82f6"
    }
  ],
  "schedules": [
    {
      "title": "日程事项名称 (如 高等数学 或 团队周会，如有地点可合并入标题)",
      "date": "YYYY-MM-DD，若图片有具体日期则填，若为每周周期表可填当日日期",
      "time": "HH:mm，开始时间 (如 08:00)",
      "endTime": "HH:mm，结束时间 (如 09:40)",
      "recurringType": "none 或 weekly (若为周期性作息/课表请填 weekly)",
      "recurringDayOfWeek": 1, // 周期性日程对应的星期几：1代表周一...7代表周日 (必须为数字 1-7)
      "suggestedProjectTitle": "对应项目名称"
    }
  ],
  "todos": [
    {
      "title": "待办任务名称",
      "importance": 2, // 重要度 1-4 (4最高)
      "dueDate": "YYYY-MM-DD (可选)",
      "subtasks": []
    }
  ],
  "habits": [
    {
      "title": "习惯名称",
      "frequency": "daily",
      "timeSlot": "morning"
    }
  ]
}

【提取规则要求】：
1. 完整提取图片中的每一项安排，不要遗漏；
2. 若为周课表/周作息表，请为每项日程标注 recurringType: "weekly" 和 recurringDayOfWeek (1-7)；
3. 只返回包含 JSON 内容的 Markdown 代码块，即以 \`\`\`json 开头，以 \`\`\` 结尾，严禁输出任何多余的寒暄或解释。`

  const userPrompt = userInstruction
    ? `请识别这张图片中的所有排程与安排。特别说明：${userInstruction}`
    : '请识别这张图片中的所有排程与计划，结构化提取每项事项的名称、时间、日期或周期星期几、教室/地点等。'

  const { url, headers } = resolveEndpoint(cfg, '/chat/completions')

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl
          }
        }
      ]
    }
  ]

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: 0.1,
      }),
    })
  } catch (err: any) {
    throw new Error(`连接 AI 视觉接口失败: ${err?.message || '网络请求错误，请检查接口地址或反向代理配置'}`)
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    if (res.status === 400 || errorBody.toLowerCase().includes('vision') || errorBody.toLowerCase().includes('image') || errorBody.toLowerCase().includes('multimodal')) {
      throw new Error(`当前配置的模型 (${cfg.model}) 无法接收图像输入。\n建议在【AI 个人效能配置】中切换为支持视觉识别的模型（例如 OpenAI gpt-4o-mini / gpt-4o，或 SiliconFlow Qwen2.5-VL 等）。\n服务器返回: ${errorBody.substring(0, 200)}`)
    }
    throw new Error(`AI 视觉识图接口返回异常 (${res.status}): ${errorBody.substring(0, 300)}`)
  }

  const data = await res.json()
  const rawContent = data.choices?.[0]?.message?.content || ''
  if (!rawContent) {
    throw new Error('AI 未返回任何识别内容，请重试或更换更清晰的图片。')
  }

  // 解析并转换为 CopilotPlanResult
  const parsedRes = parseRecognizedScheduleContent(rawContent)
  return parsedRes.planResult
}

/**
 * 解析并规范化 AI 识图返回的 JSON 内容，同时输出 courses 列表与 CopilotPlanResult
 */
export function parseRecognizedScheduleContent(rawContent: string): {
  courses: VisionCourseItem[]
  semesterInfo: any
  planResult: CopilotPlanResult
  rawContent: string
} {
  let cleaned = rawContent.trim()
  if (cleaned.includes('```json')) {
    cleaned = cleaned.replace(/```json\s*([\s\S]*?)\s*```/g, '$1').trim()
  } else if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/```\s*([\s\S]*?)\s*```/g, '$1').trim()
  }

  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch (_e) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0])
      } catch (err) {
        throw new Error(`解析 AI 返回的排程 JSON 数据失败: ${(err as Error).message}\n返回片段:\n${cleaned.substring(0, 300)}`)
      }
    } else {
      throw new Error(`AI 未返回符合规范的 JSON 排程格式。\n返回片段:\n${cleaned.substring(0, 300)}`)
    }
  }

  const rawCourses = Array.isArray(parsed.courses) ? parsed.courses : []
  const courses: VisionCourseItem[] = []

  rawCourses.forEach((c: any, index: number) => {
    if (!c.name || typeof c.name !== 'string') return
    const name = c.name.trim()
    if (!name) return

    let dayOfWeek = Number(c.dayOfWeek) || 1
    if (dayOfWeek < 1 || dayOfWeek > 7) dayOfWeek = 1

    let startSection = Number(c.startSection) || 1
    if (startSection < 1) startSection = 1

    let step = Number(c.step) || 2
    if (step < 1) step = 1

    let weeks: number[] = []
    if (Array.isArray(c.weeks) && c.weeks.length > 0) {
      weeks = Array.from(new Set(c.weeks.map(Number).filter((n: number) => !isNaN(n) && n > 0 && n <= 50))).sort((a, b) => a - b)
    } else if (c.rawWeeksStr) {
      weeks = parseWeeksString(String(c.rawWeeksStr))
    }
    if (weeks.length === 0) {
      weeks = Array.from({ length: 16 }, (_, i) => i + 1)
    }

    const color = c.color || VISION_COLOR_PALETTE[index % VISION_COLOR_PALETTE.length]

    courses.push({
      id: `ai-course-${Date.now()}-${index}`,
      name,
      dayOfWeek,
      startSection,
      step,
      weeks,
      rawWeeksStr: c.rawWeeksStr || `${weeks[0]}-${weeks[weeks.length - 1]}周`,
      location: c.location ? String(c.location).trim() : undefined,
      teacher: c.teacher ? String(c.teacher).trim() : undefined,
      color,
    })
  })

  // 如果原本就有 courses，更新 parsed.courses 便于转换为 planResult
  if (courses.length > 0) {
    parsed.courses = courses
  }

  const planResult = convertVisionDataToPlanResult(parsed)

  return {
    courses,
    semesterInfo: parsed.semesterInfo || {},
    planResult,
    rawContent,
  }
}


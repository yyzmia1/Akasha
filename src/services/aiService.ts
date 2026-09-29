import type { Project, ScheduleItem, Habit, Area } from '@/types'
import type { AiProviderConfig, CopilotMode, CopilotPlanResult } from '@/types/copilot'
import type { CourseItem, RecognizedScheduleResult } from '@/types/academic'
import { COURSE_COLOR_PALETTE } from '@/types/academic'
import { parseWeeksString } from '@/utils/academicParser'

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

/**
 * 使用多模态视觉模型 (Vision) 识别课程表图片并结构化提取课程信息
 */
export async function recognizeScheduleFromImage(
  base64Image: string,
  userInstruction?: string,
  configOverride?: AiProviderConfig
): Promise<RecognizedScheduleResult> {
  const cfg = configOverride || loadAiConfig()

  if (!cfg.apiKey && cfg.provider !== 'ollama') {
    throw new Error('未检测到有效的 AI 接口密钥，请先在【设置 -> AI 个人效能配置】中配置 API Key。建议使用支持视觉识别的模型（如 OpenAI gpt-4o-mini 或 SiliconFlow Qwen2.5-VL）。')
  }

  // 格式化 Data URI
  let imageUrl = base64Image
  if (!imageUrl.startsWith('data:')) {
    imageUrl = `data:image/jpeg;base64,${imageUrl}`
  }

  // 构建专门的系统识别 Prompt
  const systemPrompt = `你是一个世界顶尖的课程表图像识别与排课结构化提取专家。
请仔细分析用户上传的课程表图片（包括教务系统截图、排课软件截图、手机课表、纸质作息表照片等）。
精准提取出表格中出现的每一门课程排期，并严格按如下 JSON 结构输出：

{
  "semesterInfo": {
    "semesterName": "如 2026年秋季学期 或 2026-2027学年第1学期 (若图片中可见)",
    "semesterStartDate": "开学首周周一日期 YYYY-MM-DD，若有则填，无则留空",
    "totalWeeks": 16
  },
  "courses": [
    {
      "name": "课程名称 (如 高等数学)",
      "dayOfWeek": 1, // 星期几：1代表周一，2代表周二，...，7代表周日 (必须为数字 1-7)
      "startSection": 1, // 开始节次数字 (如 1, 3, 5, 7, 9，若课表显示时间 08:00 请按常见节次映射为 1)
      "step": 2, // 连续上几节课 (如 1-2节连上为 2，3节连上为 3)
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], // 整数周次数组 (如1-16周，单周[1,3,5...]，双周[2,4,6...])
      "rawWeeksStr": "1-16周", // 原始周次文字
      "location": "教室或地点 (如 主楼401、理学院102、操场等，可选)",
      "teacher": "授课教师 (如 张老师，可选)"
    }
  ]
}

【提取规则要求】：
1. 必须尽可能完整地提取出课表中的全部课程，不要遗漏；
2. 同一门课程如果在不同星期或不同节次上课，请分别拆分为独立的课程条目；
3. 周次如标注“单周”请只包含奇数周，“双周”请只包含偶数周；
4. 只返回包含 JSON 内容的 Markdown 代码块，即以 \`\`\`json 开头，以 \`\`\` 结尾，严禁输出任何多余的寒暄或解释。`

  const userPrompt = userInstruction
    ? `请识别这张课程表图片中的所有课程排期。特别说明：${userInstruction}`
    : '请识别这张课程表图片中的所有课程排期，结构化提取每门课的名称、星期几、开始节次、节数、周次、教室与教师。'

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
    // 专门针对非 Vision 模型给出贴心指引
    if (res.status === 400 || errorBody.toLowerCase().includes('vision') || errorBody.toLowerCase().includes('image') || errorBody.toLowerCase().includes('multimodal')) {
      throw new Error(`当前配置的模型 (${cfg.model}) 无法接收图像输入。\n建议在【设置 -> AI 个人效能配置】中切换为支持视觉识别的模型（例如 OpenAI gpt-4o-mini / gpt-4o，或 SiliconFlow Qwen2.5-VL 等）。\n服务器返回: ${errorBody.substring(0, 200)}`)
    }
    throw new Error(`AI 视觉识图接口返回异常 (${res.status}): ${errorBody.substring(0, 300)}`)
  }

  const data = await res.json()
  const rawContent = data.choices?.[0]?.message?.content || ''
  if (!rawContent) {
    throw new Error('AI 未返回任何识别内容，请重试或更换更清晰的课表截图。')
  }

  // 解析 JSON 内容
  return parseRecognizedScheduleContent(rawContent)
}

/**
 * 解析并规范化 AI 识图返回的 JSON 内容
 */
export function parseRecognizedScheduleContent(rawContent: string): RecognizedScheduleResult {
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
        throw new Error(`解析 AI 返回的课表 JSON 数据失败: ${(err as Error).message}\n返回片段:\n${cleaned.substring(0, 300)}`)
      }
    } else {
      throw new Error(`AI 未返回符合规范的 JSON 课表格式。\n返回片段:\n${cleaned.substring(0, 300)}`)
    }
  }

  const rawCourses = Array.isArray(parsed.courses) ? parsed.courses : (Array.isArray(parsed) ? parsed : [])
  const courses: CourseItem[] = []

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

    const color = c.color || COURSE_COLOR_PALETTE[index % COURSE_COLOR_PALETTE.length]

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

  return {
    courses,
    semesterInfo: parsed.semesterInfo || {},
    rawContent,
  }
}


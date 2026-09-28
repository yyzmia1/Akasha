import type { Project, ScheduleItem, Habit, Area } from '@/types'
import type { AiProviderConfig, CopilotMode, CopilotPlanResult } from '@/types/copilot'

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

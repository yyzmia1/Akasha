import type { Project, ScheduleItem, Habit, Area } from '@/types'
import type { AiProviderConfig, CopilotMode, CopilotPlanResult, SingleAiEndpointConfig, AiProviderType } from '@/types/copilot'
import { buildAreaTree, flattenAreaTree } from '@/utils/areaTree'
import { pb } from '@/sync/pocketbase'
import { normalizePriority } from '@/utils/priority'
import { normalizeTargetCount } from '@/utils/habit'
import { formatDate, getMonday, parseDate } from '@/utils/date'
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
  // === 主文字模式 API ===
  provider: 'custom',
  baseUrl: '',
  apiKey: '',
  model: '',
  temperature: 0.3,
  useProxy: false,

  // === 独立图片识别 API ===
  visionSeparate: false,
  visionProvider: 'custom',
  visionBaseUrl: '',
  visionApiKey: '',
  visionModel: '',
  visionUseProxy: false,
}

/**
 * 提取主文字模式端点配置
 */
export function getTextConfig(cfg: AiProviderConfig): SingleAiEndpointConfig {
  return {
    provider: cfg.provider || 'custom',
    baseUrl: cfg.baseUrl?.trim() || '',
    apiKey: cfg.apiKey?.trim() || '',
    model: cfg.model?.trim() || '',
    temperature: cfg.temperature ?? 0.3,
    useProxy: !!cfg.useProxy,
  }
}

/**
 * 提取图片识图端点配置：开启独立配置时由用户填写，未开启时直接复用文字模型口子
 */
export function getVisionConfig(cfg: AiProviderConfig): SingleAiEndpointConfig {
  if (cfg.visionSeparate) {
    return {
      provider: cfg.visionProvider || 'custom',
      baseUrl: cfg.visionBaseUrl?.trim() || cfg.baseUrl?.trim() || '',
      apiKey: cfg.visionApiKey?.trim() || cfg.apiKey?.trim() || '',
      model: cfg.visionModel?.trim() || cfg.model?.trim() || '',
      temperature: 0.1,
      useProxy: cfg.visionUseProxy !== undefined ? !!cfg.visionUseProxy : !!cfg.useProxy,
    }
  }

  // 未开启独立识图模型，直接复用文字模型
  return getTextConfig(cfg)
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

export function resolveEndpoint(
  cfg: { baseUrl: string; apiKey?: string; useProxy?: boolean; provider?: string },
  path: string
): { url: string; headers: Record<string, string> } {
  const rawBase = (cfg.baseUrl || '').trim()
  if (!rawBase) {
    throw new Error('未配置 API 接口地址 (Base URL)。请点击右上角「设置」图标填写有效的 AI 接口地址。')
  }

  let target = rawBase
  // 1. 若用户未填写协议头，补全 https://
  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target
  }

  // 2. 移除末尾多余斜杠
  target = target.replace(/\/+$/, '')

  // 3. 避免用户粘贴完整接口地址导致重复拼接（如 /chat/completions/chat/completions）
  target = target.replace(/\/chat\/completions\/?$/i, '')

  // 4. 对部分知名平台补全 /v1
  if (!target.endsWith('/v1') && cfg.provider !== 'deepseek') {
    if (target.endsWith('api.openai.com') || target.endsWith('api.siliconflow.cn')) {
      target = target + '/v1'
    }
  }

  const cleanPath = path.startsWith('/') ? path : '/' + path
  const targetUrl = target + cleanPath

  if (cfg.useProxy) {
    // 走 Nginx 或 Vite 开发服务器内部反向代理通道（绕过浏览器跨域 CORS 限制）
    return {
      url: '/api/ai-proxy' + cleanPath,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + (cfg.apiKey || ''),
        'X-Target-Url': targetUrl,
        'X-Akasha-Token': pb.authStore.token || '',
      },
    }
  }

  return {
    url: targetUrl,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (cfg.apiKey || ''),
    },
  }
}

/**
 * 测试大模型连通性与响应延时 (支持主文字配置与独立图片识别配置)
 */
export async function testAiConnection(
  cfg: { baseUrl: string; apiKey?: string; model: string; useProxy?: boolean; provider?: string }
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
    const errMsg = String(err?.message || err || '')
    let formattedMsg = '网络请求失败: ' + errMsg
    if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || err instanceof TypeError) {
      if (!cfg.useProxy) {
        formattedMsg = '连接失败 (Failed to fetch): 受到浏览器跨域 (CORS) 拦截。公网接口请开启【使用服务器反向代理】，或使用支持跨域的接口。'
      } else {
        formattedMsg = '代理连接失败 (Failed to fetch): 无法访问反向代理服务，请检查服务状态。'
      }
    }
    return {
      success: false,
      latencyMs: Date.now() - startTime,
      message: formattedMsg,
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

  // 格式化现有领域树，提供层级深度与父子归属结构
  const areaTree = buildAreaTree(params.areas || [])
  const flatAreas = flattenAreaTree(areaTree)
  const areaListStr = flatAreas.length > 0
    ? flatAreas
        .map((a) => {
          const indent = '  '.repeat(a.depth)
          const roleStr = a.depth === 0 ? '顶级领域' : '子领域'
          const parentDesc = a.parentId ? `, 上级领域ID: ${a.parentId}` : ''
          return `${indent}- ${roleStr}:「${a.title}」(ID: ${a.id}${parentDesc})`
        })
        .join('\n')
    : '暂无已有领域'

  const areaMap = new Map<string, string>()
  for (const a of params.areas || []) {
    areaMap.set(a.id, a.title)
  }

  const projectListStr = (params.projects || [])
    .map((p) => {
      const areaTitle = p.areaId ? areaMap.get(p.areaId) : null
      return `- 项目名称:「${p.title}」(ID: ${p.id}${areaTitle ? `, 所属领域:「${areaTitle}」` : ''})`
    })
    .join('\n') || '暂无项目'

  // 提取近期已有日程，供上下文参考
  const upcomingSchedulesStr = params.schedules
    .filter((s) => {
      const sDate = s.date || s.createdAt?.substring(0, 10)
      return sDate && sDate >= dateStr
    })
    .slice(0, 20)
    .map((s) => `- 日期: ${s.date} 时间: ${s.time || '全天'} ~ ${s.endTime || ''} 事项:「${s.title}」`)
    .join('\n') || '近期暂无其他排程'

  const activeHoursStr = params.activeHours
    ? `活跃工作时段: ${params.activeHours.start} 至 ${params.activeHours.end}`
    : '活跃工作时段: 08:00 至 22:00'

  return `你是由 Akasha 个人效能管理系统驱动的顶尖 AI 效能架构师与智能副驾驶（Copilot），深度融合 PARA 组织架构体系、GTD 工作流与时间块（Time-blocking）排程法，对标 Amie、Motion、Notion Calendar 与 Things 3。
你的职责是精准理解用户的自然语言输入，以用户描述为第一准则，将其转化为高结构化、严谨清晰、逻辑闭环的领域架构、攻坚项目、时间块日程、待办清单与日常习惯。

【当前基准环境】
- 当前时间：${dateStr} ${timeStr} (${dayOfWeekStr})
- ${activeHoursStr}（当用户未指定具体时刻且需自主推导时参考；若用户明确指明时间则无条件遵从用户输入）
- 现有已有领域结构（支持无限层级父子树形嵌套）：
${areaListStr}
- 现有已有项目列表（可直接挂载关联）：
${projectListStr}
- 近期已有日程排期（仅作为生活/工作节奏背景参考，绝非避让限制）：
${upcomingSchedulesStr}

【当前指令处理模式】：${
    params.mode === 'smart'
      ? '智能复合全自动识别（根据指令自动提取或规划领域体系、项目、日程、待办、习惯）'
      : params.mode === 'area'
      ? '专一模式：仅规划与提取领域架构（Areas）及关联项目（Projects）'
      : params.mode === 'schedule'
      ? '专一模式：仅提取日程安排（Schedules）'
      : params.mode === 'todo'
      ? '专一模式：仅提取待办事项（Todos）'
      : '专一模式：仅提取日常打卡习惯（Habits）'
  }

【排程与生成准则】
1. 领域 (Areas - Level 1 顶层分类)：
   - 语义定位：代表人生与效能管理的高层级顶层分类（如：技术研发、商业经营、身心健康、财务理财、家庭生活等），支持无限层级树形父子嵌套（如“技术研发”下设“计算机科学”，“计算机科学”下设“前端工程”）。
   - 单独领域创建准则：
     * 当用户明确要求新建/增加某个领域（如：“新建一个生活领域”、“帮我建一个心理学大类”），必须在 areas 数组中输出该领域。
     * 【极其关键】：若用户仅要求创建领域，未要求生成具体项目或排程，绝对不要凭空捏造多余的虚构待办或日程，务必保持 projects, schedules, todos, habits 为空数组 []，以维护界面的纯粹与专注！
   - 树形层级关联：
     * 若为顶级根领域：parentId 必须设为 null。
     * 若挂载至基准环境中已有的领域：parentId 填入该已有领域的真实 ID。
     * 若本次规划中同时创建了父领域与子领域：父领域 parentId 填 null，子领域填入 suggestedParentTitle（设为父领域的 title），系统会自动完成拓扑排序并建立父子层级关系。
   - 推荐配色规范 (color)：科技蓝 #3b82f6、翡翠绿 #10b981、极客紫 #8b5cf6、琥珀金 #f59e0b、松石青 #06b6d4、玫瑰粉 #ec4899、活力橙 #f97316、板岩灰 #64748b。

2. 项目 (Projects - Level 2 阶段性交付)：
   - 语义定位：具备明确交付标准、产出物或阶段性目标的中周期攻坚目标（如“Akasha PWA 改造”、“软考系统架构师备考”）。
   - 领域归属：优先关联基准环境中的已有领域（填入 areaId），或关联本次新建的领域（填入 suggestedAreaTitle）；若无特定归属可留空。

3. 日程 (Schedules - Level 3 刚性时间块)：
   - 语义定位：硬性时间承诺与时间块安排，在日历特定时段占据排期（如会议、考试、预约、出行、专有时段、并行任务等）。
   - 【第一核心准则：以用户描述为第一准则】：
     * 用户的自然语言描述是排程的绝对第一准则！凡是用户明确指出的具体日期、时间点或起止时段（如“下午2点到4点”、“明天上午10点”、“周五全天”），必须 100% 严格忠实采用，绝不擅自更改、推迟、错开或顺延用户要求的时间。
   - 【第二核心准则：日程支持并允许重复交叠，无需专门排程分开】：
     * 日程完全可以重复交叠、同时进行、多轨并行或相互包含（例如同一时段内同时进行两场活动、并行事项、双轨排程、包含在长会议中的专项汇报等）。
     * 严禁专门排程变成分开的、互不重叠的日程！绝对不要因为时间重叠而强行错开排到其他时间段，也绝不要把并发交叠的事项强行拆分成先后独立的时间块。用户描述在什么时间，就排在什么时间，允许并完全支持时间完全重合或部分交叠。
     * 基准环境中的“近期已有日程排期”仅供了解用户的活动背景参考，绝不是避让或排斥冲突的依据。严禁为了所谓“避碰”而擅自修改用户指定的时间。
   - 相对时间换算：必须以基准时间（${dateStr} ${timeStr} ${dayOfWeekStr}）为准，将“今天”、“明天”、“后天”、“本周五”、“下周一”严格换算为公历绝对日期 YYYY-MM-DD，严禁在 date 字段中输出相对词汇。
   - 时间跨度：必须明确 date (YYYY-MM-DD)、time (HH:mm) 及 endTime (HH:mm)。若用户未明确时长，常规事项默认安排 30~60 分钟；若用户完全未指定具体时段，可结合当前时间与活跃时段推导，但用户一旦有任何明确时间偏好，一律以用户描述为准。

4. 待办 (Todos - Level 4 柔性任务动作)：
   - 语义定位：具体的执行行动项。
   - 字段规范：title 必须为清晰具体的动宾结构（如“整理季度复盘数据报告”）；importance 评级为 1(极低) 至 10(最高)，普通任务为 5，紧急任务为 9–10；若任务步骤较多，可在 subtasks 中拆解 1~3 个简洁、具备直接落地行动力的子任务步骤。

5. 习惯 (Habits - Level 5 周期微习惯)：
   - 语义定位：高频自律打卡事务。
   - 字段规范：明确 frequency ('daily' | 'weekly' | 'monthly') 与 timeSlot ('morning' | 'afternoon' | 'evening' | 'anytime')，可推荐具体触发时刻 time；targetCount 为每周期目标次数，必须为正整数（如每周三次填 3）。

6. 严格输出协议与防幻觉约束：
   - 必须且仅输出合法的纯 JSON 文本，包裹在 \`\`\`json ... \`\`\` 代码块中。
   - 严禁在代码块之外输出任何多余的寒暄客套或解释说明（所有思考汇报与决策解释必须写入 JSON 顶层的 reasoning 字段中）。
   - 必须全量输出所有 5 个数组 key（areas, projects, schedules, todos, habits），无对应数据的项必须填充为空数组 []，不可省略 key。

JSON 输出协议结构如下：
\`\`\`json
{
  "reasoning": "用一两句亲切自然的话阐述你的领域架构规划、排程思考与要点说明...",
  "areas": [
    {
      "id": "area-temp-1",
      "title": "技术研发",
      "color": "#3b82f6",
      "parentId": null
    },
    {
      "id": "area-temp-2",
      "title": "人工智能",
      "color": "#8b5cf6",
      "suggestedParentTitle": "技术研发"
    }
  ],
  "projects": [
    {
      "id": "proj-temp-1",
      "title": "大模型微调实践",
      "description": "项目核心目标与主要交付成果说明",
      "color": "#3b82f6",
      "suggestedAreaTitle": "人工智能"
    }
  ],
  "schedules": [
    {
      "id": "sch-temp-1",
      "title": "项目研讨会",
      "date": "${dateStr}",
      "time": "15:00",
      "endDate": "${dateStr}",
      "endTime": "16:00",
      "recurringType": "none",
      "notes": "会议地点、议程或详细说明",
      "suggestedProjectTitle": "大模型微调实践"
    }
  ],
  "todos": [
    {
      "id": "todo-temp-1",
      "title": "梳理微调训练数据集结构",
      "importance": 8,
      "dueDate": "${dateStr}",
      "dueTime": "18:00",
      "notes": "优先清洗并校验 JSONL 格式",
      "subtasks": ["清洗异常文本", "验证分词器长度"],
      "suggestedProjectTitle": "大模型微调实践"
    }
  ],
  "habits": [
    {
      "id": "habit-temp-1",
      "title": "阅读 AI 前沿顶会论文",
      "frequency": "daily",
      "targetCount": 1,
      "timeSlot": "morning",
      "time": "08:30",
      "targetDaysOfWeek": [1, 2, 3, 4, 5],
      "description": "习惯执行细则、奖励或动机提示",
      "suggestedProjectTitle": "大模型微调实践"
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
  cfg: AiProviderConfig | SingleAiEndpointConfig,
  onChunk: (accumulatedText: string) => void,
  signal?: AbortSignal
): Promise<CopilotPlanResult> {
  const { url, headers } = resolveEndpoint(cfg, '/chat/completions')

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      signal,
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
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw err
    }
    const errMsg = String(err?.message || err || '')
    if (
      errMsg.includes('Failed to fetch') ||
      errMsg.includes('NetworkError') ||
      err instanceof TypeError
    ) {
      if (!cfg.useProxy) {
        throw new Error(
          '接口请求失败 (Failed to fetch)。\n由于浏览器跨域 (CORS) 限制，多数公网大模型服务（如 DeepSeek、OpenAI）不允许前端直接发起跨域请求。\n建议：\n1. 在 Copilot 设置中开启【使用服务器反向代理】；\n2. 检查接口地址 [' + url + '] 是否有效、网络是否通畅。'
        )
      } else {
        throw new Error(
          '反向代理请求失败 (Failed to fetch)。\n无法连接到代理服务 [' + url + ']。请检查服务是否正常启动，或目标地址 [' + (headers['X-Target-Url'] || '') + '] 是否可达。'
        )
      }
    }
    throw err
  }

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`API 响应异常 [${res.status}]: ${errText}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取响应数据流')

  const decoder = new TextDecoder('utf-8')
  let fullText = ''
  let buffer = ''

  try {
    reading: while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue
        const dataStr = trimmed.replace(/^data:\s*/, '')
        if (dataStr === '[DONE]') {
          await reader.cancel()
          break reading
        }

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
  } finally {
    reader.releaseLock()
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
      areas: (obj.areas || []).map((a: any, idx: number) => ({
        id: a.id || `area-draft-${Date.now()}-${idx}`,
        type: 'area',
        title: a.title || '新领域',
        color: a.color || '#3b82f6',
        icon: a.icon,
        parentId: a.parentId || null,
        suggestedParentTitle: a.suggestedParentTitle,
        selected: true,
      })),
      projects: (obj.projects || []).map((p: any, idx: number) => ({
        id: p.id || `proj-draft-${Date.now()}-${idx}`,
        type: 'project',
        title: p.title || '新项目',
        color: p.color || '#3b82f6',
        description: p.description,
        areaId: p.areaId || null,
        suggestedAreaTitle: p.suggestedAreaTitle,
        selected: true,
      })),
      schedules: (obj.schedules || []).map((s: any, idx: number) => ({
        id: s.id || `sch-draft-${Date.now()}-${idx}`,
        type: 'schedule',
        title: s.title || '拟定日程',
        date: s.date || (s.recurringWeeks ? '' : formatDate(new Date())),
        time: s.time || undefined,
        endDate: s.endDate || s.date || undefined,
        endTime: s.endTime || undefined,
        recurringType: s.recurringType || 'none',
        recurringDayOfWeek: s.recurringDayOfWeek === undefined ? undefined : Number(s.recurringDayOfWeek) % 7,
        recurringDayOfMonth: s.recurringDayOfMonth,
        recurringWeeks: s.recurringWeeks,
        notes: s.notes || s.description || undefined,
        suggestedProjectTitle: s.suggestedProjectTitle,
        selected: true,
      })),
      todos: (obj.todos || []).map((t: any, idx: number) => ({
        id: t.id || `todo-draft-${Date.now()}-${idx}`,
        type: 'todo',
        title: t.title || '拟定待办',
        importance: normalizePriority(t.importance),
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
        type: 'habit',
        title: h.title || '拟定习惯',
        frequency: h.frequency || 'daily',
        timeSlot: h.timeSlot || 'anytime',
        time: h.time,
        targetDaysOfWeek: h.targetDaysOfWeek,
        targetCount: normalizeTargetCount(h.targetCount),
        description: h.description || h.notes || undefined,
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
  const todayStr = formatDate(new Date())
  const schedules: CopilotPlanResult['schedules'] = []
  const todos: CopilotPlanResult['todos'] = []
  const habits: CopilotPlanResult['habits'] = []
  const projects: CopilotPlanResult['projects'] = parsePlanResultFromText(JSON.stringify({ projects: parsed.projects || [] })).projects

  // 1. 若模型返回标准 schedules
  if (Array.isArray(parsed.schedules)) {
    parsed.schedules.forEach((s: any, idx: number) => {
      const courseWeeks = s.recurringWeeks || s.weeks
      schedules.push({
        id: s.id || `sch-vision-${Date.now()}-${idx}`,
        type: 'schedule',
        title: s.title || '拟定事项',
        date: courseWeeks ? (parsed.semesterInfo?.startDate ? formatDate(getMonday(parseDate(parsed.semesterInfo.startDate))) : s.date || '') : s.date || todayStr,
        time: s.time,
        endDate: s.endDate || s.date || todayStr,
        endTime: s.endTime,
        recurringType: s.recurringType || 'none',
        recurringDayOfWeek: s.recurringDayOfWeek === undefined ? undefined : Number(s.recurringDayOfWeek) % 7,
        recurringDayOfMonth: s.recurringDayOfMonth,
        recurringWeeks: Array.isArray(courseWeeks) ? courseWeeks.map(Number).filter((week: number) => Number.isInteger(week) && week > 0 && week <= Math.min(50, Number(parsed.semesterInfo?.totalWeeks) || 50)) : undefined,
        notes: s.notes || s.description || undefined,
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
        date: parsed.semesterInfo?.startDate ? formatDate(getMonday(parseDate(parsed.semesterInfo.startDate))) : '',
        time: startTime,
        endDate: undefined,
        endTime: endTime,
        recurringType: 'weekly',
        recurringDayOfWeek: (c.dayOfWeek === undefined ? 1 : Number(c.dayOfWeek)) % 7,
        recurringWeeks: (Array.isArray(c.weeks) ? c.weeks : parseWeeksString(c.rawWeeksStr || '')).map(Number).filter((week: number) => Number.isInteger(week) && week > 0 && week <= Math.min(50, Number(parsed.semesterInfo?.totalWeeks) || 50)),
        notes: [c.location ? `地点: ${c.location}` : '', c.teacher ? `讲师/负责人: ${c.teacher}` : '', !parsed.semesterInfo?.startDate ? '需填写课程第1周日期后再保存' : ''].filter(Boolean).join(' | ') || undefined,
        suggestedProjectTitle: parsed.semesterInfo?.semesterName || '日程排期',
        selected: true,
      })
    })

    if (!projects.some((p) => p.title === (parsed.semesterInfo?.semesterName || '日程排期'))) {
      projects.push({
        id: `proj-vision-${Date.now()}`,
        type: 'project',
        title: parsed.semesterInfo?.semesterName || '日程排期',
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
        importance: normalizePriority(t.importance),
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
        targetCount: normalizeTargetCount(h.targetCount),
        description: h.description || h.notes || undefined,
        suggestedProjectTitle: h.suggestedProjectTitle,
        selected: true,
      })
    })
  }

  const count = schedules.length + todos.length + habits.length
  return {
    reasoning: parsed.reasoning || `AI 视觉模型已从图片中解析出 ${count} 项排程与规划。`,
    areas: [],
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
  configOverride?: AiProviderConfig | SingleAiEndpointConfig,
  signal?: AbortSignal
): Promise<CopilotPlanResult> {
  const fullCfg = loadAiConfig()
  let cfg: SingleAiEndpointConfig
  if (configOverride) {
    if ('visionSeparate' in configOverride) {
      cfg = getVisionConfig(configOverride as AiProviderConfig)
    } else {
      cfg = configOverride as SingleAiEndpointConfig
    }
  } else {
    cfg = getVisionConfig(fullCfg)
  }

  if (!cfg.apiKey && cfg.provider !== 'ollama') {
    if (fullCfg.visionSeparate) {
      throw new Error('未检测到有效的【图片识别 API 密钥】，请先在【设置】->【AI 配置】->【图片识图 API】中填写 API Key。')
    } else {
      throw new Error('未检测到有效的 AI 接口密钥。如果主模型不支持图片输入（如 DeepSeek），请在【设置】->【AI 配置】中开启【独立图片识别 API】，配置支持视觉的模型（如 OpenAI gpt-4o-mini 或 硅基流动 Qwen2.5-VL）。')
    }
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
      "recurringDayOfWeek": 1, // 周期性日程对应的星期几：0代表周日、1代表周一...6代表周六 (必须为数字 0-6)
      "suggestedProjectTitle": "对应项目名称"
    }
  ],
  "todos": [
    {
      "title": "待办任务名称",
      "importance": 5, // 重要度 1-10 (10最高，普通为5)
      "dueDate": "YYYY-MM-DD (可选)",
      "subtasks": []
    }
  ],
  "habits": [
    {
      "title": "习惯名称",
      "frequency": "daily",
      "targetCount": 1,
      "timeSlot": "morning"
    }
  ]
}

【提取规则要求】：
1. 完整提取图片中的每一项安排，不要遗漏；
若为课程，请提供 semesterInfo.startDate（学期第1周日期）及 totalWeeks，并保留每门课的 weeks 数组（单/双周不得丢弃）；无法识别时在 reasoning 说明。
2. 若为周课表/周作息表，请为每项日程标注 recurringType: "weekly" 和 recurringDayOfWeek (0-6)；
3. 允许日程时间交叠与并行，忠实按图片所示时段提取，不要强行错开或拆分；
4. 只返回包含 JSON 内容的 Markdown 代码块，即以 \`\`\`json 开头，以 \`\`\` 结尾，严禁输出任何多余的寒暄或解释。`

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
      signal,
      body: JSON.stringify({
        model: cfg.model,
        messages,
        temperature: 0.1,
      }),
    })
  } catch (err: any) {
    if (signal?.aborted || err?.name === 'AbortError') {
      throw err
    }
    const errMsg = String(err?.message || err || '')
    if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || err instanceof TypeError) {
      if (!cfg.useProxy) {
        throw new Error(
          '连接 AI 视觉接口失败 (Failed to fetch)。\n由于浏览器跨域 (CORS) 限制，请在 Copilot 设置中开启【使用服务器反向代理】，或检查视觉模型接口地址。'
        )
      } else {
        throw new Error('连接 AI 视觉反向代理失败 (Failed to fetch): 无法连接代理服务，请检查服务状态。\n目标: [' + (headers['X-Target-Url'] || '') + ']')
      }
    }
    throw new Error('连接 AI 视觉接口失败: ' + (errMsg || '网络请求错误，请检查接口地址或反向代理配置'))
  }

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    if (res.status === 400 || errorBody.toLowerCase().includes('vision') || errorBody.toLowerCase().includes('image') || errorBody.toLowerCase().includes('multimodal')) {
      throw new Error(`当前图片识别模型 (${cfg.model}) 无法接收图像输入。\n建议在【AI 配置】->【图片识图 API】中单独配置支持视觉识别的多模态模型（例如 OpenAI gpt-4o-mini 或 硅基流动 Qwen2.5-VL 等），无需替换文字主模型。\n服务器返回: ${errorBody.substring(0, 200)}`)
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

    let dayOfWeek = Number(c.dayOfWeek)
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 7) dayOfWeek = 1

    let startSection = Number(c.startSection) || 1
    if (startSection < 1) startSection = 1

    let step = Number(c.step) || 2
    if (step < 1) step = 1

    let weeks: number[] = []
    if (Array.isArray(c.weeks) && c.weeks.length > 0) {
      weeks = Array.from(new Set<number>(c.weeks.map(Number).filter((n: number) => !isNaN(n) && n > 0 && n <= 50))).sort((a, b) => a - b)
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


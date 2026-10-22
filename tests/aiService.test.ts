import { describe, it, expect } from 'vitest'
import {
  parsePlanResultFromText,
  buildSystemPrompt,
  saveAiConfig,
  loadAiConfig,
  onAiConfigChange,
  parseRecognizedScheduleContent,
  getTextConfig,
  getVisionConfig,
  resolveEndpoint,
} from '@/services/aiService'

describe('aiService (AI 规划解析与上下文构建)', () => {
  it('能够从标准 markdown ```json 代码块中提取并解析数据', () => {
    const rawAiOutput = `好的，我为您整理了如下规划：
\`\`\`json
{
  "reasoning": "避开了下午已有会议，为您安排在上午",
  "projects": [
    { "id": "p1", "title": "上线准备", "color": "#3b82f6" }
  ],
  "schedules": [
    { "title": "部署演练", "date": "2026-09-29", "time": "10:00", "endTime": "11:00" }
  ],
  "todos": [
    { "title": "编写发版说明", "importance": 3, "subtasks": ["检查更新日志", "通知群组"] }
  ],
  "habits": [
    { "title": "晨跑打卡", "frequency": "daily", "timeSlot": "morning", "time": "07:00" }
  ]
}
\`\`\`
希望对您有帮助！`

    const plan = parsePlanResultFromText(rawAiOutput)
    expect(plan.reasoning).toBe('避开了下午已有会议，为您安排在上午')
    expect(plan.projects).toHaveLength(1)
    expect(plan.projects[0].title).toBe('上线准备')
    expect(plan.schedules).toHaveLength(1)
    expect(plan.schedules[0].title).toBe('部署演练')
    expect(plan.schedules[0].selected).toBe(true)
    expect(plan.todos).toHaveLength(1)
    expect(plan.todos[0].subtasks).toEqual(['检查更新日志', '通知群组'])
    expect(plan.habits).toHaveLength(1)
    expect(plan.habits[0].title).toBe('晨跑打卡')
  })

  it('能够处理带 <think> 思考链标签的输出并提取 JSON', () => {
    const reasoningModelOutput = `<think>
用户想要规划周三上午的考试复习，需要避开上午10点的课...
综合考虑，推荐安排在8点至9点半。
</think>
\`\`\`json
{
  "reasoning": "安排在早晨8点，避免与课业冲突",
  "projects": [],
  "schedules": [
    { "title": "物理复习", "date": "2026-09-30", "time": "08:00", "endTime": "09:30" }
  ],
  "todos": [],
  "habits": []
}
\`\`\``

    const plan = parsePlanResultFromText(reasoningModelOutput)
    expect(plan.reasoning).toContain('安排在早晨8点')
    expect(plan.schedules[0].title).toBe('物理复习')
  })

  it('即使模型未带 markdown 代码块也能从纯文本括号中容错提取', () => {
    const rawNoFence = `{
  "reasoning": "直接返回 JSON 对象",
  "projects": [],
  "schedules": [],
  "todos": [{ "title": "独立待办", "importance": 4 }],
  "habits": []
}`

    const plan = parsePlanResultFromText(rawNoFence)
    expect(plan.todos[0].title).toBe('独立待办')
    expect(plan.todos[0].importance).toBe(4)
  })

  it('遇到无法解析的乱码时应抛出可读的友好异常而非未捕获闪退', () => {
    const garbageOutput = '非常抱歉，我目前无法为您规划，请稍后再试。'
    expect(() => parsePlanResultFromText(garbageOutput)).toThrowError(/未能成功解析/)
  })

  it('buildSystemPrompt 能根据不同模式输出专属准则', () => {
    const promptSmart = buildSystemPrompt({
      mode: 'smart',
      areas: [],
      projects: [{ id: 'p-1', title: '科研项目', color: '#10b981', order: 0, createdAt: '' }],
      schedules: [],
      habits: [],
    })
    expect(promptSmart).toContain('科研项目')
    expect(promptSmart).toContain('智能复合全自动识别')

    const promptScheduleOnly = buildSystemPrompt({
      mode: 'schedule',
      areas: [],
      projects: [],
      schedules: [],
      habits: [],
    })
    expect(promptScheduleOnly).toContain('专一模式：仅提取日程安排')
    expect(promptScheduleOnly).toContain('以用户描述为第一准则')
    expect(promptScheduleOnly).toContain('日程支持并允许重复交叠')
    expect(promptScheduleOnly).not.toContain('主动避开已有重叠时段')
    expect(promptScheduleOnly).not.toContain('说明避碰原因')
  })

  it('saveAiConfig 应触发 onAiConfigChange 监听回调', () => {
    let notifiedCfg: any = null
    const unsubscribe = onAiConfigChange((cfg) => {
      notifiedCfg = cfg
    })

    const testCfg = {
      provider: 'openai' as const,
      baseUrl: 'https://api.openai.com/v1',
      apiKey: 'sk-test-sync-key',
      model: 'gpt-4o',
      temperature: 0.5,
      useProxy: true,
    }

    saveAiConfig(testCfg)
    expect(notifiedCfg).toEqual(testCfg)
    expect(loadAiConfig().apiKey).toBe('sk-test-sync-key')
    unsubscribe()
  })

  it('parseRecognizedScheduleContent 能够正确解析 AI 识图返回的课程表 JSON', () => {
    const rawAiVisionOutput = `\`\`\`json
{
  "semesterInfo": {
    "semesterName": "2026年秋季学期",
    "totalWeeks": 16
  },
  "courses": [
    {
      "name": "大学物理(A)",
      "dayOfWeek": 1,
      "startSection": 3,
      "step": 2,
      "weeks": [1, 2, 3, 4, 5, 6, 7, 8],
      "location": "理学院 302",
      "teacher": "张教授"
    },
    {
      "name": "马克思主义基本原理",
      "dayOfWeek": 3,
      "startSection": 1,
      "step": 2,
      "rawWeeksStr": "1-15单周",
      "location": "教学主楼 101",
      "teacher": "王老师"
    }
  ]
}
\`\`\``

    const result = parseRecognizedScheduleContent(rawAiVisionOutput)
    expect(result.courses).toHaveLength(2)
    expect(result.courses[0].name).toBe('大学物理(A)')
    expect(result.courses[0].dayOfWeek).toBe(1)
    expect(result.courses[0].startSection).toBe(3)
    expect(result.courses[0].step).toBe(2)
    expect(result.courses[0].weeks).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(result.courses[0].location).toBe('理学院 302')
    expect(result.courses[0].teacher).toBe('张教授')

    expect(result.courses[1].name).toBe('马克思主义基本原理')
    expect(result.courses[1].dayOfWeek).toBe(3)
    expect(result.courses[1].weeks).toEqual([1, 3, 5, 7, 9, 11, 13, 15])

    expect(result.semesterInfo?.semesterName).toBe('2026年秋季学期')
    expect(result.semesterInfo?.totalWeeks).toBe(16)
  })

  it('getTextConfig 正确提取用户填写的文字模型端点配置', () => {
    const userConfig = {
      provider: 'custom' as const,
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: 'sk-zhipu-123456',
      model: 'glm-4-flash',
      temperature: 0.3,
      useProxy: true,
    }

    const textCfg = getTextConfig(userConfig)
    expect(textCfg.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4')
    expect(textCfg.apiKey).toBe('sk-zhipu-123456')
    expect(textCfg.model).toBe('glm-4-flash')
    expect(textCfg.useProxy).toBe(true)
  })

  it('未开启独立识图模型时，getVisionConfig 直接复用文字模型配置', () => {
    const singleEndpointConfig = {
      provider: 'custom' as const,
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: 'sk-zhipu-123456',
      model: 'glm-4-flash',
      temperature: 0.3,
      useProxy: false,
      visionSeparate: false,
      visionBaseUrl: '',
      visionApiKey: '',
      visionModel: '',
    }

    const visionCfg = getVisionConfig(singleEndpointConfig)
    expect(visionCfg.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4')
    expect(visionCfg.apiKey).toBe('sk-zhipu-123456')
    expect(visionCfg.model).toBe('glm-4-flash')
  })

  it('开启独立识图模型时，getVisionConfig 正确使用用户独立填写的识图端点配置', () => {
    const separateConfig = {
      provider: 'custom' as const,
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-deepseek-text-key',
      model: 'deepseek-chat',
      temperature: 0.3,
      useProxy: false,
      visionSeparate: true,
      visionBaseUrl: 'https://api.siliconflow.cn/v1',
      visionApiKey: 'sk-siliconflow-vision-key',
      visionModel: 'Qwen/Qwen2.5-VL-72B-Instruct',
      visionUseProxy: true,
    }

    const textCfg = getTextConfig(separateConfig)
    expect(textCfg.baseUrl).toBe('https://api.deepseek.com')
    expect(textCfg.model).toBe('deepseek-chat')
    expect(textCfg.apiKey).toBe('sk-deepseek-text-key')

    const visionCfg = getVisionConfig(separateConfig)
    expect(visionCfg.baseUrl).toBe('https://api.siliconflow.cn/v1')
    expect(visionCfg.apiKey).toBe('sk-siliconflow-vision-key')
    expect(visionCfg.model).toBe('Qwen/Qwen2.5-VL-72B-Instruct')
    expect(visionCfg.useProxy).toBe(true)
  })

  it('parsePlanResultFromText 能够正确提取独立与层级领域 (Areas) 并支持与项目关联', () => {
    const rawAiOutput = `\`\`\`json
{
  "reasoning": "为您规划了技术研发顶级领域及下设的人工智能子领域，并在其下设立相关实践项目",
  "areas": [
    { "id": "area-1", "title": "技术研发", "color": "#3b82f6", "parentId": null },
    { "id": "area-2", "title": "人工智能", "color": "#8b5cf6", "suggestedParentTitle": "技术研发" }
  ],
  "projects": [
    { "title": "大模型微调实战", "suggestedAreaTitle": "人工智能" }
  ],
  "schedules": [],
  "todos": [{ "title": "准备训练数据集", "suggestedProjectTitle": "大模型微调实战" }],
  "habits": []
}
\`\`\``

    const plan = parsePlanResultFromText(rawAiOutput)
    expect(plan.areas).toHaveLength(2)
    expect(plan.areas[0].title).toBe('技术研发')
    expect(plan.areas[0].selected).toBe(true)
    expect(plan.areas[0].parentId).toBeNull()
    expect(plan.areas[1].title).toBe('人工智能')
    expect(plan.areas[1].suggestedParentTitle).toBe('技术研发')
    expect(plan.projects[0].suggestedAreaTitle).toBe('人工智能')
    expect(plan.todos[0].suggestedProjectTitle).toBe('大模型微调实战')
  })

  it('buildSystemPrompt 能格式化层级领域树并支持 area 模式', () => {
    const mockAreas = [
      { id: 'a-root', title: '主业工作', color: '#3b82f6', parentId: null, order: 0, createdAt: '' },
      { id: 'a-sub', title: '后端架构', color: '#10b981', parentId: 'a-root', order: 0, createdAt: '' }
    ]
    const mockProjects = [
      { id: 'p-1', title: '微服务重构', areaId: 'a-sub', color: '#10b981', order: 0, createdAt: '' }
    ]

    const promptArea = buildSystemPrompt({
      mode: 'area',
      areas: mockAreas,
      projects: mockProjects,
      schedules: [],
      habits: [],
    })

    expect(promptArea).toContain('专一模式：仅规划与提取领域架构（Areas）')
    expect(promptArea).toContain('顶级领域:「主业工作」')
    expect(promptArea).toContain('子领域:「后端架构」')
    expect(promptArea).toContain('所属领域:「后端架构」')
    expect(promptArea).toContain('"areas": [')
  })

  it('支持纯独立领域创建输出，其余数组为空', () => {
    const rawAiOutput = `\`\`\`json
{
  "reasoning": "已为您单独创建「生活日常」与「心理学研读」两个顶级领域",
  "areas": [
    { "title": "生活日常", "color": "#10b981", "parentId": null },
    { "title": "心理学研读", "color": "#8b5cf6", "parentId": null }
  ],
  "projects": [],
  "schedules": [],
  "todos": [],
  "habits": []
}
\`\`\``

    const plan = parsePlanResultFromText(rawAiOutput)
    expect(plan.areas).toHaveLength(2)
    expect(plan.areas[0].title).toBe('生活日常')
    expect(plan.areas[1].title).toBe('心理学研读')
    expect(plan.projects).toHaveLength(0)
    expect(plan.schedules).toHaveLength(0)
    expect(plan.todos).toHaveLength(0)
    expect(plan.habits).toHaveLength(0)
  })

  it('支持项目、日程、习惯和待办的详细说明（description/notes）完整解析', () => {
    const rawAiOutput = `\`\`\`json
{
  "reasoning": "全量包含详情说明",
  "areas": [],
  "projects": [
    { "title": "开源知识库", "description": "构建高可用多端同构文档系统" }
  ],
  "schedules": [
    { "title": "架构复盘会", "date": "2026-10-01", "time": "14:00", "notes": "会议室B3，讨论服务下线方案" }
  ],
  "todos": [
    { "title": "更新数据库脚本", "importance": 4, "notes": "注意执行前先备份" }
  ],
  "habits": [
    { "title": "深蹲锻炼", "frequency": "daily", "description": "每组20次，共完成3组" }
  ]
}
\`\`\``

    const plan = parsePlanResultFromText(rawAiOutput)
    expect(plan.projects[0].description).toBe('构建高可用多端同构文档系统')
    expect(plan.schedules[0].notes).toBe('会议室B3，讨论服务下线方案')
    expect(plan.todos[0].notes).toBe('注意执行前先备份')
    expect(plan.habits[0].description).toBe('每组20次，共完成3组')
  })

  it('resolveEndpoint 未配置 baseUrl 时抛出友好异常', () => {
    expect(() => resolveEndpoint({ baseUrl: '' }, '/chat/completions')).toThrowError(/未配置 API 接口地址/)
    expect(() => resolveEndpoint({ baseUrl: '   ' }, '/chat/completions')).toThrowError(/未配置 API 接口地址/)
  })

  it('resolveEndpoint 自动补全 https 协议、去除多余斜杠并防止路径重复拼接', () => {
    const r1 = resolveEndpoint({ baseUrl: 'api.deepseek.com' }, '/chat/completions')
    expect(r1.url).toBe('https://api.deepseek.com/chat/completions')

    const r2 = resolveEndpoint({ baseUrl: 'https://api.deepseek.com/v1/chat/completions' }, '/chat/completions')
    expect(r2.url).toBe('https://api.deepseek.com/v1/chat/completions')

    const r3 = resolveEndpoint({ baseUrl: 'api.openai.com' }, '/chat/completions')
    expect(r3.url).toBe('https://api.openai.com/v1/chat/completions')
  })

  it('resolveEndpoint 在反向代理模式下正确构造内部代理地址并附带 X-Target-Url', () => {
    const res = resolveEndpoint(
      { baseUrl: 'https://api.deepseek.com', apiKey: 'sk-test', useProxy: true },
      '/chat/completions'
    )
    expect(res.url).toBe('/api/ai-proxy/chat/completions')
    expect(res.headers['X-Target-Url']).toBe('https://api.deepseek.com/chat/completions')
    expect(res.headers['Authorization']).toBe('Bearer sk-test')
  })
})



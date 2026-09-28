import { describe, it, expect } from 'vitest'
import { parsePlanResultFromText, buildSystemPrompt } from '@/services/aiService'

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
  })
})

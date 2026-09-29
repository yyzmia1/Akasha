import type { CourseItem, SectionTimeSlot, AcademicScheduleConfig } from '@/types/academic'
import { COURSE_COLOR_PALETTE, DEFAULT_SECTION_TIMES } from '@/types/academic'
import type { ScheduleItem, Project } from '@/types'

/**
 * 格式化周次字符串为数字数组 (例如 "1-16", "1-15单", "2-16双", "1、3、5、7")
 */
export function parseWeeksString(weeksStr: string): number[] {
  if (!weeksStr || !weeksStr.trim()) return []
  const clean = weeksStr.trim().replace(/周/g, '')

  // 匹配顿号、逗号、分号分割的多个片段
  const parts = clean.split(/[,，、;；\s]+/).filter(Boolean)
  const resultWeeks = new Set<number>()

  for (const part of parts) {
    // 匹配 "1-15单" 或 "1-15(单)"
    const singleOddMatch = part.match(/^(\d+)-(\d+)(?:\(|（)?单(?:\)|）)?$/)
    if (singleOddMatch) {
      const start = parseInt(singleOddMatch[1], 10)
      const end = parseInt(singleOddMatch[2], 10)
      for (let w = start; w <= end; w++) {
        if (w % 2 !== 0) resultWeeks.add(w)
      }
      continue
    }

    // 匹配 "2-16双" 或 "2-16(双)"
    const singleEvenMatch = part.match(/^(\d+)-(\d+)(?:\(|（)?双(?:\)|）)?$/)
    if (singleEvenMatch) {
      const start = parseInt(singleEvenMatch[1], 10)
      const end = parseInt(singleEvenMatch[2], 10)
      for (let w = start; w <= end; w++) {
        if (w % 2 === 0) resultWeeks.add(w)
      }
      continue
    }

    // 匹配连续周 "1-16"
    const rangeMatch = part.match(/^(\d+)-(\d+)$/)
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10)
      const end = parseInt(rangeMatch[2], 10)
      const min = Math.min(start, end)
      const max = Math.max(start, end)
      for (let w = min; w <= max; w++) {
        resultWeeks.add(w)
      }
      continue
    }

    // 匹配单个周数字 "3" 或 "第3"
    const singleNumMatch = part.match(/^(?:第)?(\d+)$/)
    if (singleNumMatch) {
      resultWeeks.add(parseInt(singleNumMatch[1], 10))
      continue
    }
  }

  return Array.from(resultWeeks).sort((a, b) => a - b)
}

/**
 * 将周次数字数组转换为紧凑易读的自然语言描述 (例如 [1,2,3,4] -> "1-4周", [1,3,5] -> "1-5单周")
 */
export function formatWeeksArray(weeks: number[]): string {
  if (!weeks || weeks.length === 0) return '无排期'
  const sorted = [...weeks].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]

  // 判断是否是完整的全连续范围
  if (sorted.length === max - min + 1) {
    return min === max ? `第${min}周` : `${min}-${max}周`
  }

  // 判断是否全为单周
  const allOdd = sorted.every((w) => w % 2 !== 0)
  if (allOdd && sorted.length === Math.floor((max - min) / 2) + 1) {
    return `${min}-${max}单周`
  }

  // 判断是否全为双周
  const allEven = sorted.every((w) => w % 2 === 0)
  if (allEven && sorted.length === Math.floor((max - min) / 2) + 1) {
    return `${min}-${max}双周`
  }

  // 离散离散周次用逗号拼接
  return sorted.join('、') + '周'
}

/**
 * 规范化星期几输入 (1 - 7，1为周一，7为周日)
 */
export function normalizeDayOfWeek(val: string | number): number {
  if (typeof val === 'number') {
    if (val >= 1 && val <= 7) return val
    if (val === 0) return 7 // 周日
  }

  const s = String(val).trim().toLowerCase()
  if (/^[1-7]$/.test(s)) return parseInt(s, 10)

  if (s.includes('一') || s === 'mon' || s === 'monday') return 1
  if (s.includes('二') || s === 'tue' || s === 'tuesday') return 2
  if (s.includes('三') || s === 'wed' || s === 'wednesday') return 3
  if (s.includes('四') || s === 'thu' || s === 'thursday') return 4
  if (s.includes('五') || s === 'fri' || s === 'friday') return 5
  if (s.includes('六') || s === 'sat' || s === 'saturday') return 6
  if (s.includes('日') || s.includes('天') || s === 'sun' || s === 'sunday') return 7

  return 1
}

/**
 * 智能分配课程色彩
 */
export function assignCourseColors(courses: CourseItem[]): CourseItem[] {
  const colorMap = new Map<string, string>()
  let colorIdx = 0

  return courses.map((c) => {
    if (c.color) return c
    const key = c.name.trim()
    if (!colorMap.has(key)) {
      colorMap.set(key, COURSE_COLOR_PALETTE[colorIdx % COURSE_COLOR_PALETTE.length])
      colorIdx++
    }
    return {
      ...c,
      color: colorMap.get(key),
    }
  })
}

// -------------------------------------------------------------
// 1. WakeUp 标准 CSV 模板解析与生成
// -------------------------------------------------------------

/**
 * 生成 WakeUp 官方规范的 CSV 空白模板文本 (带 UTF-8 BOM，防止 Windows Excel 乱码)
 */
export function generateWakeUpCsvTemplate(): string {
  const headers = ['课程名称', '星期', '开始节次', '持续节数', '上课周次', '老师', '教室', '背景颜色']
  const sampleRows = [
    ['高等数学(上)', '1', '1', '2', '1-16', '张教授', '教一 302', '#3b82f6'],
    ['大学英语(三)', '2', '3', '2', '1-16', '王老师', '外语楼 205', '#10b981'],
    ['大学物理实验', '3', '5', '3', '2-16双', '李老师', '物理实验中心', '#f59e0b'],
    ['马克思主义基本原理', '4', '1', '2', '1-15单', '刘教授', '大礼堂 101', '#8b5cf6'],
    ['计算机程序设计', '5', '3', '2', '1-16', '赵老师', '机房四', '#06b6d4'],
  ]

  const csvContent = [headers.join(','), ...sampleRows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))].join('\r\n')

  return '\uFEFF' + csvContent
}

/**
 * 导出课程表为符合 WakeUp 导入规范的 CSV 文件内容
 */
export function exportCoursesToWakeUpCsv(courses: CourseItem[]): string {
  const headers = ['课程名称', '星期', '开始节次', '持续节数', '上课周次', '老师', '教室', '背景颜色']
  const rows = courses.map((c) => [
    c.name,
    String(c.dayOfWeek),
    String(c.startSection),
    String(c.step),
    c.rawWeeksStr || formatWeeksArray(c.weeks).replace(/周$/, ''),
    c.teacher || '无',
    c.location || '无',
    c.color || '#3b82f6',
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${(cell || '').replace(/"/g, '""')}"`).join(','))].join('\r\n')

  return '\uFEFF' + csvContent
}

/**
 * 解析用户上传的 WakeUp 标准或类似 CSV 格式课表
 */
export function parseWakeUpCsv(csvText: string): CourseItem[] {
  if (!csvText || !csvText.trim()) return []

  // 剥离 UTF-8 BOM
  let text = csvText
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  // 严格安全的 CSV 分割（支持双引号包裹内容中含有逗号或换行）
  const parseRows = (raw: string): string[][] => {
    const rows: string[][] = []
    let currentRow: string[] = []
    let currentCell = ''
    let insideQuotes = false

    for (let i = 0; i < raw.length; i++) {
      const char = raw[i]
      const nextChar = raw[i + 1]

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"'
          i++
        } else {
          insideQuotes = !insideQuotes
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim())
        currentCell = ''
      } else if ((char === '\r' || char === '\n') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') i++
        currentRow.push(currentCell.trim())
        if (currentRow.some((c) => c.length > 0)) {
          rows.push(currentRow)
        }
        currentRow = []
        currentCell = ''
      } else {
        currentCell += char
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim())
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow)
      }
    }

    return rows
  }

  const allRows = parseRows(text)
  if (allRows.length < 2) return []

  const header = allRows[0].map((h) => h.trim().replace(/^"|"$/g, ''))

  // 动态匹配各列索引
  const colIndex = {
    name: header.findIndex((h) => /课程|课名|名称|name/i.test(h)),
    day: header.findIndex((h) => /星期|周几|day/i.test(h)),
    startSection: header.findIndex((h) => /开始节次|起始节次|开始|start/i.test(h)),
    step: header.findIndex((h) => /持续节数|持续节次|节数|持续|step/i.test(h)),
    endSection: header.findIndex((h) => /结束节次|结束/i.test(h)),
    weeks: header.findIndex((h) => /上课周次|周次|周数|weeks/i.test(h)),
    teacher: header.findIndex((h) => /老师|教师|任课老师|teacher/i.test(h)),
    location: header.findIndex((h) => /教室|地点|上课地点|location/i.test(h)),
    color: header.findIndex((h) => /颜色|背景颜色|color/i.test(h)),
  }

  const courses: CourseItem[] = []

  for (let r = 1; r < allRows.length; r++) {
    const row = allRows[r]
    if (!row || row.length === 0) continue

    const name = colIndex.name !== -1 ? row[colIndex.name] : row[0]
    if (!name || !name.trim()) continue

    const dayRaw = colIndex.day !== -1 ? row[colIndex.day] : row[1]
    const startSectionRaw = colIndex.startSection !== -1 ? row[colIndex.startSection] : row[2]
    let stepRaw = colIndex.step !== -1 ? row[colIndex.step] : undefined
    const endSectionRaw = colIndex.endSection !== -1 ? row[colIndex.endSection] : undefined

    const startSection = parseInt(startSectionRaw || '1', 10) || 1
    let step = 1
    if (stepRaw) {
      step = parseInt(stepRaw, 10) || 1
    } else if (endSectionRaw) {
      const endSection = parseInt(endSectionRaw, 10)
      if (!isNaN(endSection) && endSection >= startSection) {
        step = endSection - startSection + 1
      }
    }

    const weeksRaw = colIndex.weeks !== -1 ? row[colIndex.weeks] : row[4] || '1-16'
    const weeks = parseWeeksString(weeksRaw)

    const teacher = colIndex.teacher !== -1 ? row[colIndex.teacher] : row[5]
    const location = colIndex.location !== -1 ? row[colIndex.location] : row[6]
    const color = colIndex.color !== -1 ? row[colIndex.color] : undefined

    courses.push({
      id: `course-${Date.now()}-${r}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      dayOfWeek: normalizeDayOfWeek(dayRaw),
      startSection,
      step,
      weeks: weeks.length > 0 ? weeks : Array.from({ length: 16 }, (_, i) => i + 1),
      rawWeeksStr: weeksRaw,
      teacher: teacher && teacher !== '无' ? teacher.trim() : undefined,
      location: location && location !== '无' ? location.trim() : undefined,
      color: color && color.startsWith('#') ? color.trim() : undefined,
    })
  }

  return assignCourseColors(courses)
}

// -------------------------------------------------------------
// 2. 教务系统 HTML / JSON 网页智能解析提取器
// -------------------------------------------------------------

/**
 * 从教务系统网页源码（如新版正方、强智、URP等）或网络接口 JSON 中提取结构化课程
 */
export function parseEducationalContent(content: string): CourseItem[] {
  if (!content || !content.trim()) return []
  const trimmed = content.trim()

  // 1. 如果输入本身就是 JSON 格式（如教务系统 API 响应结果）
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const json = JSON.parse(trimmed)
      const list = json.kbList || json.lessons || json.courses || json.data || (Array.isArray(json) ? json : null)
      if (Array.isArray(list) && list.length > 0) {
        const parsedFromApi: CourseItem[] = []
        for (let i = 0; i < list.length; i++) {
          const item = list[i]
          const name = item.kcmc || item.courseName || item.name || item.course_name
          if (!name) continue
          const day = item.xq || item.dayOfWeek || item.day || item.skxq || 1
          const startSection = item.jcs || item.startSection || item.start_section || item.ksjc || 1
          const step = item.cd || item.step || item.duration || 2
          const weeksStr = item.zcds || item.weeks || item.rawWeeks || item.skzc || '1-16'
          const teacher = item.teacms || item.teacher || item.xm || item.teacherName
          const location = item.cdmc || item.location || item.classroom || item.place

          parsedFromApi.push({
            id: `course-api-${Date.now()}-${i}`,
            name: String(name).trim(),
            dayOfWeek: normalizeDayOfWeek(day),
            startSection: parseInt(startSection, 10) || 1,
            step: parseInt(step, 10) || 2,
            weeks: parseWeeksString(String(weeksStr)),
            rawWeeksStr: String(weeksStr),
            teacher: teacher ? String(teacher).trim() : undefined,
            location: location ? String(location).trim() : undefined,
          })
        }
        if (parsedFromApi.length > 0) {
          return assignCourseColors(parsedFromApi)
        }
      }
    } catch (_e) {}
  }

  // 2. DOM HTML 表格解析（在浏览器客户端环境下使用 DOMParser）
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(trimmed, 'text/html')
      const courses: CourseItem[] = []

      // 常见教务系统课表选择器 (正方 kbtable / 强智 timetable 等)
      const tables = doc.querySelectorAll('table')
      for (const table of Array.from(tables)) {
        const rows = Array.from(table.querySelectorAll('tr'))
        if (rows.length < 3) continue

        // 识别星期表头行 (周一至周日)
        let dayColMap: Record<number, number> = {} // colIndex -> dayOfWeek (1~7)
        for (const row of rows) {
          const ths = Array.from(row.querySelectorAll('th, td'))
          ths.forEach((cell, idx) => {
            const txt = cell.textContent || ''
            const d = normalizeDayOfWeek(txt)
            if (txt.includes('一') || txt.includes('二') || txt.includes('三') || txt.includes('四') || txt.includes('五') || txt.includes('六') || txt.includes('日')) {
              dayColMap[idx] = d
            }
          })
          if (Object.keys(dayColMap).length >= 5) break
        }

        // 默认映射周一至周日为列 1~7
        if (Object.keys(dayColMap).length < 5) {
          dayColMap = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7 }
        }

        // 遍历课表单元格
        let sectionCounter = 1
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td'))
          if (cells.length < 5) continue

          cells.forEach((cell, colIdx) => {
            const dayOfWeek = dayColMap[colIdx]
            if (!dayOfWeek) return

            // 识别单元格内的课程块
            const text = cell.innerText || cell.textContent || ''
            if (!text || text.trim().length < 2) return

            // 过滤掉纯数字、表头或无用文本
            if (/^(第?\d+节?|\s*)$/.test(text.trim())) return

            // 处理单元格内可能由 <br> 分隔的课程信息块
            const innerDivs = cell.querySelectorAll('div.kbcontent, div.timetable-course, div')
            const chunks = innerDivs.length > 0
              ? Array.from(innerDivs).map((d) => d.textContent?.trim() || '')
              : [text.trim()]

            for (const chunk of chunks) {
              if (chunk.length < 2) continue

              // 尝试抽取周次：如 "[1-16周]"、"(1-15单周)"、"1-16(周)"
              const weekMatch = chunk.match(/\[?\(?(\d+-\d+(?:单|双)?|\d+(?:[,，、]\d+)+)周?\)\]?/)
              const weeksStr = weekMatch ? weekMatch[1] : '1-16'
              const weeks = parseWeeksString(weeksStr)

              // 分割行提取课程名、教师、地点
              const lines = chunk
                .split(/[\r\n]+/)
                .map((l) => l.trim())
                .filter((l) => l.length > 0 && !/^--+$/.test(l))

              if (lines.length === 0) continue

              const courseName = lines[0].replace(/\[.*\]|\(.*\)/g, '').trim()
              if (!courseName || courseName.length < 2) continue

              let teacher: string | undefined
              let location: string | undefined

              for (let i = 1; i < lines.length; i++) {
                const line = lines[i]
                if (/楼|室|堂|馆|机房|中心|校区/.test(line)) {
                  location = line
                } else if (/老师|教授|讲师|[\u4e00-\u9fa5]{2,4}/.test(line) && !line.includes('周')) {
                  if (!teacher) teacher = line
                }
              }

              courses.push({
                id: `course-html-${Date.now()}-${courses.length}-${Math.random().toString(36).slice(2, 6)}`,
                name: courseName,
                dayOfWeek,
                startSection: sectionCounter,
                step: 2, // 默认两节连上
                weeks: weeks.length > 0 ? weeks : Array.from({ length: 16 }, (_, idx) => idx + 1),
                rawWeeksStr: weeksStr,
                teacher,
                location,
              })
            }
          })

          sectionCounter += 2 // 多数高校教务为两大节连排
        }

        if (courses.length > 0) {
          return assignCourseColors(courses)
        }
      }
    } catch (_e) {}
  }

  // 3. 通用正则表达式降级解析
  const regexMatches = content.matchAll(/([^\n\r]+?)\s*([1-7]|周[一二三四五六日])\s*(\d+)[\s,，]+(\d+)\s*([\d\-、单双周]+)/g)
  const regexCourses: CourseItem[] = []
  for (const m of regexMatches) {
    regexCourses.push({
      id: `course-regex-${Date.now()}-${regexCourses.length}`,
      name: m[1].trim(),
      dayOfWeek: normalizeDayOfWeek(m[2]),
      startSection: parseInt(m[3], 10) || 1,
      step: parseInt(m[4], 10) || 2,
      weeks: parseWeeksString(m[5]),
      rawWeeksStr: m[5],
    })
  }

  return assignCourseColors(regexCourses)
}

// -------------------------------------------------------------
// 3. RFC 5545 iCalendar (.ics) 日历格式互通导出与解析
// -------------------------------------------------------------

function padZero(n: number): string {
  return String(n).padStart(2, '0')
}

function formatDateToIcsString(d: Date): string {
  const y = d.getFullYear()
  const m = padZero(d.getMonth() + 1)
  const day = padZero(d.getDate())
  const h = padZero(d.getHours())
  const min = padZero(d.getMinutes())
  const s = padZero(d.getSeconds())
  return `${y}${m}${day}T${h}${min}${s}`
}

/**
 * 将课程表导出为符合 Apple/Google/Outlook/系统日历标准规范的 .ics 文件
 */
export function generateIcsCalendar(config: AcademicScheduleConfig): string {
  const { semesterStartDate, timeSlots, courses, semesterName } = config
  const startMonday = new Date(semesterStartDate + 'T00:00:00')

  const timeSlotMap = new Map<number, SectionTimeSlot>()
  timeSlots.forEach((slot) => timeSlotMap.set(slot.section, slot))

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Akasha//Academic Schedule Importer//CN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${semesterName || '高校课程表'}`,
    'X-WR-TIMEZONE:Asia/Shanghai',
  ]

  for (const course of courses) {
    const startSlot = timeSlotMap.get(course.startSection) || DEFAULT_SECTION_TIMES[0]
    const endSectionIndex = course.startSection + course.step - 1
    const endSlot = timeSlotMap.get(endSectionIndex) || startSlot

    const [startH, startM] = (startSlot.startTime || '08:00').split(':').map(Number)
    const [endH, endM] = (endSlot.endTime || '09:40').split(':').map(Number)

    // 对课程的每一个具体周次生成单独的 VEVENT (极其安全稳定，免去各端 RRULE 复杂规则差异)
    for (const weekNum of course.weeks) {
      const courseDate = new Date(startMonday)
      // 计算偏移天数: (周次 - 1) * 7 + (星期几 - 1)
      const offsetDays = (weekNum - 1) * 7 + (course.dayOfWeek - 1)
      courseDate.setDate(courseDate.getDate() + offsetDays)

      const dtStart = new Date(courseDate)
      dtStart.setHours(startH, startM, 0, 0)

      const dtEnd = new Date(courseDate)
      dtEnd.setHours(endH, endM, 0, 0)

      const uid = `akasha-course-${course.id}-w${weekNum}@akasha.local`
      const summary = course.name
      const location = course.location || ''
      const description = `教师: ${course.teacher || '未分配'}\\n第${weekNum}周 (第${course.startSection}-${endSectionIndex}节)`

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${formatDateToIcsString(new Date())}Z`,
        `DTSTART;TZID=Asia/Shanghai:${formatDateToIcsString(dtStart)}`,
        `DTEND;TZID=Asia/Shanghai:${formatDateToIcsString(dtEnd)}`,
        `SUMMARY:${summary}`,
        location ? `LOCATION:${location}` : '',
        `DESCRIPTION:${description}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      )
    }
  }

  lines.push('END:VCALENDAR')
  return lines.filter(Boolean).join('\r\n')
}

/**
 * 解析用户上传的 .ics 日历文件，提取出日程数据
 */
export function parseIcsCalendar(icsContent: string): Partial<ScheduleItem>[] {
  if (!icsContent || !icsContent.includes('BEGIN:VCALENDAR')) return []

  const events: Partial<ScheduleItem>[] = []
  const eventBlocks = icsContent.split(/BEGIN:VEVENT/i).slice(1)

  for (const block of eventBlocks) {
    const getField = (fieldName: string) => {
      const match = block.match(new RegExp(`${fieldName}(?:;[^:]*)?:([^\\r\\n]+)`, 'i'))
      return match ? match[1].trim() : ''
    }

    const summary = getField('SUMMARY')
    if (!summary) continue

    const dtStartRaw = getField('DTSTART')
    const dtEndRaw = getField('DTEND')
    const location = getField('LOCATION')

    // 解析 YYYYMMDDTHHmmSS
    let dateStr = ''
    let timeStr = ''
    let endTimeStr = ''

    if (dtStartRaw) {
      const clean = dtStartRaw.replace(/[^0-9T]/g, '')
      const match = clean.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/)
      if (match) {
        dateStr = `${match[1]}-${match[2]}-${match[3]}`
        if (match[4] && match[5]) {
          timeStr = `${match[4]}:${match[5]}`
        }
      }
    }

    if (dtEndRaw) {
      const clean = dtEndRaw.replace(/[^0-9T]/g, '')
      const match = clean.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/)
      if (match && match[4] && match[5]) {
        endTimeStr = `${match[4]}:${match[5]}`
      }
    }

    events.push({
      id: 'sch-ics-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      title: location ? `${summary} (${location})` : summary,
      date: dateStr || new Date().toISOString().slice(0, 10),
      time: timeStr || undefined,
      endTime: endTimeStr || undefined,
      recurringType: 'none',
      createdAt: new Date().toISOString(),
    })
  }

  return events
}

// -------------------------------------------------------------
// 4. 一键书签小脚本 (Bookmarklet 提取器)
// -------------------------------------------------------------

/**
 * 生成用户可拖拽到浏览器书签栏的 Bookmarklet 提取代码
 */
export function getBookmarkletCode(): string {
  // 这段脚本将在学生所登录的教务系统页面执行，提取课表 DOM 表格内容并通过 window.open/postMessage 或剪贴板回传
  const rawScript = `(function(){
    var tables = document.querySelectorAll('table');
    var bestTable = null;
    var maxCells = 0;
    tables.forEach(function(t){
      var cells = t.querySelectorAll('td');
      if(cells.length > maxCells){
        maxCells = cells.length;
        bestTable = t;
      }
    });
    var content = bestTable ? bestTable.outerHTML : document.body.innerText;
    try {
      navigator.clipboard.writeText(content).then(function(){
        alert('🎉 课表数据已成功复制到剪贴板！\\n请切回 Akasha 导入窗口，点击“粘贴课表内容”即可一键导入。');
      }).catch(function(){
        prompt('请复制以下提取的课表数据后粘贴到 Akasha：', content.substring(0, 3000));
      });
    } catch(e) {
      prompt('请复制以下提取的课表数据后粘贴到 Akasha：', content.substring(0, 3000));
    }
  })();`

  return `javascript:${encodeURIComponent(rawScript)}`
}

// -------------------------------------------------------------
// 5. 将课程表配置自动沉淀转换为 Akasha 的 Project 与 ScheduleItems
// -------------------------------------------------------------

export function convertAcademicToAkasha(config: AcademicScheduleConfig): {
  project: Partial<Project>
  schedules: Partial<ScheduleItem>[]
} {
  const now = Date.now()
  const projectId = 'proj-academic-' + now

  const project: Partial<Project> = {
    id: projectId,
    title: config.targetProjectTitle || '大学学期课表',
    color: '#3b82f6',
    description: `${config.semesterName || '高校课程'} (共 ${config.courses.length} 门课程)`,
    createdAt: new Date().toISOString(),
    updatedAt: now,
  }

  const timeSlotMap = new Map<number, SectionTimeSlot>()
  config.timeSlots.forEach((slot) => timeSlotMap.set(slot.section, slot))

  const schedules: Partial<ScheduleItem>[] = []
  const startMonday = new Date(config.semesterStartDate + 'T00:00:00')

  if (config.importMode === 'dates') {
    // 方案 A: 全量展开法 - 根据周次与星期生成每一周真实日期的单次日程
    for (const course of config.courses) {
      const startSlot = timeSlotMap.get(course.startSection) || DEFAULT_SECTION_TIMES[0]
      const endSectionIndex = course.startSection + course.step - 1
      const endSlot = timeSlotMap.get(endSectionIndex) || startSlot

      for (const weekNum of course.weeks) {
        const d = new Date(startMonday)
        const offsetDays = (weekNum - 1) * 7 + (course.dayOfWeek - 1)
        d.setDate(d.getDate() + offsetDays)

        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const dateStr = `${y}-${m}-${day}`

        const titleDetails = [
          course.name,
          course.location ? `@${course.location}` : '',
          course.teacher ? `(${course.teacher})` : '',
        ].filter(Boolean).join(' ')

        schedules.push({
          id: `sch-course-${course.id}-w${weekNum}-${now}`,
          projectId,
          title: titleDetails,
          date: dateStr,
          time: startSlot.startTime,
          endDate: dateStr,
          endTime: endSlot.endTime,
          recurringType: 'none',
          createdAt: new Date().toISOString(),
          updatedAt: now,
        })
      }
    }
  } else {
    // 方案 B: 周循环法 - 生成每周固定星期重复的日程
    for (const course of config.courses) {
      const startSlot = timeSlotMap.get(course.startSection) || DEFAULT_SECTION_TIMES[0]
      const endSectionIndex = course.startSection + course.step - 1
      const endSlot = timeSlotMap.get(endSectionIndex) || startSlot

      const titleDetails = [
        course.name,
        course.location ? `@${course.location}` : '',
        course.teacher ? `(${course.teacher})` : '',
      ].filter(Boolean).join(' ')

      // 注意 Akasha 的周循环：1~6 是周一到周六，7 转换为 0 (周日)
      const recurringDayOfWeek = course.dayOfWeek === 7 ? 0 : course.dayOfWeek

      schedules.push({
        id: `sch-course-rec-${course.id}-${now}`,
        projectId,
        title: titleDetails,
        time: startSlot.startTime,
        endTime: endSlot.endTime,
        recurringType: 'weekly',
        recurringDayOfWeek,
        createdAt: new Date().toISOString(),
        updatedAt: now,
      })
    }
  }

  return { project, schedules }
}

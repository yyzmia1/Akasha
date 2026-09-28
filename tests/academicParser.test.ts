import { describe, it, expect } from 'vitest'
import {
  parseWeeksString,
  formatWeeksArray,
  normalizeDayOfWeek,
  parseWakeUpCsv,
  generateWakeUpCsvTemplate,
  exportCoursesToWakeUpCsv,
  parseEducationalContent,
  generateIcsCalendar,
  parseIcsCalendar,
  convertAcademicToAkasha,
} from '@/utils/academicParser'
import type { AcademicScheduleConfig, CourseItem } from '@/types/academic'
import { DEFAULT_SECTION_TIMES } from '@/types/academic'

describe('academicParser (教务课表解析、WakeUp CSV 与 iCal 互通引擎)', () => {
  it('正确解析各种复杂的周次字符串', () => {
    // 连续周
    expect(parseWeeksString('1-16')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    expect(parseWeeksString('1-16周')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])

    // 单周
    expect(parseWeeksString('1-9单')).toEqual([1, 3, 5, 7, 9])
    expect(parseWeeksString('1-9(单)')).toEqual([1, 3, 5, 7, 9])

    // 双周
    expect(parseWeeksString('2-10双')).toEqual([2, 4, 6, 8, 10])
    expect(parseWeeksString('2-10(双)')).toEqual([2, 4, 6, 8, 10])

    // 顿号隔开不连续周
    expect(parseWeeksString('1、3、5、7')).toEqual([1, 3, 5, 7])
    expect(parseWeeksString('1, 3, 5, 7')).toEqual([1, 3, 5, 7])

    // 复合周
    expect(parseWeeksString('1-4, 7-9')).toEqual([1, 2, 3, 4, 7, 8, 9])
  })

  it('正确将周次数组格式化为可读字符串', () => {
    expect(formatWeeksArray([1, 2, 3, 4, 5])).toBe('1-5周')
    expect(formatWeeksArray([1, 3, 5, 7])).toBe('1-7单周')
    expect(formatWeeksArray([2, 4, 6, 8])).toBe('2-8双周')
    expect(formatWeeksArray([1, 4, 9])).toBe('1、4、9周')
    expect(formatWeeksArray([3])).toBe('第3周')
  })

  it('正确规范化星期输入', () => {
    expect(normalizeDayOfWeek('周一')).toBe(1)
    expect(normalizeDayOfWeek('星期一')).toBe(1)
    expect(normalizeDayOfWeek('1')).toBe(1)
    expect(normalizeDayOfWeek('周日')).toBe(7)
    expect(normalizeDayOfWeek('星期天')).toBe(7)
    expect(normalizeDayOfWeek('7')).toBe(7)
    expect(normalizeDayOfWeek(0)).toBe(7)
    expect(normalizeDayOfWeek('Wed')).toBe(3)
  })

  it('能够生成与解析 WakeUp 官方规范 CSV 模板', () => {
    const template = generateWakeUpCsvTemplate()
    expect(template).toContain('课程名称')
    expect(template).toContain('开始节次')

    const parsedCourses = parseWakeUpCsv(template)
    expect(parsedCourses.length).toBeGreaterThan(0)
    expect(parsedCourses[0].name).toBe('高等数学(上)')
    expect(parsedCourses[0].dayOfWeek).toBe(1)
    expect(parsedCourses[0].startSection).toBe(1)
    expect(parsedCourses[0].step).toBe(2)
    expect(parsedCourses[0].weeks.length).toBe(16)
  })

  it('能够将课程数组重新导出为合法的 WakeUp CSV', () => {
    const courses: CourseItem[] = [
      {
        id: 'c1',
        name: '线性代数',
        teacher: '高老师',
        location: '主楼 401',
        dayOfWeek: 2,
        startSection: 3,
        step: 2,
        weeks: [1, 2, 3, 4, 5, 6, 7, 8],
        color: '#3b82f6',
      },
    ]

    const exportedCsv = exportCoursesToWakeUpCsv(courses)
    expect(exportedCsv).toContain('线性代数')
    expect(exportedCsv).toContain('主楼 401')

    const reParsed = parseWakeUpCsv(exportedCsv)
    expect(reParsed).toHaveLength(1)
    expect(reParsed[0].name).toBe('线性代数')
    expect(reParsed[0].dayOfWeek).toBe(2)
    expect(reParsed[0].teacher).toBe('高老师')
    expect(reParsed[0].location).toBe('主楼 401')
  })

  it('能够解析教务系统 API 格式的 JSON 字符串', () => {
    const apiJson = JSON.stringify({
      kbList: [
        {
          kcmc: '离散数学',
          xq: 3,
          jcs: 5,
          cd: 2,
          zcds: '1-16',
          teacms: '孙老师',
          cdmc: '理学院 102',
        },
      ],
    })

    const courses = parseEducationalContent(apiJson)
    expect(courses).toHaveLength(1)
    expect(courses[0].name).toBe('离散数学')
    expect(courses[0].dayOfWeek).toBe(3)
    expect(courses[0].startSection).toBe(5)
    expect(courses[0].step).toBe(2)
    expect(courses[0].teacher).toBe('孙老师')
    expect(courses[0].location).toBe('理学院 102')
  })

  it('能够生成标准的 RFC 5545 iCalendar (.ics) 日历内容', () => {
    const config: AcademicScheduleConfig = {
      semesterName: '2026年秋季学期',
      semesterStartDate: '2026-09-07', // 2026-09-07 is Monday
      totalWeeks: 16,
      timeSlots: DEFAULT_SECTION_TIMES,
      targetAreaTitle: '学业',
      targetProjectTitle: '大学学期课表',
      importMode: 'dates',
      courses: [
        {
          id: 'test-c1',
          name: '算法设计',
          dayOfWeek: 1, // Monday
          startSection: 1, // 08:00
          step: 2, // 08:00 - 09:40
          weeks: [1, 2],
          teacher: '陈老师',
          location: '信息楼 201',
        },
      ],
    }

    const icsContent = generateIcsCalendar(config)
    expect(icsContent).toContain('BEGIN:VCALENDAR')
    expect(icsContent).toContain('BEGIN:VEVENT')
    expect(icsContent).toContain('SUMMARY:算法设计')
    expect(icsContent).toContain('LOCATION:信息楼 201')
    expect(icsContent).toContain('DTSTART;TZID=Asia/Shanghai:20260907T080000')
    expect(icsContent).toContain('DTEND;TZID=Asia/Shanghai:20260907T094000')
    expect(icsContent).toContain('DTSTART;TZID=Asia/Shanghai:20260914T080000') // Week 2
    expect(icsContent).toContain('END:VCALENDAR')

    // 测试反向解析 ICS
    const parsedEvents = parseIcsCalendar(icsContent)
    expect(parsedEvents.length).toBe(2)
    expect(parsedEvents[0].title).toContain('算法设计')
    expect(parsedEvents[0].time).toBe('08:00')
    expect(parsedEvents[0].endTime).toBe('09:40')
  })

  it('convertAcademicToAkasha 能正确把课程转换为单次真实日期日程', () => {
    const config: AcademicScheduleConfig = {
      semesterName: '2026年秋季学期',
      semesterStartDate: '2026-09-07',
      totalWeeks: 16,
      timeSlots: DEFAULT_SECTION_TIMES,
      targetAreaTitle: '学业',
      targetProjectTitle: '2026秋季课表',
      importMode: 'dates',
      courses: [
        {
          id: 'c1',
          name: '微积分',
          dayOfWeek: 2, // Tuesday (2026-09-08)
          startSection: 3, // 10:00
          step: 2, // 10:00 - 11:40
          weeks: [1],
          teacher: '赵老师',
          location: '教学楼A201',
        },
      ],
    }

    const { project, schedules } = convertAcademicToAkasha(config)
    expect(project.title).toBe('2026秋季课表')
    expect(schedules).toHaveLength(1)
    expect(schedules[0].date).toBe('2026-09-08')
    expect(schedules[0].time).toBe('10:00')
    expect(schedules[0].endTime).toBe('11:40')
    expect(schedules[0].title).toContain('微积分')
    expect(schedules[0].title).toContain('@教学楼A201')
    expect(schedules[0].recurringType).toBe('none')
  })

  it('convertAcademicToAkasha 能正确把课程转换为周重复日程', () => {
    const config: AcademicScheduleConfig = {
      semesterName: '2026年秋季学期',
      semesterStartDate: '2026-09-07',
      totalWeeks: 16,
      timeSlots: DEFAULT_SECTION_TIMES,
      targetAreaTitle: '学业',
      targetProjectTitle: '2026秋季课表',
      importMode: 'weekly',
      courses: [
        {
          id: 'c2',
          name: '大学物理',
          dayOfWeek: 5, // Friday
          startSection: 1, // 08:00
          step: 2, // 08:00 - 09:40
          weeks: [1, 2, 3],
        },
      ],
    }

    const { schedules } = convertAcademicToAkasha(config)
    expect(schedules).toHaveLength(1)
    expect(schedules[0].recurringType).toBe('weekly')
    expect(schedules[0].recurringDayOfWeek).toBe(5)
    expect(schedules[0].time).toBe('08:00')
    expect(schedules[0].endTime).toBe('09:40')
  })
})

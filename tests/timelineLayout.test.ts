import { describe, it, expect } from 'vitest'
import {
  parseMinutes,
  formatDuration,
  computeGridEventLayout,
  computeAgendaList,
  type RawDayTimelineItem
} from '@/utils/timelineLayout'

describe('Timeline Layout Engine', () => {
  it('correctly parses time strings to minutes from midnight', () => {
    expect(parseMinutes('00:00')).toBe(0)
    expect(parseMinutes('10:20')).toBe(620)
    expect(parseMinutes('13:34')).toBe(814)
    expect(parseMinutes('23:59')).toBe(1439)
    expect(parseMinutes('invalid')).toBeNull()
    expect(parseMinutes(undefined)).toBeNull()
  })

  it('correctly formats durations', () => {
    expect(formatDuration(15)).toBe('15分钟')
    expect(formatDuration(60)).toBe('1小时')
    expect(formatDuration(100)).toBe('1小时40分')
    expect(formatDuration(127)).toBe('2小时7分')
  })

  it('correctly lays out non-overlapping events with 100% width', () => {
    const items: RawDayTimelineItem[] = [
      {
        id: '1',
        type: 'schedule',
        title: 'Morning Class',
        timeStr: '08:00 ~ 09:30',
        startMinutes: 480,
        endMinutes: 570,
        durationMinutes: 90,
        isAllDay: false,
      },
      {
        id: '2',
        type: 'schedule',
        title: 'Afternoon Lab',
        timeStr: '14:00 ~ 16:00',
        startMinutes: 840,
        endMinutes: 960,
        durationMinutes: 120,
        isAllDay: false,
      },
    ]

    const layout = computeGridEventLayout(items)
    expect(layout).toHaveLength(2)

    // Event 1
    expect(layout[0].top).toBe(480)
    expect(layout[0].height).toBe(90)
    expect(layout[0].leftPercent).toBe(0)
    expect(layout[0].widthPercent).toBe(100)
    expect(layout[0].hasOverlap).toBe(false)
    expect(layout[0].totalCols).toBe(1)

    // Event 2
    expect(layout[1].top).toBe(840)
    expect(layout[1].height).toBe(120)
    expect(layout[1].leftPercent).toBe(0)
    expect(layout[1].widthPercent).toBe(100)
    expect(layout[1].hasOverlap).toBe(false)
    expect(layout[1].totalCols).toBe(1)
  })

  it('handles the exact real-world scenario from user screenshot with multiple overlaps', () => {
    // Exact scenario from user's screenshot:
    // Event 1: 10:20 ~ 12:00 (Probability & Statistics B)
    // Event 2: 11:47 ~ 13:54 (11)
    // Event 3: 13:30 ~ 15:10 (Electronic Technology A)
    // Event 4: 15:25 ~ 17:05 (Computer Organization)
    const items: RawDayTimelineItem[] = [
      {
        id: 'e1',
        type: 'schedule',
        title: '概率与统计B',
        timeStr: '10:20 ~ 12:00',
        startMinutes: 620, // 10:20
        endMinutes: 720,   // 12:00
        durationMinutes: 100,
        isAllDay: false,
      },
      {
        id: 'e2',
        type: 'schedule',
        title: '11',
        timeStr: '11:47 ~ 13:54',
        startMinutes: 707, // 11:47
        endMinutes: 834,   // 13:54
        durationMinutes: 127,
        isAllDay: false,
      },
      {
        id: 'e3',
        type: 'schedule',
        title: '电子技术A',
        timeStr: '13:30 ~ 15:10',
        startMinutes: 810, // 13:30
        endMinutes: 910,   // 15:10
        durationMinutes: 100,
        isAllDay: false,
      },
      {
        id: 'e4',
        type: 'schedule',
        title: '计算机组成原理',
        timeStr: '15:25 ~ 17:05',
        startMinutes: 925, // 15:25
        endMinutes: 1025,  // 17:05
        durationMinutes: 100,
        isAllDay: false,
      },
    ]

    const layout = computeGridEventLayout(items)
    expect(layout).toHaveLength(4)

    const e1 = layout.find((x) => x.id === 'e1')!
    const e2 = layout.find((x) => x.id === 'e2')!
    const e3 = layout.find((x) => x.id === 'e3')!
    const e4 = layout.find((x) => x.id === 'e4')!

    // Event 1 & Event 2 overlap (11:47 < 12:00)
    // Event 2 & Event 3 overlap (13:30 < 13:54)
    // Event 1 & Event 3 do not overlap (720 < 810)
    // Event 4 does not overlap with any previous event (925 > 910)

    // Cluster 1 has 2 columns:
    expect(e1.totalCols).toBe(2)
    expect(e1.hasOverlap).toBe(true)
    expect(e1.colIndex).toBe(0)
    expect(e1.leftPercent).toBe(0)
    expect(e1.widthPercent).toBe(50)
    expect(e1.height).toBe(100) // Duration proportional

    expect(e2.totalCols).toBe(2)
    expect(e2.hasOverlap).toBe(true)
    expect(e2.colIndex).toBe(1)
    expect(e2.leftPercent).toBe(50)
    expect(e2.widthPercent).toBe(50)
    expect(e2.height).toBe(127) // Duration proportional

    expect(e3.totalCols).toBe(2)
    expect(e3.hasOverlap).toBe(true)
    expect(e3.colIndex).toBe(0) // Reuses Col 0 after e1 ended
    expect(e3.leftPercent).toBe(0)
    expect(e3.widthPercent).toBe(50)
    expect(e3.height).toBe(100) // Duration proportional

    // Event 4 is in its own cluster, takes 100% width
    expect(e4.totalCols).toBe(1)
    expect(e4.hasOverlap).toBe(false)
    expect(e4.colIndex).toBe(0)
    expect(e4.leftPercent).toBe(0)
    expect(e4.widthPercent).toBe(100)
    expect(e4.height).toBe(100)
  })

  it('correctly calculates agenda list overlap minutes', () => {
    const items: RawDayTimelineItem[] = [
      {
        id: '1',
        type: 'schedule',
        title: 'A',
        timeStr: '10:00 ~ 11:30',
        startMinutes: 600,
        endMinutes: 690,
        durationMinutes: 90,
        isAllDay: false,
      },
      {
        id: '2',
        type: 'schedule',
        title: 'B',
        timeStr: '11:00 ~ 12:00',
        startMinutes: 660,
        endMinutes: 720,
        durationMinutes: 60,
        isAllDay: false,
      },
      {
        id: '3',
        type: 'schedule',
        title: 'C',
        timeStr: '13:00 ~ 14:00',
        startMinutes: 780,
        endMinutes: 840,
        durationMinutes: 60,
        isAllDay: false,
      },
    ]

    const agenda = computeAgendaList(items)
    expect(agenda).toHaveLength(3)
    // A overlaps with B by 30 mins (690 - 660)
    expect(agenda[0].overlapWithNext).toBe(30)
    // B does not overlap with C (720 < 780)
    expect(agenda[1].overlapWithNext).toBe(0)
    // C is the last item
    expect(agenda[2].overlapWithNext).toBe(0)
  })
})

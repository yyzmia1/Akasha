import { describe, it, expect, beforeEach } from 'vitest'
import { t, currentLocale, setLocale, LANGUAGE_OPTIONS, messages, type SupportedLocale } from '../src/utils/i18n'

describe('i18n utility', () => {
  beforeEach(() => {
    setLocale('zh')
  })

  it('supports exactly zh, en, and ja', () => {
    expect(LANGUAGE_OPTIONS.map(l => l.value)).toEqual(['zh', 'en', 'ja'])
    expect(Object.keys(messages)).toEqual(['zh', 'en', 'ja'])
  })

  it('translates navigation keys in Chinese, English, and Japanese', () => {
    setLocale('zh')
    expect(t('nav.calendar')).toBe('日历')
    expect(t('nav.settings')).toBe('设置')

    setLocale('en')
    expect(t('nav.calendar')).toBe('Calendar')
    expect(t('nav.settings')).toBe('Settings')

    setLocale('ja')
    expect(t('nav.calendar')).toBe('カレンダー')
    expect(t('nav.settings')).toBe('設定')
  })

  it('supports parameter substitution', () => {
    setLocale('zh')
    expect(t('todo.selectedCount', { count: 3 })).toBe('已选 3 项')

    setLocale('en')
    expect(t('todo.selectedCount', { count: 3 })).toBe('3 selected')

    setLocale('ja')
    expect(t('todo.selectedCount', { count: 3 })).toBe('3 件選択中')
  })

  it('translates calendar keys properly in zh, en, and ja', () => {
    setLocale('zh')
    expect(t('calendar.filterTodos')).toBe('待办事项')
    expect(t('calendar.filterHabits')).toBe('习惯打卡')
    expect(t('calendar.filterSchedules')).toBe('固定日程')
    expect(t('calendar.dayTimeline')).toBe('全天时序排期')
    expect(t('calendar.dailyTodoList', { count: 5 })).toBe('今日待办清单 (5)')

    setLocale('en')
    expect(t('calendar.filterTodos')).toBe('Todos')
    expect(t('calendar.filterHabits')).toBe('Habits')
    expect(t('calendar.filterSchedules')).toBe('Schedules')
    expect(t('calendar.dayTimeline')).toBe('Day Timeline')
    expect(t('calendar.dailyTodoList', { count: 5 })).toBe('Today’s Tasks (5)')

    setLocale('ja')
    expect(t('calendar.filterTodos')).toBe('ToDo')
    expect(t('calendar.filterHabits')).toBe('習慣')
    expect(t('calendar.filterSchedules')).toBe('固定予定')
    expect(t('calendar.dayTimeline')).toBe('タイムライン排期')
    expect(t('calendar.dailyTodoList', { count: 5 })).toBe('今日のToDoリスト (5)')
  })

  it('falls back to key when missing in another language', () => {
    setLocale('en')
    expect(t('nonexistent.key')).toBe('nonexistent.key')
  })
})

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

  it('falls back to zh when key is missing in another language', () => {
    setLocale('en')
    expect(t('nonexistent.key')).toBe('nonexistent.key')
  })
})

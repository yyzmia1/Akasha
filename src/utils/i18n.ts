import { ref, computed } from 'vue'

export type SupportedLocale = 'zh' | 'en' | 'ja' | 'fr' | 'de'

export interface LanguageOption {
  value: SupportedLocale
  label: string
  nativeName: string
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: 'zh', label: '中文', nativeName: '简体中文' },
  { value: 'en', label: 'English', nativeName: 'English' },
  { value: 'ja', label: '日本語', nativeName: '日本語' },
  { value: 'fr', label: 'Français', nativeName: 'Français' },
  { value: 'de', label: 'Deutsch', nativeName: 'Deutsch' }
]

const STORAGE_KEY = 'akasha_app_locale'

export const messages: Record<SupportedLocale, Record<string, any>> = {
  zh: {
    nav: {
      calendar: '日历',
      projects: '项目',
      schedules: '日程',
      todos: '待办',
      habits: '习惯',
      journal: '日记',
      settings: '设置',
      search: '全局检索 (Ctrl+K)',
      copilot: 'AI 个人效能副驾驶 (Ctrl+J)'
    },
    settings: {
      title: '系统设置',
      subtitle: '偏好配置与本地数据管理',
      overview: '数据概览',
      totalProjects: '总项目数',
      todoProgress: '待办进度',
      habitsCount: '日常习惯',
      journalCount: '日记随笔',
      appearance: '界面外观',
      lightMode: '浅色模式',
      darkMode: '暗色模式',
      autoTheme: '按时间自动切换外观',
      autoThemeDesc: '在设定的时间段内自动切换浅色与暗色',
      lightPeriod: '浅色时段 (其余为暗色)',
      restoreDefault: '恢复默认 (08:00 - 22:00)',
      defaultTimeRange: '默认: 08:00 - 22:00',
      lightFrom: '浅色从',
      darkFrom: '暗色从',
      to: '至',
      runningAuto: '自动运行中',
      currentAutoLight: '当前判定：浅色模式时段 (白天)',
      currentAutoDark: '当前判定：暗色模式时段 (夜间)',
      uiScale: '界面缩放比例',
      uiScaleDesc: '等比缩放整个界面、卡片与布局',
      fontFamily: '字体风格',
      fontFamilyDesc: '整站全局排版字体切换',
      defaultFont: '系统默认',
      modernSans: '现代黑体',
      elegantSerif: '优雅衬线',
      language: '语言偏好',
      languageDesc: '多语言界面切换',
      copilotTitle: 'AI 个人效能配置 (Copilot)',
      configured: '已配置',
      presetProviders: '推荐服务商预设',
      apiKey: 'API 密钥 (API Key)',
      apiEndpoint: '自定义接口地址 (Endpoint)',
      modelName: '模型标识 (Model)',
      saveConfig: '保存配置',
      saved: '已保存',
      testing: '测试中...',
      testConnection: '测试连接',
      testSuccess: '接口连通成功！',
      testFailed: '连接测试失败',
      missingApiKey: '请先填写 API Key',
      sync: '云同步与跨端协作',
      syncStatus: '实时状态',
      syncScope: '同步范围',
      syncAll: '全量同步 (含 Copilot 配置)',
      syncExceptCopilot: '标准数据同步 (不含 Copilot 配置)',
      syncNow: '立即手动同步',
      serverUrl: '同步服务器地址',
      account: '账户邮箱',
      password: '同步密钥 / 密码',
      loginSync: '登录并开始同步',
      logout: '断开同步',
      backup: '本地数据备份与重置',
      exportJson: '导出 JSON 数据备份',
      importJson: '导入恢复数据',
      clearAll: '清空本地所有数据',
      confirmClear: '确定要清空本地所有数据吗？此操作无法撤销！'
    },
    common: {
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      create: '新建',
      close: '关闭',
      refresh: '刷新',
      search: '搜索',
      loading: '加载中...',
      success: '成功',
      error: '错误',
      all: '全部',
      locationAuto: '定位',
      locationManual: '手动'
    },
    syncStatus: {
      local: '本地模式',
      synced: '云端已同步',
      syncing: '同步中...',
      error: '同步异常',
      offline: '离线模式',
      notSynced: '未同步'
    },
    weather: {
      refresh: '刷新天气',
      redetect: '重新自动定位 (IP/GPS)',
      redetectBtn: '重新自动定位',
      popularCities: '热门城市',
      searchPlaceholder: '搜索任意城市 (如: 苏州、大连、青岛...)',
      humidity: '空气湿度',
      windSpeed: '风速',
      feelsLike: '体感',
      fullForecast: '全文预报',
      viewFullForecast: '查看外部权威全文气象预报 (Windy 气象中心)',
      weatherTip: '气象提示：',
      peakHour: '(重点时段 ~{hour}:00)',
      copiedLink: '已复制权威预报链接',
      condition: {
        clear: '晴天',
        mostlyClear: '晴间多云',
        partlyCloudy: '多云',
        overcast: '阴天',
        fog: '雾',
        drizzle: '毛毛雨',
        rainLight: '小雨',
        rainModerate: '中雨',
        rainHeavy: '大雨',
        thunderstorm: '雷阵雨',
        snow: '雪'
      }
    },
    calendar: {
      today: '今天',
      prevPeriod: '上个周期',
      nextPeriod: '下个周期',
      selectView: '选择日历视角',
      viewDay: '单日视图',
      viewDayDesc: '1天',
      view2Days: '双日聚焦',
      view2DaysDesc: '2天',
      view3Days: '三日看板',
      view3DaysDesc: '3天',
      viewWeek: '周视图',
      viewWeekDesc: '7天自然周',
      view2Weeks: '两周中程',
      view2WeeksDesc: '14天',
      viewMonth: '月历全景',
      viewMonthDesc: '完整月份'
    },
    schedule: {
      title: '固定日程安排',
      newSchedule: '新建日程',
      allProjects: '所有所属项目',
      all: '全部日程',
      upcoming: '近期日程',
      past: '已过日程'
    }
  },
  en: {
    nav: {
      calendar: 'Calendar',
      projects: 'Projects',
      schedules: 'Schedule',
      todos: 'Todos',
      habits: 'Habits',
      journal: 'Journal',
      settings: 'Settings',
      search: 'Search (Ctrl+K)',
      copilot: 'AI Copilot (Ctrl+J)'
    },
    settings: {
      title: 'System Settings',
      subtitle: 'Preferences & Local Data Management',
      overview: 'Data Overview',
      totalProjects: 'Projects',
      todoProgress: 'Todo Progress',
      habitsCount: 'Active Habits',
      journalCount: 'Journal Entries',
      appearance: 'Appearance',
      lightMode: 'Light Mode',
      darkMode: 'Dark Mode',
      autoTheme: 'Schedule Appearance by Time',
      autoThemeDesc: 'Automatically switch between light and dark themes',
      lightPeriod: 'Light Theme Period (Dark otherwise)',
      restoreDefault: 'Reset to Default (08:00 - 22:00)',
      defaultTimeRange: 'Default: 08:00 - 22:00',
      lightFrom: 'Light from',
      darkFrom: 'Dark from',
      to: 'to',
      runningAuto: 'Active Schedule',
      currentAutoLight: 'Current state: Light Theme (Daytime)',
      currentAutoDark: 'Current state: Dark Theme (Nighttime)',
      uiScale: 'UI Display Scale',
      uiScaleDesc: 'Proportionally scale the entire layout and cards',
      fontFamily: 'Typography Font',
      fontFamilyDesc: 'Global font family for all views and typography',
      defaultFont: 'System Default',
      modernSans: 'Modern Sans',
      elegantSerif: 'Elegant Serif',
      language: 'Language',
      languageDesc: 'Choose interface display language',
      copilotTitle: 'AI Personal Copilot Configuration',
      configured: 'Configured',
      presetProviders: 'Recommended Providers',
      apiKey: 'API Key',
      apiEndpoint: 'Custom Endpoint',
      modelName: 'Model Identifier',
      saveConfig: 'Save Configuration',
      saved: 'Saved',
      testing: 'Testing...',
      testConnection: 'Test Connection',
      testSuccess: 'Connected successfully!',
      testFailed: 'Connection failed',
      missingApiKey: 'Please enter an API Key first',
      sync: 'Cloud Sync & Multi-Device',
      syncStatus: 'Status',
      syncScope: 'Sync Scope',
      syncAll: 'Full Sync (including Copilot Config)',
      syncExceptCopilot: 'Standard Sync (excluding Copilot Config)',
      syncNow: 'Sync Now',
      serverUrl: 'Server URL',
      account: 'Account Email',
      password: 'Sync Password',
      loginSync: 'Sign In & Start Sync',
      logout: 'Disconnect',
      backup: 'Data Backup & Reset',
      exportJson: 'Export JSON Backup',
      importJson: 'Import & Restore Data',
      clearAll: 'Clear All Local Data',
      confirmClear: 'Are you sure you want to delete all local data? This cannot be undone!'
    },
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      close: 'Close',
      refresh: 'Refresh',
      search: 'Search',
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      all: 'All',
      locationAuto: 'Auto',
      locationManual: 'Manual'
    },
    syncStatus: {
      local: 'Local Mode',
      synced: 'Cloud Synced',
      syncing: 'Syncing...',
      error: 'Sync Error',
      offline: 'Offline Mode',
      notSynced: 'Not Synced'
    },
    weather: {
      refresh: 'Refresh weather',
      redetect: 'Re-detect Location (IP/GPS)',
      redetectBtn: 'Re-detect Location',
      popularCities: 'Popular Cities',
      searchPlaceholder: 'Search any city (e.g. Tokyo, London, Paris...)',
      humidity: 'Humidity',
      windSpeed: 'Wind Speed',
      feelsLike: 'Feels like',
      fullForecast: 'Full Forecast',
      viewFullForecast: 'View Authoritative Full Weather Forecast (Windy)',
      weatherTip: 'Weather Note:',
      peakHour: '(Peak ~{hour}:00)',
      copiedLink: 'Forecast link copied',
      condition: {
        clear: 'Clear',
        mostlyClear: 'Mostly Clear',
        partlyCloudy: 'Partly Cloudy',
        overcast: 'Overcast',
        fog: 'Foggy',
        drizzle: 'Drizzle',
        rainLight: 'Light Rain',
        rainModerate: 'Moderate Rain',
        rainHeavy: 'Heavy Rain',
        thunderstorm: 'Thunderstorm',
        snow: 'Snow'
      }
    },
    calendar: {
      today: 'Today',
      prevPeriod: 'Previous Period',
      nextPeriod: 'Next Period',
      selectView: 'Select View',
      viewDay: 'Day View',
      viewDayDesc: '1 Day',
      view2Days: '2 Days View',
      view2DaysDesc: '2 Days',
      view3Days: '3 Days View',
      view3DaysDesc: '3 Days',
      viewWeek: 'Week View',
      viewWeekDesc: '7 Days',
      view2Weeks: '2 Weeks View',
      view2WeeksDesc: '14 Days',
      viewMonth: 'Month View',
      viewMonthDesc: 'Full Month'
    },
    schedule: {
      title: 'Fixed Schedules',
      newSchedule: 'New Schedule',
      allProjects: 'All Projects',
      all: 'All',
      upcoming: 'Upcoming',
      past: 'Past'
    }
  },
  ja: {
    nav: {
      calendar: 'カレンダー',
      projects: 'プロジェクト',
      schedules: '予定',
      todos: 'タスク',
      habits: '習慣',
      journal: '日記',
      settings: '設定',
      search: '全体検索 (Ctrl+K)',
      copilot: 'AI コパイロット (Ctrl+J)'
    },
    settings: {
      title: 'システム設定',
      subtitle: '環境設定とローカルデータ管理',
      overview: 'データ概要',
      totalProjects: '総プロジェクト数',
      todoProgress: 'タスク進捗',
      habitsCount: '習慣リスト',
      journalCount: '日記エントリ',
      appearance: '外観設定',
      lightMode: 'ライトモード',
      darkMode: 'ダークモード',
      autoTheme: '時間帯によるテーマ自動切り替え',
      autoThemeDesc: '設定した時間帯に合わせてテーマを自動変更します',
      lightPeriod: 'ライトモードの時間帯 (その他はダーク)',
      restoreDefault: 'デフォルトに戻す (08:00 - 22:00)',
      defaultTimeRange: 'デフォルト: 08:00 - 22:00',
      lightFrom: '開始時刻',
      darkFrom: '終了時刻',
      to: '〜',
      runningAuto: '自動実行中',
      currentAutoLight: '現在: ライトモード (昼間)',
      currentAutoDark: '現在: ダークモード (夜間)',
      uiScale: '画面スケール',
      uiScaleDesc: 'インターフェース全体のサイズ比率を調整',
      fontFamily: 'フォントスタイル',
      fontFamilyDesc: 'アプリ全体の表示フォントを切り替え',
      defaultFont: 'システム既定',
      modernSans: 'モダン・ゴシック',
      elegantSerif: 'エレガント・明朝',
      language: '言語設定',
      languageDesc: '表示言語の切り替え',
      copilotTitle: 'AI コパイロット設定',
      configured: '設定完了',
      presetProviders: '推奨プロバイダー',
      apiKey: 'API キー',
      apiEndpoint: 'API エンドポイント',
      modelName: 'モデル名',
      saveConfig: '設定を保存',
      saved: '保存済み',
      testing: 'テスト中...',
      testConnection: '接続テスト',
      testSuccess: '接続に成功しました！',
      testFailed: '接続に失敗しました',
      missingApiKey: 'API キーを入力してください',
      sync: 'クラウド同期・マルチデバイス',
      syncStatus: '同期状態',
      syncScope: '同期対象',
      syncAll: '全データ同期 (Copilot 設定を含む)',
      syncExceptCopilot: '標準データ同期 (Copilot 設定を除く)',
      syncNow: '今すぐ手動同期',
      serverUrl: 'サーバー URL',
      account: 'アカウント (メール)',
      password: 'パスワード',
      loginSync: 'ログインして同期開始',
      logout: '同期を切断',
      backup: 'データバックアップと初期化',
      exportJson: 'JSON データをエクスポート',
      importJson: 'バックアップから復元',
      clearAll: 'すべてのローカルデータを初期化',
      confirmClear: 'すべてのローカルデータを削除してもよろしいですか？この操作は元に戻せません！'
    },
    common: {
      save: '保存',
      cancel: 'キャンセル',
      confirm: '確認',
      delete: '削除',
      edit: '編集',
      create: '新規作成',
      close: '閉じる',
      refresh: '更新',
      search: '検索',
      loading: '読み込み中...',
      success: '成功',
      error: 'エラー',
      all: 'すべて',
      locationAuto: '自動',
      locationManual: '手動'
    },
    syncStatus: {
      local: 'ローカル',
      synced: '同期済み',
      syncing: '同期中...',
      error: '同期エラー',
      offline: 'オフライン',
      notSynced: '未同期'
    },
    weather: {
      refresh: '天気を更新',
      redetect: '再自動測位 (IP/GPS)',
      redetectBtn: '再自動測位',
      popularCities: '人気の都市',
      searchPlaceholder: '都市を検索 (例: 東京、大阪、京都...)',
      humidity: '湿度',
      windSpeed: '風速',
      feelsLike: '体感',
      fullForecast: '詳細予報',
      viewFullForecast: '外部の公式気象詳細を見る (Windy)',
      weatherTip: '気象メモ：',
      peakHour: '(注目時間帯 ~{hour}:00)',
      copiedLink: '予報リンクをコピーしました',
      condition: {
        clear: '晴れ',
        mostlyClear: '晴れ時々曇り',
        partlyCloudy: '曇り',
        overcast: '本曇り',
        fog: '霧',
        drizzle: '小雨・霧雨',
        rainLight: '小雨',
        rainModerate: '雨',
        rainHeavy: '大雨',
        thunderstorm: '雷雨',
        snow: '雪'
      }
    },
    calendar: {
      today: '今日',
      prevPeriod: '前の期間',
      nextPeriod: '次の期間',
      selectView: '表示切替',
      viewDay: '1日表示',
      viewDayDesc: '1日',
      view2Days: '2日表示',
      view2DaysDesc: '2日',
      view3Days: '3日表示',
      view3DaysDesc: '3日',
      viewWeek: '週表示',
      viewWeekDesc: '7日間',
      view2Weeks: '2週間',
      view2WeeksDesc: '14日間',
      viewMonth: '月間表示',
      viewMonthDesc: '全月'
    },
    schedule: {
      title: 'スケジュール予定',
      newSchedule: '新規予定',
      allProjects: 'すべてのプロジェクト',
      all: 'すべての予定',
      upcoming: '近日予定',
      past: '過去'
    }
  },
  fr: {
    nav: {
      calendar: 'Calendrier',
      projects: 'Projets',
      schedules: 'Planning',
      todos: 'Tâches',
      habits: 'Habitudes',
      journal: 'Journal',
      settings: 'Paramètres',
      search: 'Recherche globale (Ctrl+K)',
      copilot: 'AI Copilote (Ctrl+J)'
    },
    settings: {
      title: 'Paramètres système',
      subtitle: 'Préférences et gestion des données locales',
      overview: 'Aperçu des données',
      totalProjects: 'Projets totaux',
      todoProgress: 'Progression des tâches',
      habitsCount: 'Habitudes actives',
      journalCount: 'Entrées de journal',
      appearance: 'Apparence',
      lightMode: 'Mode clair',
      darkMode: 'Mode sombre',
      autoTheme: 'Basculement automatique selon l’heure',
      autoThemeDesc: 'Bascule automatiquement entre clair et sombre',
      lightPeriod: 'Période claire (sombre autrement)',
      restoreDefault: 'Restaurer défaut (08:00 - 22:00)',
      defaultTimeRange: 'Défaut: 08:00 - 22:00',
      lightFrom: 'Clair dès',
      darkFrom: 'Sombre dès',
      to: 'à',
      runningAuto: 'Mode auto actif',
      currentAutoLight: 'État actuel: Mode clair (Jour)',
      currentAutoDark: 'État actuel: Mode sombre (Nuit)',
      uiScale: 'Échelle de l’interface',
      uiScaleDesc: 'Redimensionner proportionnellement les vues et cartes',
      fontFamily: 'Style de police',
      fontFamilyDesc: 'Changer la police de caractères globale',
      defaultFont: 'Défaut système',
      modernSans: 'Sans-serif moderne',
      elegantSerif: 'Serif élégant',
      language: 'Langue',
      languageDesc: 'Sélectionner la langue de l’interface',
      copilotTitle: 'Configuration AI Copilote',
      configured: 'Configuré',
      presetProviders: 'Fournisseurs recommandés',
      apiKey: 'Clé API',
      apiEndpoint: 'Point de terminaison API',
      modelName: 'Nom du modèle',
      saveConfig: 'Enregistrer la configuration',
      saved: 'Enregistré',
      testing: 'Test en cours...',
      testConnection: 'Tester la connexion',
      testSuccess: 'Connexion réussie !',
      testFailed: 'Échec de connexion',
      missingApiKey: 'Veuillez saisir une clé API',
      sync: 'Synchronisation Cloud',
      syncStatus: 'État',
      syncScope: 'Portée de synchronisation',
      syncAll: 'Synchronisation totale (avec Copilot)',
      syncExceptCopilot: 'Synchronisation standard (sans Copilot)',
      syncNow: 'Synchroniser maintenant',
      serverUrl: 'URL du serveur',
      account: 'Compte e-mail',
      password: 'Mot de passe',
      loginSync: 'Connexion & synchronisation',
      logout: 'Déconnecter',
      backup: 'Sauvegarde et réinitialisation',
      exportJson: 'Exporter sauvegarde JSON',
      importJson: 'Restaurer les données',
      clearAll: 'Effacer toutes les données',
      confirmClear: 'Voulez-vous vraiment supprimer toutes les données locales ? Cette action est irréversible !'
    },
    common: {
      save: 'Enregistrer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      delete: 'Supprimer',
      edit: 'Modifier',
      create: 'Créer',
      close: 'Fermer',
      refresh: 'Actualiser',
      search: 'Rechercher',
      loading: 'Chargement...',
      success: 'Succès',
      error: 'Erreur',
      all: 'Tous',
      locationAuto: 'Auto',
      locationManual: 'Manuel'
    },
    syncStatus: {
      local: 'Mode local',
      synced: 'Synchronisé',
      syncing: 'Synchronisation...',
      error: 'Erreur synchro',
      offline: 'Hors ligne',
      notSynced: 'Non synchronisé'
    },
    weather: {
      refresh: 'Actualiser la météo',
      redetect: 'Relocaliser automatiquement (IP/GPS)',
      redetectBtn: 'Relocaliser',
      popularCities: 'Villes populaires',
      searchPlaceholder: 'Rechercher une ville (ex: Paris, Lyon, Marseille...)',
      humidity: 'Humidité',
      windSpeed: 'Vitesse du vent',
      feelsLike: 'Ressenti',
      fullForecast: 'Prévisions',
      viewFullForecast: 'Consulter les prévisions météorologiques détaillées (Windy)',
      weatherTip: 'Note météo :',
      peakHour: '(Période clé ~{hour}:00)',
      copiedLink: 'Lien prévisions copié',
      condition: {
        clear: 'Ensoleillé',
        mostlyClear: 'Éclaircies',
        partlyCloudy: 'Partiellement nuageux',
        overcast: 'Couvert',
        fog: 'Brouillard',
        drizzle: 'Bruine',
        rainLight: 'Pluie faible',
        rainModerate: 'Pluie modérée',
        rainHeavy: 'Forte pluie',
        thunderstorm: 'Orage',
        snow: 'Neige'
      }
    },
    calendar: {
      today: 'Aujourd’hui',
      prevPeriod: 'Période précédente',
      nextPeriod: 'Période suivante',
      selectView: 'Changer de vue',
      viewDay: 'Vue Jour',
      viewDayDesc: '1 Jour',
      view2Days: 'Vue 2 Jours',
      view2DaysDesc: '2 Jours',
      view3Days: 'Vue 3 Jours',
      view3DaysDesc: '3 Jours',
      viewWeek: 'Vue Semaine',
      viewWeekDesc: '7 Jours',
      view2Weeks: 'Vue 2 Semaines',
      view2WeeksDesc: '14 Jours',
      viewMonth: 'Vue Mois',
      viewMonthDesc: 'Mois complet'
    },
    schedule: {
      title: 'Planning fixe',
      newSchedule: 'Nouveau planning',
      allProjects: 'Tous les projets',
      all: 'Tous les plannings',
      upcoming: 'À venir',
      past: 'Passé'
    }
  },
  de: {
    nav: {
      calendar: 'Kalender',
      projects: 'Projekte',
      schedules: 'Termine',
      todos: 'Aufgaben',
      habits: 'Gewohnheiten',
      journal: 'Tagebuch',
      settings: 'Einstellungen',
      search: 'Globale Suche (Ctrl+K)',
      copilot: 'KI-Copilot (Ctrl+J)'
    },
    settings: {
      title: 'Systemeinstellungen',
      subtitle: 'Präferenzen und lokale Datenverwaltung',
      overview: 'Datenübersicht',
      totalProjects: 'Projekte gesamt',
      todoProgress: 'Aufgabenfortschritt',
      habitsCount: 'Aktive Gewohnheiten',
      journalCount: 'Tagebucheinträge',
      appearance: 'Erscheinungsbild',
      lightMode: 'Heller Modus',
      darkMode: 'Dunkler Modus',
      autoTheme: 'Zeitbasierte Designumschaltung',
      autoThemeDesc: 'Automatischer Wechsel zwischen hellem und dunklem Modus',
      lightPeriod: 'Helles Zeitfenster (sonst dunkel)',
      restoreDefault: 'Standard wiederherstellen (08:00 - 22:00)',
      defaultTimeRange: 'Standard: 08:00 - 22:00',
      lightFrom: 'Hell ab',
      darkFrom: 'Dunkel ab',
      to: 'bis',
      runningAuto: 'Automatik aktiv',
      currentAutoLight: 'Aktuell: Heller Modus (Tag)',
      currentAutoDark: 'Aktuell: Dunkler Modus (Nacht)',
      uiScale: 'UI-Skalierung',
      uiScaleDesc: 'Proportionale Skalierung von Layout und Karten',
      fontFamily: 'Schriftart',
      fontFamilyDesc: 'Globale Typografie für alle Ansichten',
      defaultFont: 'Systemstandard',
      modernSans: 'Modernes Sans-Serif',
      elegantSerif: 'Elegantes Serif',
      language: 'Spracheinstellungen',
      languageDesc: 'Anzeigesprache auswählen',
      copilotTitle: 'KI-Copilot-Konfiguration',
      configured: 'Konfiguriert',
      presetProviders: 'Empfohlene Anbieter',
      apiKey: 'API-Schlüssel',
      apiEndpoint: 'Benutzerdefinierter API-Endpunkt',
      modelName: 'Modellbezeichnung',
      saveConfig: 'Konfiguration speichern',
      saved: 'Gespeichert',
      testing: 'Testen...',
      testConnection: 'Verbindung testen',
      testSuccess: 'Erfolgreich verbunden!',
      testFailed: 'Verbindung fehlgeschlagen',
      missingApiKey: 'Bitte zuerst API-Schlüssel eingeben',
      sync: 'Cloud-Synchronisierung',
      syncStatus: 'Status',
      syncScope: 'Synchronisierungsumfang',
      syncAll: 'Vollständig (inklusive Copilot-Config)',
      syncExceptCopilot: 'Standard (ohne Copilot-Config)',
      syncNow: 'Jetzt synchronisieren',
      serverUrl: 'Server-URL',
      account: 'Konto-E-Mail',
      password: 'Passwort',
      loginSync: 'Anmelden & Synchronisieren',
      logout: 'Trennen',
      backup: 'Datensicherung & Zurücksetzen',
      exportJson: 'JSON-Backup exportieren',
      importJson: 'Daten wiederherstellen',
      clearAll: 'Alle lokalen Daten löschen',
      confirmClear: 'Möchten Sie wirklich alle lokalen Daten löschen? Dies kann nicht rückgängig gemacht werden!'
    },
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      create: 'Erstellen',
      close: 'Schließen',
      refresh: 'Aktualisieren',
      search: 'Suchen',
      loading: 'Laden...',
      success: 'Erfolgreich',
      error: 'Fehler',
      all: 'Alle',
      locationAuto: 'Auto',
      locationManual: 'Manuell'
    },
    syncStatus: {
      local: 'Lokaler Modus',
      synced: 'Synchronisiert',
      syncing: 'Synchronisieren...',
      error: 'Sync-Fehler',
      offline: 'Offline-Modus',
      notSynced: 'Nicht synchronisiert'
    },
    weather: {
      refresh: 'Wetter aktualisieren',
      redetect: 'Standort neu ermitteln (IP/GPS)',
      redetectBtn: 'Standort ermitteln',
      popularCities: 'Beliebte Städte',
      searchPlaceholder: 'Stadt suchen (z. B. Berlin, München, Hamburg...)',
      humidity: 'Luftfeuchtigkeit',
      windSpeed: 'Windgeschwindigkeit',
      feelsLike: 'Gefühlt',
      fullForecast: 'Vorhersage',
      viewFullForecast: 'Ausführliche meteorologische Vorhersage öffnen (Windy)',
      weatherTip: 'Wetterhinweis:',
      peakHour: '(Schwerpunkt ~{hour}:00)',
      copiedLink: 'Wetter-Link kopiert',
      condition: {
        clear: 'Klar',
        mostlyClear: 'Überwiegend heiter',
        partlyCloudy: 'Teilweise bewölkt',
        overcast: 'Bedeckt',
        fog: 'Nebel',
        drizzle: 'Nieselregen',
        rainLight: 'Leichter Regen',
        rainModerate: 'Mäßiger Regen',
        rainHeavy: 'Starker Regen',
        thunderstorm: 'Gewitter',
        snow: 'Schnee'
      }
    },
    calendar: {
      today: 'Heute',
      prevPeriod: 'Vorheriger Zeitraum',
      nextPeriod: 'Nächster Zeitraum',
      selectView: 'Ansicht wählen',
      viewDay: 'Tagesansicht',
      viewDayDesc: '1 Tag',
      view2Days: '2-Tage-Ansicht',
      view2DaysDesc: '2 Tage',
      view3Days: '3-Tage-Ansicht',
      view3DaysDesc: '3 Tage',
      viewWeek: 'Wochenansicht',
      viewWeekDesc: '7 Tage',
      view2Weeks: '2-Wochen-Ansicht',
      view2WeeksDesc: '14 Tage',
      viewMonth: 'Monatsansicht',
      viewMonthDesc: 'Ganzer Monat'
    },
    schedule: {
      title: 'Feste Termine',
      newSchedule: 'Neuer Termin',
      allProjects: 'Alle Projekte',
      all: 'Alle Termine',
      upcoming: 'Bevorstehend',
      past: 'Vergangen'
    }
  }
}

function getInitialLocale(): SupportedLocale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && ['zh', 'en', 'ja', 'fr', 'de'].includes(saved)) {
      return saved as SupportedLocale
    }
    const navLang = navigator?.language?.toLowerCase() || ''
    if (navLang.startsWith('en')) return 'en'
    if (navLang.startsWith('ja')) return 'ja'
    if (navLang.startsWith('fr')) return 'fr'
    if (navLang.startsWith('de')) return 'de'
  } catch {}
  return 'zh'
}

export const currentLocale = ref<SupportedLocale>(getInitialLocale())

export function setLocale(locale: SupportedLocale): void {
  currentLocale.value = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  } catch {}
}

export function t(path: string, params?: Record<string, string | number>): string {
  const keys = path.split('.')
  let res: any = messages[currentLocale.value]
  for (const k of keys) {
    if (res && typeof res === 'object') {
      res = res[k]
    } else {
      res = undefined
      break
    }
  }

  // Fallback to 'zh' if missing in current locale
  if (res === undefined) {
    let fallback: any = messages['zh']
    for (const k of keys) {
      if (fallback && typeof fallback === 'object') {
        fallback = fallback[k]
      } else {
        fallback = undefined
        break
      }
    }
    res = fallback ?? path
  }

  if (typeof res === 'string' && params) {
    return res.replace(/\{(\w+)\}/g, (_, p) => String(params[p] ?? `{${p}}`))
  }

  return typeof res === 'string' ? res : path
}

export function useI18n() {
  return {
    currentLocale,
    setLocale,
    t,
    languageOptions: LANGUAGE_OPTIONS,
    messages
  }
}

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-hidden">
    <div
      class="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      @click="$emit('close')"
    ></div>

    <div class="fixed inset-y-0 left-0 max-w-full flex pr-0 sm:pr-10">
      <div
        class="w-screen sm:max-w-md bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-all duration-300 transform"
      >
        <div class="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ t('settings.title') }}</h2>
            <p class="text-xs text-slate-400 mt-0.5">{{ t('settings.subtitle') }}</p>
          </div>
          <button
            @click="$emit('close')"
            class="p-2 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
          <section class="space-y-3">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Activity class="w-3.5 h-3.5 text-blue-500" />
              <span>{{ t('settings.overview') }}</span>
            </h3>
            <div class="grid grid-cols-2 gap-3">
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div class="text-xs text-slate-400">{{ t('settings.totalProjects') }}</div>
                <div class="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {{ projectsCount }}
                </div>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div class="text-xs text-slate-400">{{ t('settings.todoProgress') }}</div>
                <div class="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {{ todosCount.completed }}/{{ todosCount.total }}
                </div>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div class="text-xs text-slate-400">{{ t('settings.habitsCount') }}</div>
                <div class="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {{ habitsCount }}
                </div>
              </div>
              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <div class="text-xs text-slate-400">{{ t('settings.journalCount') }}</div>
                <div class="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {{ journalsCount }}
                </div>
              </div>
            </div>
          </section>

          <section class="space-y-3">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <SunMoon class="w-3.5 h-3.5 text-blue-500" />
              <span>{{ t('settings.appearance') }}</span>
            </h3>
            <!-- 界面外观 (整合模式选择与自动定时为单个卡片) -->
            <div class="p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3.5">
              <!-- 模式选择双卡片 -->
              <div class="grid grid-cols-2 gap-3">
                <!-- 浅色模式 -->
                <button
                  type="button"
                  @click="handleSelectTheme(false)"
                  :class="[
                    'relative flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all cursor-pointer group',
                    !isDark
                      ? 'bg-white dark:bg-slate-700/90 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-600'
                  ]"
                >
                  <!-- 浅色视窗微缩图 -->
                  <div class="w-full h-12 rounded-lg bg-slate-100/90 border border-slate-200/90 p-1.5 flex flex-col justify-between mb-2 shadow-2xs">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1">
                        <div class="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center">
                          <Sun class="w-2.5 h-2.5 text-white" />
                        </div>
                        <div class="w-8 h-1.5 rounded-full bg-slate-300"></div>
                      </div>
                      <div class="w-2 h-2 rounded-full bg-blue-500/30"></div>
                    </div>
                    <div class="space-y-1">
                      <div class="w-full h-1.5 rounded-full bg-white shadow-2xs"></div>
                      <div class="w-3/4 h-1.5 rounded-full bg-slate-200"></div>
                    </div>
                  </div>

                  <div class="flex items-center justify-center gap-1.5">
                    <span :class="['text-xs font-semibold', !isDark ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300']">
                      {{ t('settings.lightMode') }}
                    </span>
                    <!-- 单选圆点 -->
                    <div
                      :class="[
                        'w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors',
                        !isDark
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      ]"
                    >
                      <div v-if="!isDark" class="w-1 h-1 rounded-full bg-white"></div>
                    </div>
                  </div>
                </button>

                <!-- 暗色模式 -->
                <button
                  type="button"
                  @click="handleSelectTheme(true)"
                  :class="[
                    'relative flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all cursor-pointer group',
                    isDark
                      ? 'bg-white dark:bg-slate-700/90 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-750 hover:border-slate-300 dark:hover:border-slate-600'
                  ]"
                >
                  <!-- 暗色视窗微缩图 -->
                  <div class="w-full h-12 rounded-lg bg-slate-900 border border-slate-800 p-1.5 flex flex-col justify-between mb-2 shadow-2xs">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-1">
                        <div class="w-3.5 h-3.5 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Moon class="w-2.5 h-2.5 text-white" />
                        </div>
                        <div class="w-8 h-1.5 rounded-full bg-slate-700"></div>
                      </div>
                      <div class="w-2 h-2 rounded-full bg-indigo-400/40"></div>
                    </div>
                    <div class="space-y-1">
                      <div class="w-full h-1.5 rounded-full bg-slate-800 shadow-2xs"></div>
                      <div class="w-3/4 h-1.5 rounded-full bg-slate-700/80"></div>
                    </div>
                  </div>

                  <div class="flex items-center justify-center gap-1.5">
                    <span :class="['text-xs font-semibold', isDark ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300']">
                      {{ t('settings.darkMode') }}
                    </span>
                    <!-- 单选圆点 -->
                    <div
                      :class="[
                        'w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors',
                        isDark
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      ]"
                    >
                      <div v-if="isDark" class="w-1 h-1 rounded-full bg-white"></div>
                    </div>
                  </div>
                </button>
              </div>

              <!-- 自动定时切换部分 (同卡片下方，由细分割线衔接) -->
              <div class="pt-3 border-t border-slate-200/80 dark:border-slate-700/70 space-y-2.5">
                <div class="flex items-center justify-between">
                  <div class="space-y-0.5">
                    <div class="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Clock class="w-3.5 h-3.5 text-blue-500" />
                      <span>{{ t('settings.autoTheme') }}</span>
                    </div>
                    <div class="text-[11px] text-slate-400">
                      {{ themeAutoEnabled ? (isCurrentTimeInAutoLight ? t('settings.currentAutoLight') : t('settings.currentAutoDark')) : t('settings.autoThemeDesc') }}
                    </div>
                  </div>
                  <!-- 开关 Toggle -->
                  <button
                    type="button"
                    @click="handleToggleAutoTheme"
                    :class="[
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                      themeAutoEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    ]"
                    role="switch"
                    :aria-checked="themeAutoEnabled"
                  >
                    <span
                      :class="[
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
                        themeAutoEnabled ? 'translate-x-4' : 'translate-x-0'
                      ]"
                    />
                  </button>
                </div>

                <!-- 时间段展开配置 -->
                <div v-if="themeAutoEnabled" class="pt-2 border-t border-slate-200/60 dark:border-slate-700/50 space-y-2.5">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-slate-600 dark:text-slate-400 font-medium">{{ t('settings.lightPeriod') }}</span>
                    <button
                      v-if="effectiveAutoStart !== '08:00' || effectiveAutoEnd !== '22:00'"
                      @click="resetAutoThemeTimes"
                      class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {{ t('settings.restoreDefault') }}
                    </button>
                    <span v-else class="text-[11px] text-slate-400">{{ t('settings.defaultTimeRange') }}</span>
                  </div>

                  <div class="flex items-center gap-2">
                    <div class="flex-1 flex items-center gap-1.5 bg-white dark:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-2xs">
                      <Sun class="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span class="text-[11px] text-slate-400 shrink-0">{{ t('settings.lightFrom') }}</span>
                      <input
                        type="time"
                        :value="effectiveAutoStart"
                        @change="handleStartTimeChange(($event.target as HTMLInputElement).value)"
                        class="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden w-full font-mono cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>

                    <span class="text-slate-400 text-xs font-medium">{{ t('settings.to') }}</span>

                    <div class="flex-1 flex items-center gap-1.5 bg-white dark:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-2xs">
                      <Moon class="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span class="text-[11px] text-slate-400 shrink-0">{{ t('settings.darkFrom') }}</span>
                      <input
                        type="time"
                        :value="effectiveAutoEnd"
                        @change="handleEndTimeChange(($event.target as HTMLInputElement).value)"
                        class="bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden w-full font-mono cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <!-- 实时状态提示 -->
                  <div class="flex items-center justify-between text-[11px] bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-1.5 rounded-lg border border-blue-100 dark:border-blue-900/40">
                    <span class="flex items-center gap-1.5">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                      <span>{{ isCurrentTimeInAutoLight ? t('settings.currentAutoLight') : t('settings.currentAutoDark') }}</span>
                    </span>
                    <span class="text-[10px] text-blue-500/80 dark:text-blue-400/80">
                      {{ t('settings.runningAuto') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-medium text-slate-800 dark:text-slate-200">{{ t('settings.uiScale') }}</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">
                    {{ t('settings.uiScaleDesc') }}
                  </div>
                </div>
                <span class="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {{ currentUiScaleLabel }}
                </span>
              </div>

              <div class="grid grid-cols-4 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  v-for="opt in uiScaleOptions"
                  :key="opt.value"
                  @click="$emit('change-ui-scale', opt.value)"
                  :class="[
                    'py-1.5 rounded-md font-medium transition-all text-center',
                    uiScale === opt.value
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-medium text-slate-800 dark:text-slate-200">{{ t('settings.fontFamily') }}</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">
                    {{ t('settings.fontFamilyDesc') }}
                  </div>
                </div>
                <span class="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {{ currentFontFamilyLabel }}
                </span>
              </div>

              <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  v-for="opt in fontFamilyOptions"
                  :key="opt.value"
                  @click="$emit('change-font-family', opt.value)"
                  :class="[
                    'py-1.5 rounded-md font-medium transition-all text-center',
                    fontFamily === opt.value
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs font-medium text-slate-800 dark:text-slate-200">{{ t('settings.fontSize') }}</div>
                  <div class="text-[11px] text-slate-400 mt-0.5">
                    {{ t('settings.fontSizeDesc') }}
                  </div>
                </div>
                <span class="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {{ currentFontSizeLabel }}
                </span>
              </div>

              <div class="grid grid-cols-4 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  v-for="opt in fontSizeOptions"
                  :key="opt.value"
                  @click="$emit('change-font-size', opt.value)"
                  :class="[
                    'py-1.5 rounded-md font-medium transition-all text-center',
                    fontSize === opt.value
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  ]"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- 多语言偏好设置 (Language Settings) -->
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <Languages class="w-3.5 h-3.5 text-blue-500" />
                  <div>
                    <div class="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {{ t('settings.language') }}
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5">
                      {{ t('settings.languageDesc') }}
                    </div>
                  </div>
                </div>
                <span class="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {{ currentLanguageLabel }}
                </span>
              </div>

              <!-- 3 种语言切换按钮组: 中文 / 英文 / 日文 -->
              <div class="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  v-for="lang in LANGUAGE_OPTIONS"
                  :key="lang.value"
                  type="button"
                  @click="setLocale(lang.value)"
                  :class="[
                    'py-1.5 px-0.5 rounded-md font-medium transition-all text-center truncate cursor-pointer',
                    currentLocale === lang.value
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  ]"
                  :title="lang.nativeName"
                >
                  {{ lang.label }}
                </button>
              </div>
            </div>
          </section>

          <!-- AI 智能副驾驶配置 (支持两个独立的 API 口子：文字规划 API 与 图片识别 API) -->
          <section class="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-all">
            <!-- 头部收纳卡片按钮 (默认收纳状态，点击后展开配置) -->
            <button
              type="button"
              @click="isAiSettingsExpanded = !isAiSettingsExpanded"
              class="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer select-none text-left"
              :aria-expanded="isAiSettingsExpanded"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Sparkles class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <span>{{ t('settings.copilotTitle') }}</span>
                  </div>
                  <div class="text-[11px] text-slate-400 truncate mt-0.5">
                    <span v-if="aiConfig.apiKey || (aiConfig.visionSeparate && aiConfig.visionApiKey)">
                      文字: {{ aiConfig.model || '未设' }} · 识图: {{ aiConfig.visionSeparate ? (aiConfig.visionModel || '独立配置') : '跟随文字模型' }}
                    </span>
                    <span v-else>
                      点击配置文字规划与图片识图两个独立 API 口子
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2 shrink-0 ml-2">
                <span
                  v-if="aiConfig.apiKey || (aiConfig.visionSeparate && aiConfig.visionApiKey)"
                  class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center gap-1"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {{ t('settings.configured') }}
                </span>
                <span
                  v-else
                  class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-400"
                >
                  {{ t('common.none') }}
                </span>
                <ChevronDown
                  class="w-4 h-4 text-slate-400 transition-transform duration-200"
                  :class="{ 'rotate-180 text-indigo-500': isAiSettingsExpanded }"
                />
              </div>
            </button>

            <!-- 折叠展开的具体配置区域 (仅在展开时展现) -->
            <div
              v-show="isAiSettingsExpanded"
              class="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 space-y-3.5 transition-all"
            >
              <!-- 顶部两个 API 口子切换 Tab 药丸 -->
              <div class="flex items-center p-1 bg-slate-200/70 dark:bg-slate-800/90 rounded-lg text-xs">
                <button
                  type="button"
                  @click="activeAiTab = 'text'"
                  :class="[
                    'flex-1 py-1.5 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer text-xs',
                    activeAiTab === 'text'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  ]"
                >
                  <MessageSquare class="w-3.5 h-3.5" />
                  <span>主文字模式 API</span>
                  <span v-if="aiConfig.apiKey" class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </button>
                <button
                  type="button"
                  @click="activeAiTab = 'vision'"
                  :class="[
                    'flex-1 py-1.5 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer text-xs',
                    activeAiTab === 'vision'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  ]"
                >
                  <Camera class="w-3.5 h-3.5" />
                  <span>图片识图 API</span>
                  <span
                    :class="[
                      'w-1.5 h-1.5 rounded-full',
                      (aiConfig.visionSeparate ? aiConfig.visionApiKey : aiConfig.apiKey) ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                    ]"
                  ></span>
                </button>
              </div>

              <!-- ================= 1. 主文字模式 API 面板 ================= -->
              <div v-show="activeAiTab === 'text'" class="space-y-3.5 animate-in fade-in duration-150">
                <div class="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-700 dark:text-blue-300 flex items-start gap-2">
                  <Info class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span class="leading-relaxed">
                    负责日常规划、任务拆解与日程排期。推荐使用 <strong>DeepSeek-V3 / R1</strong>、Claude、OpenAI 等文本大模型。
                  </span>
                </div>

                <!-- 推荐预设 -->
                <div class="space-y-1.5">
                  <div class="text-xs font-medium text-slate-800 dark:text-slate-200">文字模型服务商预设</div>
                  <div class="grid grid-cols-3 gap-1.5 text-xs">
                    <button
                      v-for="(preset, pKey) in providerPresets"
                      :key="pKey"
                      type="button"
                      @click="applyProviderPreset(pKey)"
                      :class="[
                        'p-1.5 rounded-lg border text-center transition-all truncate text-[11px] cursor-pointer',
                        aiConfig.provider === pKey
                          ? 'bg-white dark:bg-slate-700 border-indigo-500 text-indigo-600 dark:text-white font-semibold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                      ]"
                    >
                      {{ preset.label.split(' ')[0] }}
                    </button>
                  </div>
                </div>

                <!-- Base URL -->
                <div class="space-y-1">
                  <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">API 接口地址 (Base URL)</label>
                  <input
                    v-model="aiConfig.baseUrl"
                    type="text"
                    placeholder="如 https://api.deepseek.com 或 http://localhost:11434/v1"
                    class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <!-- API Key -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">API 密钥 (API Key)</label>
                    <span class="text-[10px] text-slate-400">保存在本地浏览器</span>
                  </div>
                  <input
                    v-model="aiConfig.apiKey"
                    type="password"
                    placeholder="sk-..."
                    class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <!-- Model Name -->
                <div class="space-y-1">
                  <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">模型名称 (Model)</label>
                  <input
                    v-model="aiConfig.model"
                    type="text"
                    placeholder="如 deepseek-chat 或 gpt-4o-mini"
                    class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <!-- Nginx Proxy Switch -->
                <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <div class="text-xs font-medium text-slate-800 dark:text-slate-200">使用服务器反向代理</div>
                    <div class="text-[11px] text-slate-400">解决跨域拦截或 HTTPS 下无法访问本地模型的问题</div>
                  </div>
                  <button
                    type="button"
                    @click="aiConfig.useProxy = !aiConfig.useProxy"
                    :class="[
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                      aiConfig.useProxy ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    ]"
                    role="switch"
                    :aria-checked="aiConfig.useProxy"
                  >
                    <span
                      :class="[
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
                        aiConfig.useProxy ? 'translate-x-4' : 'translate-x-0'
                      ]"
                    />
                  </button>
                </div>

                <!-- Action buttons: Save & Ping Test -->
                <div class="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    @click="handleSaveAiConfig"
                    class="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-medium transition-all shadow-xs cursor-pointer text-center"
                  >
                    保存设置
                  </button>
                  <button
                    type="button"
                    @click="handleTestTextAiConnection"
                    :disabled="isTestingTextAi"
                    class="py-2 px-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-98 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all cursor-pointer text-center"
                  >
                    {{ isTestingTextAi ? '正在测试...' : '⚡ 测试文字接口' }}
                  </button>
                </div>

                <!-- Test feedback -->
                <div
                  v-if="textAiTestResult"
                  :class="[
                    'p-2.5 rounded-lg border text-[11px] leading-relaxed',
                    textAiTestResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                  ]"
                >
                  {{ textAiTestResult.message }}
                </div>
              </div>

              <!-- ================= 2. 图片识图 API 面板 ================= -->
              <div v-show="activeAiTab === 'vision'" class="space-y-3.5 animate-in fade-in duration-150">
                <div class="p-2.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 text-[11px] text-purple-700 dark:text-purple-300 flex items-start gap-2">
                  <Camera class="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span class="leading-relaxed">
                    专用于课程表、作息表、日程清单、会议截图等多模态视觉识别与结构化提取。推荐使用 <strong>SiliconFlow Qwen2.5-VL</strong>、<strong>OpenAI gpt-4o-mini</strong> 或本地 <strong>llama3.2-vision</strong>。
                  </span>
                </div>

                <!-- 独立视觉配置开关卡片 -->
                <div class="p-3 rounded-xl bg-white dark:bg-slate-750 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">独立配置图片识别 API</div>
                    <div class="text-[11px] text-slate-400 mt-0.5">
                      {{ aiConfig.visionSeparate ? '已启用独立配置，识图排程将调用下方专用视觉 AI' : '未启用，识图排程将直接复用主文字模型' }}
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="aiConfig.visionSeparate = !aiConfig.visionSeparate"
                    :class="[
                      'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                      aiConfig.visionSeparate ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                    ]"
                    role="switch"
                    :aria-checked="aiConfig.visionSeparate"
                  >
                    <span
                      :class="[
                        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
                        aiConfig.visionSeparate ? 'translate-x-4' : 'translate-x-0'
                      ]"
                    />
                  </button>
                </div>

                <!-- 未启用独立配置时的提示卡片 -->
                <div
                  v-if="!aiConfig.visionSeparate"
                  class="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-300 space-y-2"
                >
                  <div class="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                    <Info class="w-3.5 h-3.5 text-indigo-500" />
                    <span>当前复用文字模型：{{ aiConfig.model || '未配置' }}</span>
                  </div>
                  <p class="text-[11px] text-slate-400 leading-relaxed">
                    若您的主文字模型为 DeepSeek-V3 / R1 等纯文本模型，将无法接收图片输入。开启上方开关即可单独指定支持识图的 AI 接口，文字和图片两不误。
                  </p>
                  <button
                    type="button"
                    @click="aiConfig.visionSeparate = true"
                    class="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>开启独立图片识别配置 →</span>
                  </button>
                </div>

                <!-- 开启独立配置时的具体输入字段 -->
                <div v-else class="space-y-3 pt-1">
                  <!-- 视觉推荐服务商预设 -->
                  <div class="space-y-1.5">
                    <div class="text-xs font-medium text-slate-800 dark:text-slate-200">识图模型推荐预设</div>
                    <div class="grid grid-cols-3 gap-1.5 text-xs">
                      <button
                        v-for="(preset, pKey) in visionProviderPresets"
                        :key="pKey"
                        type="button"
                        @click="applyVisionProviderPreset(pKey)"
                        :class="[
                          'p-1.5 rounded-lg border text-center transition-all truncate text-[11px] cursor-pointer',
                          aiConfig.visionProvider === pKey
                            ? 'bg-white dark:bg-slate-700 border-indigo-500 text-indigo-600 dark:text-white font-semibold shadow-2xs'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750'
                        ]"
                      >
                        {{ preset.label.split(' ')[0] }}
                      </button>
                    </div>
                  </div>

                  <!-- Vision Base URL -->
                  <div class="space-y-1">
                    <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">识图 API 接口地址 (Base URL)</label>
                    <input
                      v-model="aiConfig.visionBaseUrl"
                      type="text"
                      placeholder="如 https://api.siliconflow.cn/v1 或 https://api.openai.com/v1"
                      class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <!-- Vision API Key -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">识图 API 密钥 (API Key)</label>
                      <span class="text-[10px] text-slate-400">独立保存在本地</span>
                    </div>
                    <input
                      v-model="aiConfig.visionApiKey"
                      type="password"
                      placeholder="sk-..."
                      class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <!-- Vision Model Name -->
                  <div class="space-y-1">
                    <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">识图模型名称 (Model)</label>
                    <input
                      v-model="aiConfig.visionModel"
                      type="text"
                      placeholder="如 Qwen/Qwen2.5-VL-72B-Instruct 或 gpt-4o-mini"
                      class="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <!-- Vision Nginx Proxy Switch -->
                  <div class="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div class="text-xs font-medium text-slate-800 dark:text-slate-200">识图接口使用反向代理</div>
                      <div class="text-[11px] text-slate-400">解决跨域拦截或局域网访问限制</div>
                    </div>
                    <button
                      type="button"
                      @click="aiConfig.visionUseProxy = !aiConfig.visionUseProxy"
                      :class="[
                        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                        aiConfig.visionUseProxy ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                      ]"
                      role="switch"
                      :aria-checked="aiConfig.visionUseProxy"
                    >
                      <span
                        :class="[
                          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out',
                          aiConfig.visionUseProxy ? 'translate-x-4' : 'translate-x-0'
                        ]"
                      />
                    </button>
                  </div>

                  <!-- Action buttons: Save & Ping Test -->
                  <div class="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      @click="handleSaveAiConfig"
                      class="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-medium transition-all shadow-xs cursor-pointer text-center"
                    >
                      保存设置
                    </button>
                    <button
                      type="button"
                      @click="handleTestVisionAiConnection"
                      :disabled="isTestingVisionAi"
                      class="py-2 px-3 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-98 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all cursor-pointer text-center"
                    >
                      {{ isTestingVisionAi ? '正在测试...' : '⚡ 测试识图接口' }}
                    </button>
                  </div>

                  <!-- Test feedback -->
                  <div
                    v-if="visionAiTestResult"
                    :class="[
                      'p-2.5 rounded-lg border text-[11px] leading-relaxed',
                      visionAiTestResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
                    ]"
                  >
                    {{ visionAiTestResult.message }}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 云端多端实时同步 (PocketBase) -->
          <section class="space-y-3">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <Cloud class="w-3.5 h-3.5 text-blue-500" />
                <span>云端多端同步 (PocketBase)</span>
              </span>
              <span v-if="isAuthenticated" class="text-[11px] font-normal text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                已连接
              </span>
            </h3>

            <!-- Logged In Card -->
            <div v-if="isAuthenticated" class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {{ (currentUser?.email || 'U').substring(0, 1).toUpperCase() }}
                  </div>
                  <div>
                    <div class="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {{ currentUser?.email?.replace(/@akasha\.local$/, '') || currentUser?.email }}
                      <span v-if="currentUser?.email?.endsWith('@akasha.local')" class="text-[10px] text-slate-400 font-normal ml-1">(简易账号)</span>
                    </div>
                    <div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <span>状态: {{ syncStatusLabel }}</span>
                      <span>·</span>
                      <span>最近: {{ formatSyncTime(lastSyncTime) }}</span>
                    </div>
                  </div>
                </div>

                <button
                  @click="handleLogout"
                  class="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  title="退出登录"
                >
                  <LogOut class="w-4 h-4" />
                </button>
              </div>

              <div v-if="syncError" class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-600 dark:text-rose-400">
                <div class="flex items-start justify-between gap-2">
                  <div class="break-all leading-relaxed">{{ syncError }}</div>
                  <button
                    @click="handleClearSyncQueue"
                    class="shrink-0 px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-800 text-[10px] font-medium text-rose-700 dark:text-rose-200 transition-colors cursor-pointer"
                    title="清空滞留队列并重新同步"
                  >
                    重置队列
                  </button>
                </div>
              </div>

              <!-- 同步数据范围下拉选项 (可选择是否同步 AI Copilot 配置) -->
              <div class="p-3 rounded-lg bg-white/70 dark:bg-slate-750/70 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles class="w-3.5 h-3.5 text-indigo-500" />
                    <span>{{ t('settings.syncScopeLabel') }}</span>
                  </label>
                  <span
                    :class="[
                      'text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors',
                      syncCopilotOption === 'include_copilot'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    ]"
                  >
                    {{ syncCopilotOption === 'include_copilot' ? t('settings.syncIncludeCopilot') : t('settings.syncBusinessOnly') }}
                  </span>
                </div>

                <!-- 下拉选择框 -->
                <div class="relative">
                  <select
                    v-model="syncCopilotOption"
                    @change="handleSyncCopilotChange"
                    class="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-medium focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-2xs"
                  >
                    <option value="business_only">{{ t('settings.syncBusinessDesc') }}</option>
                    <option value="include_copilot">{{ t('settings.syncIncludeCopilotDesc') }}</option>
                  </select>
                </div>

                <div class="text-[10px] text-slate-400 dark:text-slate-400 leading-normal">
                  {{ syncCopilotOption === 'include_copilot'
                    ? t('settings.syncCopilotTipInclude')
                    : t('settings.syncCopilotTipExclude') }}
                </div>
              </div>

              <!-- Action buttons -->
              <div class="grid grid-cols-1 gap-2 pt-1">
                <button
                  @click="handleManualSync"
                  :disabled="isSyncing"
                  class="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white text-xs font-medium transition-all shadow-xs"
                >
                  <RefreshCw :class="['w-3.5 h-3.5', isSyncing ? 'animate-spin' : '']" />
                  <span>{{ isSyncing ? t('syncStatus.syncing') : t('settings.syncNow') }}</span>
                </button>

                <div class="grid grid-cols-2 gap-2">
                  <button
                    @click="handleUploadAll"
                    :disabled="isSyncing"
                    class="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-[11px] font-medium transition-colors"
                  >
                    {{ t('settings.uploadAllBtn') }}
                  </button>
                  <button
                    @click="handleDownloadAll"
                    :disabled="isSyncing"
                    class="py-1.5 px-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-[11px] font-medium transition-colors"
                  >
                    {{ t('settings.downloadAllBtn') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Login / Register Form -->
            <div v-else class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                连接私有云服务器（PocketBase），手机修改后电脑瞬间同步，且两端断网依然可用。
              </p>

              <!-- Server URL config -->
              <div>
                <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {{ t('settings.serverUrlLabel') }}
                </label>
                <div class="flex items-center gap-1.5">
                  <input
                    v-model="inputServerUrl"
                    type="text"
                    placeholder="https://your-domain.com"
                    class="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                  <button
                    @click="handleSaveServerUrl"
                    class="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    {{ t('common.save') }}
                  </button>
                </div>
                <div class="text-[10px] text-slate-400 mt-1">
                  {{ t('settings.serverUrlHint') }}
                </div>
              </div>

              <!-- Auth Mode Switcher -->
              <div class="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  @click="authMode = 'login'"
                  :class="[
                    'text-xs font-medium pb-1 border-b-2 transition-colors',
                    authMode === 'login'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  ]"
                >
                  {{ t('settings.loginTab') }}
                </button>
                <button
                  type="button"
                  @click="authMode = 'register'"
                  :class="[
                    'text-xs font-medium pb-1 border-b-2 transition-colors',
                    authMode === 'register'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  ]"
                >
                  {{ t('settings.registerTab') }}
                </button>
              </div>

              <!-- Form inputs -->
              <div class="space-y-2.5">
                <div>
                  <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {{ t('settings.accountLabel') }}
                  </label>
                  <input
                    v-model="authEmail"
                    type="text"
                    :placeholder="t('settings.accountPlaceholder')"
                    class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                  <div v-if="authEmail.trim() && !authEmail.includes('@')" class="text-[10px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                    <span>💡 用户名将自动匹配为 <b>{{ authEmail.trim() }}@akasha.local</b></span>
                  </div>
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                    {{ t('settings.passwordLabel') }}
                  </label>
                  <input
                    v-model="authPassword"
                    type="password"
                    :placeholder="authMode === 'register' ? t('settings.passwordPlaceholderRegister') : t('settings.passwordPlaceholderLogin')"
                    class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div v-if="authErrorMessage" class="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-[11px] text-rose-600 dark:text-rose-400">
                {{ authErrorMessage }}
              </div>

              <button
                @click="handleAuthSubmit"
                :disabled="isAuthLoading"
                class="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium transition-all shadow-xs"
              >
                <RefreshCw v-if="isAuthLoading" class="w-3.5 h-3.5 animate-spin" />
                <span>{{ isAuthLoading ? t('common.loading') : (authMode === 'login' ? t('settings.loginSync') : t('settings.registerTab')) }}</span>
              </button>
            </div>
          </section>

          <section class="space-y-3">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Database class="w-3.5 h-3.5 text-blue-500" />
              <span>数据备份与恢复</span>
            </h3>
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-3">
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                所有数据均在当前浏览器的本地数据库（IndexedDB）中安全离线存储。请定期导出 JSON 备份文件以备异地还原。
              </p>

              <div class="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  @click="$emit('export-data')"
                  class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-medium transition-colors"
                >
                  <Download class="w-3.5 h-3.5" />
                  <span>导出备份 (JSON)</span>
                </button>

                <label
                  class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-medium cursor-pointer transition-colors"
                >
                  <Upload class="w-3.5 h-3.5" />
                  <span>导入恢复备份</span>
                  <input type="file" accept=".json" class="hidden" @change="handleFileImport" />
                </label>
              </div>
            </div>
          </section>

          <!-- 系统与版本信息 (内测版从 0. 开始，包含分支信息) -->
          <section class="space-y-3">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
              <span class="flex items-center gap-1.5">
                <Info class="w-3.5 h-3.5 text-blue-500" />
                <span>{{ t('settings.systemInfo') }}</span>
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                {{ t('settings.betaStage') }}
              </span>
            </h3>

            <div class="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/40 space-y-2.5 text-xs">
              <!-- 版本号 (从 0. 开始的内测版) -->
              <div class="flex items-center justify-between">
                <span class="text-slate-500 dark:text-slate-400">{{ t('settings.appVersion') }}</span>
                <span class="font-bold text-slate-800 dark:text-slate-100 font-mono flex items-center gap-1.5">
                  <span>{{ versionInfo.fullVersionString }}</span>
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                </span>
              </div>

              <!-- 分支信息与是否分支 -->
              <div class="flex items-center justify-between">
                <span class="text-slate-500 dark:text-slate-400">{{ t('settings.branch') }}</span>
                <div class="flex items-center gap-1.5 font-mono text-[11px]">
                  <GitBranch class="w-3.5 h-3.5 text-indigo-500" />
                  <span :class="versionInfo.isBranch ? 'text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-slate-700 dark:text-slate-300'">
                    {{ versionInfo.branch }}
                  </span>
                  <span
                    :class="[
                      'text-[9px] px-1.5 py-0.2 rounded font-sans font-medium',
                      versionInfo.isBranch
                        ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                    ]"
                  >
                    {{ versionInfo.isBranch ? t('settings.featureBranch') : t('settings.mainStable') }}
                  </span>
                </div>
              </div>

              <!-- Commit 提交节点 -->
              <div v-if="versionInfo.commit" class="flex items-center justify-between">
                <span class="text-slate-500 dark:text-slate-400">{{ t('settings.commit') }}</span>
                <span class="font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                  {{ versionInfo.commit }}
                </span>
              </div>

              <!-- 存储引擎 -->
              <div class="flex items-center justify-between">
                <span class="text-slate-500 dark:text-slate-400">{{ t('settings.offlineStorage') }}</span>
                <span class="text-slate-600 dark:text-slate-300 font-medium">
                  {{ t('settings.offlineStorageDesc') }}
                </span>
              </div>
            </div>
          </section>

          <section class="space-y-3">
            <h3 class="text-xs font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle class="w-3.5 h-3.5 text-rose-500" />
              <span>{{ t('settings.dangerZone') }}</span>
            </h3>
            <div class="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 space-y-3">
              <div class="text-xs text-rose-700 dark:text-rose-300">
                {{ t('settings.dangerDesc') }}
              </div>
              <button
                @click="$emit('clear-all')"
                class="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium transition-colors"
              >
                <Trash2 class="w-3.5 h-3.5" />
                <span>{{ t('settings.clearAllBtn') }}</span>
              </button>
            </div>
          </section>
        </div>

        <div class="px-4 sm:px-6 py-3.5 pb-safe border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div class="flex items-center gap-1.5 truncate">
            <span class="font-mono font-medium text-slate-600 dark:text-slate-300">Akasha {{ versionInfo.version }} {{ t('settings.betaStage') }}</span>
            <span class="text-slate-300 dark:text-slate-700">·</span>
            <span class="text-[11px] font-mono text-indigo-500 dark:text-indigo-400 truncate">{{ versionInfo.branch }}</span>
          </div>
          <button
            @click="$emit('close')"
            class="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer shrink-0 ml-2"
          >
            {{ t('settings.done') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  X,
  Activity,
  SunMoon,
  Sun,
  Moon,
  Clock,
  Sparkles,
  Database,
  Download,
  Upload,
  AlertTriangle,
  Trash2,
  Cloud,
  RefreshCw,
  LogOut,
  Languages,
  ChevronDown,
  Info,
  GitBranch,
  Camera,
  MessageSquare,
} from 'lucide-vue-next'
import { getAppVersionInfo } from '@/utils/version'
import { t, currentLocale, setLocale, LANGUAGE_OPTIONS, type SupportedLocale } from '@/utils/i18n'
import type { FontSize, FontFamily, UiScale } from '@/types'
import type { AiProviderConfig, AiProviderType } from '@/types/copilot'
import {
  loadAiConfig,
  saveAiConfig,
  testAiConnection,
  onAiConfigChange,
  PROVIDER_PRESETS,
  VISION_PROVIDER_PRESETS,
  getTextConfig,
  getVisionConfig,
} from '@/services/aiService'
import {
  serverUrl,
  currentUser,
  isAuthenticated,
  setServerUrl,
  loginUser,
  registerUser,
  logoutUser,
  formatAuthErrorMessage,
} from '@/sync/pocketbase'
import {
  syncStatus,
  lastSyncTime,
  syncError,
  syncAll,
  uploadAllLocalToCloud,
  downloadAllCloudToLocal,
  resetSyncOutbox,
  syncCopilotEnabled,
  setSyncCopilotEnabled,
  enqueueChange,
} from '@/sync/syncEngine'

const props = defineProps<{
  isOpen: boolean
  isDark: boolean
  themeAutoEnabled?: boolean
  themeAutoStart?: string
  themeAutoEnd?: string
  fontSize: FontSize
  fontFamily: FontFamily
  uiScale: UiScale
  projectsCount: number
  todosCount: { total: number; completed: number }
  habitsCount: number
  journalsCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'toggle-theme'): void
  (e: 'set-theme', dark: boolean): void
  (e: 'update-theme-auto', payload: { enabled: boolean; start: string; end: string }): void
  (e: 'change-font-size', size: FontSize): void
  (e: 'change-font-family', family: FontFamily): void
  (e: 'change-ui-scale', scale: UiScale): void
  (e: 'export-data'): void
  (e: 'import-data', jsonData: string): void
  (e: 'clear-all'): void
  (e: 'reload-data'): void
}>()

function handleSelectTheme(dark: boolean) {
  if (props.isDark === dark) return
  emit('set-theme', dark)
}

// --- 自动暗色/浅色模式逻辑 ---
const effectiveAutoStart = computed(() => props.themeAutoStart || '08:00')
const effectiveAutoEnd = computed(() => props.themeAutoEnd || '22:00')

const isCurrentTimeInAutoLight = computed(() => {
  const start = effectiveAutoStart.value
  const end = effectiveAutoEnd.value
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const cur = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  if (start <= end) {
    return cur >= start && cur < end
  } else {
    return cur >= start || cur < end
  }
})

function handleToggleAutoTheme() {
  emit('update-theme-auto', {
    enabled: !props.themeAutoEnabled,
    start: effectiveAutoStart.value,
    end: effectiveAutoEnd.value,
  })
}

function handleStartTimeChange(newStart: string) {
  if (!newStart) return
  emit('update-theme-auto', {
    enabled: props.themeAutoEnabled ?? false,
    start: newStart,
    end: effectiveAutoEnd.value,
  })
}

function handleEndTimeChange(newEnd: string) {
  if (!newEnd) return
  emit('update-theme-auto', {
    enabled: props.themeAutoEnabled ?? false,
    start: effectiveAutoStart.value,
    end: newEnd,
  })
}

function resetAutoThemeTimes() {
  emit('update-theme-auto', {
    enabled: true,
    start: '08:00',
    end: '22:00',
  })
}

// --- 版本信息 (从 0. 开始的内测版与分支信息) ---
const versionInfo = getAppVersionInfo()

// --- AI Copilot Settings Logic (两个独立 API 口子: 主文字模式 + 图片识图) ---
const aiConfig = ref<AiProviderConfig>(loadAiConfig())
const providerPresets = PROVIDER_PRESETS
const visionProviderPresets = VISION_PROVIDER_PRESETS
const activeAiTab = ref<'text' | 'vision'>('text')

// AI 设置收纳折叠状态 (默认收纳，点开后展开配置)
const isAiSettingsExpanded = ref(false)

// 响应远程同步对 AI 配置的实时变更推送
onAiConfigChange((newCfg) => {
  aiConfig.value = { ...newCfg }
})

// 同步范围下拉选项: 'business_only' | 'include_copilot'
const syncCopilotOption = ref<'business_only' | 'include_copilot'>(
  syncCopilotEnabled.value ? 'include_copilot' : 'business_only'
)

// 监听云端同步开关状态并保持单向/双向绑定
watch(syncCopilotEnabled, (val) => {
  syncCopilotOption.value = val ? 'include_copilot' : 'business_only'
})

function handleSyncCopilotChange() {
  const enabled = syncCopilotOption.value === 'include_copilot'
  setSyncCopilotEnabled(enabled)
  if (enabled && isAuthenticated.value) {
    enqueueChange('copilotConfig', 'global', aiConfig.value)
    handleManualSync()
  }
}

function applyProviderPreset(pKey: AiProviderType) {
  const p = PROVIDER_PRESETS[pKey]
  aiConfig.value.provider = pKey
  if (p.baseUrl) aiConfig.value.baseUrl = p.baseUrl
  if (p.defaultModel) aiConfig.value.model = p.defaultModel
}

function applyVisionProviderPreset(pKey: AiProviderType) {
  const p = VISION_PROVIDER_PRESETS[pKey]
  aiConfig.value.visionProvider = pKey
  if (p.baseUrl) aiConfig.value.visionBaseUrl = p.baseUrl
  if (p.defaultModel) aiConfig.value.visionModel = p.defaultModel
}

function handleSaveAiConfig() {
  saveAiConfig(aiConfig.value)
  if (syncCopilotEnabled.value && isAuthenticated.value) {
    enqueueChange('copilotConfig', 'global', aiConfig.value)
  }
  alert('AI 大模型配置已成功保存！' + (syncCopilotEnabled.value ? '（已同步至云端）' : ''))
}

// 主文字模式连通性测试
const isTestingTextAi = ref(false)
const textAiTestResult = ref<{ success: boolean; message: string } | null>(null)

async function handleTestTextAiConnection() {
  isTestingTextAi.value = true
  textAiTestResult.value = null
  try {
    const textCfg = getTextConfig(aiConfig.value)
    const res = await testAiConnection(textCfg)
    textAiTestResult.value = res
  } catch (err: any) {
    textAiTestResult.value = { success: false, message: '测试请求异常: ' + (err.message || err) }
  } finally {
    isTestingTextAi.value = false
  }
}

// 图片识图模式连通性测试
const isTestingVisionAi = ref(false)
const visionAiTestResult = ref<{ success: boolean; message: string } | null>(null)

async function handleTestVisionAiConnection() {
  isTestingVisionAi.value = true
  visionAiTestResult.value = null
  try {
    const visionCfg = getVisionConfig(aiConfig.value)
    const res = await testAiConnection(visionCfg)
    visionAiTestResult.value = res
  } catch (err: any) {
    visionAiTestResult.value = { success: false, message: '测试请求异常: ' + (err.message || err) }
  } finally {
    isTestingVisionAi.value = false
  }
}

// 兼容别名
const isTestingAi = isTestingTextAi
const aiTestResult = textAiTestResult
const handleTestAiConnection = handleTestTextAiConnection

// --- Cloud Sync Logic ---
const inputServerUrl = ref(serverUrl.value)
const authMode = ref<'login' | 'register'>('login')
const authEmail = ref('')
const authPassword = ref('')
const isAuthLoading = ref(false)
const authErrorMessage = ref('')

const isSyncing = computed(() => syncStatus.value === 'syncing')

const syncStatusLabel = computed(() => {
  switch (syncStatus.value) {
    case 'synced':
      return t('syncStatus.synced')
    case 'syncing':
      return t('syncStatus.syncing')
    case 'error':
      return t('syncStatus.error')
    case 'offline':
      return t('syncStatus.offline')
    default:
      return t('syncStatus.notSynced')
  }
})

function formatSyncTime(ts: number | null): string {
  if (!ts) return '尚未同步'
  const date = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function handleSaveServerUrl() {
  if (!inputServerUrl.value.trim()) {
    inputServerUrl.value = window.location.origin
  }
  setServerUrl(inputServerUrl.value)
  alert('服务器地址已更新：' + serverUrl.value)
}

async function handleAuthSubmit() {
  authErrorMessage.value = ''
  const trimmedAccount = authEmail.value.trim()
  if (!trimmedAccount) {
    authErrorMessage.value = '请输入账号或邮箱'
    return
  }
  if (!authPassword.value) {
    authErrorMessage.value = '请输入密码'
    return
  }
  if (authMode.value === 'register' && authPassword.value.length < 8) {
    authErrorMessage.value = '安全限制：注册密码长度必须至少为 8 位（例如 12345678）'
    return
  }

  isAuthLoading.value = true
  try {
    if (authMode.value === 'login') {
      await loginUser(trimmedAccount, authPassword.value)
    } else {
      await registerUser(trimmedAccount, authPassword.value)
    }
    const successMode = authMode.value
    // Perform initial bidirectional sync
    await syncAll()
    authPassword.value = ''
    emit('reload-data')
    alert(successMode === 'login' ? '🎉 登录成功！已成功连接云端实时同步。' : '🎉 注册成功！已成功开启云端实时同步。')
  } catch (err: any) {
    console.error('Auth error:', err)
    authErrorMessage.value = formatAuthErrorMessage(err)
  } finally {
    isAuthLoading.value = false
  }
}

function handleLogout() {
  if (confirm('确定退出当前云端账号吗？退出后数据依然保存在本地浏览器中。')) {
    logoutUser()
  }
}

async function handleManualSync() {
  try {
    await syncAll()
    emit('reload-data')
  } catch (err: any) {
    alert('同步出错：' + (err?.message || err))
  }
}

async function handleClearSyncQueue() {
  resetSyncOutbox()
  syncError.value = null
  syncStatus.value = 'synced'
  await handleManualSync()
}

async function handleUploadAll() {
  if (confirm('确认将当前设备本地全部数据推送到云端吗？')) {
    try {
      const res = await uploadAllLocalToCloud()
      alert(`已成功推送 ${res.count} 项数据到云端！`)
      emit('reload-data')
    } catch (err: any) {
      alert('推送失败：' + (err?.message || err))
    }
  }
}

async function handleDownloadAll() {
  if (confirm('【高危提醒】从云端拉取将用云端数据覆盖当前本地 IndexedDB 数据，确定继续吗？')) {
    try {
      const res = await downloadAllCloudToLocal()
      alert(`已从云端拉取还原 ${res.count} 项数据！`)
      emit('reload-data')
    } catch (err: any) {
      alert('拉取失败：' + (err?.message || err))
    }
  }
}


const uiScaleOptions = computed<{ value: UiScale; label: string }[]>(() => [
  { value: 'compact', label: t('settings.scaleCompact') },
  { value: 'standard', label: t('settings.scaleStandard') },
  { value: 'comfortable', label: t('settings.scaleComfort') },
])

const currentUiScaleLabel = computed(() => {
  return uiScaleOptions.value.find((o) => o.value === props.uiScale)?.label || t('settings.scaleStandard')
})

const fontFamilyOptions = computed<{ value: FontFamily; label: string }[]>(() => [
  { value: 'wenkai', label: t('settings.defaultFont') },
  { value: 'system', label: t('settings.modernSans') },
  { value: 'serif', label: t('settings.elegantSerif') },
])

const currentFontFamilyLabel = computed(() => {
  return fontFamilyOptions.value.find((o) => o.value === props.fontFamily)?.label || t('settings.defaultFont')
})

const fontSizeOptions = computed<{ value: FontSize; label: string }[]>(() => [
  { value: 'small', label: t('settings.fontSmall') },
  { value: 'standard', label: t('settings.fontMedium') },
  { value: 'large', label: t('settings.fontLarge') },
  { value: 'xlarge', label: t('settings.fontXLarge') },
])

const currentFontSizeLabel = computed(() => {
  return fontSizeOptions.value.find((o) => o.value === props.fontSize)?.label || t('settings.fontMedium')
})

const currentLanguageLabel = computed(() => {
  const found = LANGUAGE_OPTIONS.find((l) => l.value === currentLocale.value)
  return found ? found.label : '中文'
})

function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) {
      emit('import-data', text)
      target.value = ''
    }
  }
  reader.readAsText(file)
}
</script>

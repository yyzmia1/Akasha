<template>
  <div
    v-if="isOpen"
    :class="[
      'fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-md transition-all duration-300',
      isExpanded
        ? 'items-center p-2 sm:p-4 lg:p-6'
        : 'items-start pt-3 sm:pt-12 px-2 sm:px-4 pb-4'
    ]"
    @click.self="handleClose"
  >
    <div
      :class="[
        'w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col overflow-hidden transition-all duration-300 animate-in zoom-in-95',
        isExpanded
          ? 'w-[96vw] max-w-5xl xl:max-w-6xl h-[92vh] max-h-[96vh]'
          : 'max-w-2xl max-h-[88vh]'
      ]"
    >
      <!-- 头部：品牌标题 + 模式选择药丸 + 操作图标 -->
      <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/60 select-none">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles class="w-3.5 h-3.5 animate-pulse" />
          </div>
          <span class="text-xs sm:text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100 font-mono">
            Akasha Copilot
          </span>

          <!-- 模式切换 Segmented Pill -->
          <div class="hidden sm:flex items-center p-0.5 bg-slate-200/60 dark:bg-slate-800 rounded-lg text-xs ml-2">
            <button
              v-for="m in modeOptions"
              :key="m.value"
              @click="activeMode = m.value"
              :class="[
                'px-2 py-1 rounded-md font-medium transition-all text-[11px] flex items-center gap-1',
                activeMode === m.value
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              ]"
            >
              <component :is="m.icon" class="w-3 h-3" />
              <span>{{ m.label }}</span>
            </button>
          </div>
        </div>

        <div class="flex items-center gap-1">
          <!-- 当前模型状态提示 / 点击切换或配置模型 (支持文字和识图双配置显示) -->
          <button
            @click="showConfigView = !showConfigView"
            class="text-[11px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            :title="currentModelTooltip"
          >
            <span :class="['w-1.5 h-1.5 rounded-full', isCurrentActiveModelConfigured ? 'bg-emerald-500' : 'bg-amber-500']"></span>
            <span class="max-w-[120px] truncate">{{ currentModelBadgeText }}</span>
          </button>

          <!-- 展开/收起全景工作台 -->
          <button
            @click="isExpanded = !isExpanded"
            class="hidden sm:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            :title="isExpanded ? '还原紧凑视图' : '最大化全景工作台（沉浸自适应）'"
          >
            <Minimize2 v-if="isExpanded" class="w-4 h-4" />
            <Maximize2 v-else class="w-4 h-4" />
          </button>

          <!-- 关闭 -->
          <button
            @click="handleClose"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- 移动端专用的模式切换药丸条 -->
      <div v-if="!showConfigView" class="sm:hidden px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/40 text-xs">
        <button
          v-for="m in modeOptions"
          :key="m.value"
          @click="activeMode = m.value"
          :class="[
            'px-2.5 py-1 rounded-md font-medium text-[11px] whitespace-nowrap shrink-0 flex items-center gap-1',
            activeMode === m.value
              ? 'bg-blue-600 text-white font-semibold shadow-2xs'
              : 'text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800/60'
          ]"
        >
          <component :is="m.icon" class="w-3 h-3" />
          <span>{{ m.label }}</span>
        </button>
      </div>

      <!-- 内嵌 AI 配置视图 (极简统一单口子设置) -->
      <div v-if="showConfigView" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 animate-in fade-in">
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <button
            @click="showConfigView = false"
            class="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4" />
            <span>返回计划生成</span>
          </button>
          <span class="text-xs font-bold text-slate-700 dark:text-slate-300">
            AI 模型与服务设置
          </span>
        </div>

        <div class="space-y-4 max-w-xl mx-auto py-1">
          <!-- 1. 文字模型 -->
          <div class="space-y-3">
            <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">
              文字模型
            </div>

            <!-- Base URL -->
            <div class="space-y-1">
              <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">API 接口地址 (Base URL)</label>
              <input
                v-model="aiConfig.baseUrl"
                type="text"
                placeholder="https://api.example.com/v1"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <!-- API Key -->
            <div class="space-y-1">
              <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">API 密钥 (API Key)</label>
              <input
                v-model="aiConfig.apiKey"
                type="password"
                placeholder="sk-..."
                class="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <!-- Model Name -->
            <div class="space-y-1">
              <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">模型名称 (Model)</label>
              <input
                v-model="aiConfig.model"
                type="text"
                placeholder="如 glm-4-flash / deepseek-chat"
                class="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <!-- Nginx Proxy Switch -->
            <div class="pt-1 flex items-center justify-between">
              <div>
                <div class="text-xs font-medium text-slate-800 dark:text-slate-200">使用服务器反向代理</div>
                <div class="text-[10px] text-slate-400">解决跨域拦截或 HTTPS 本地模型访问限制</div>
              </div>
              <button
                type="button"
                @click="aiConfig.useProxy = !aiConfig.useProxy"
                :class="[
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                  aiConfig.useProxy ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
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
          </div>

          <!-- 分割线 -->
          <div class="border-t border-slate-200/80 dark:border-slate-700/80"></div>

          <!-- 2. 独立识图模型配置 -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ t('settings.enableSeparateVision') }}</div>
                <div class="text-[10px] text-slate-400">{{ t('settings.enableSeparateVisionDesc') }}</div>
              </div>
              <button
                type="button"
                @click="aiConfig.visionSeparate = !aiConfig.visionSeparate"
                :class="[
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                  aiConfig.visionSeparate ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
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

            <!-- 开启后显示和文字模型一模一样的口子让用户填写 -->
            <div v-if="aiConfig.visionSeparate" class="space-y-3 pt-1 animate-in fade-in">
              <!-- Vision Base URL -->
              <div class="space-y-1">
                <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">识图 API 接口地址 (Base URL)</label>
                <input
                  v-model="aiConfig.visionBaseUrl"
                  type="text"
                  placeholder="https://api.example.com/v1"
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <!-- Vision API Key -->
              <div class="space-y-1">
                <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">识图 API 密钥 (API Key)</label>
                <input
                  v-model="aiConfig.visionApiKey"
                  type="password"
                  placeholder="sk-..."
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <!-- Vision Model Name -->
              <div class="space-y-1">
                <label class="text-[11px] font-medium text-slate-700 dark:text-slate-300">识图模型名称 (Model)</label>
                <input
                  v-model="aiConfig.visionModel"
                  type="text"
                  placeholder="如 glm-4v-flash / Qwen/Qwen2.5-VL-72B-Instruct"
                  class="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <!-- Vision Proxy Switch -->
              <div class="pt-1 flex items-center justify-between">
                <div>
                  <div class="text-xs font-medium text-slate-800 dark:text-slate-200">识图接口使用反向代理</div>
                  <div class="text-[10px] text-slate-400">解决跨域拦截或 HTTPS 本地模型访问限制</div>
                </div>
                <button
                  type="button"
                  @click="aiConfig.visionUseProxy = !aiConfig.visionUseProxy"
                  :class="[
                    'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                    aiConfig.visionUseProxy ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
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
            </div>
          </div>

          <!-- Action buttons: Save & Ping Test -->
          <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
            <button
              type="button"
              @click="handleSaveAndReturn"
              class="py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer text-center"
            >
              保存并返回
            </button>
            <button
              type="button"
              @click="handleTestConnection"
              :disabled="isTestingAi"
              class="py-2 px-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 active:scale-98 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all cursor-pointer text-center"
            >
              {{ isTestingAi ? '正在测试...' : '⚡ 测试连接' }}
            </button>
          </div>

          <!-- Test feedback -->
          <div
            v-if="aiTestResult"
            :class="[
              'p-2.5 rounded-lg border text-[11px] leading-relaxed',
              aiTestResult.success
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300'
            ]"
          >
            {{ aiTestResult.message }}
          </div>
        </div>
      </div>

      <!-- 主体输入与对话/草稿区 -->
      <div v-else ref="mainScrollRef" @scroll="handleMainScroll" :class="['flex-1 overflow-y-auto space-y-4', isExpanded ? 'p-5 sm:p-6 space-y-5' : 'p-4']">
        <!-- 未配置 API Key 的提示横幅 -->
        <div
          v-if="!isCurrentActiveModelConfigured"
          class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300"
        >
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-4 h-4 shrink-0 text-amber-500" />
            <span>尚未配置大模型 API Key。</span>
          </div>
          <button
            @click="showConfigView = true"
            class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shrink-0 transition-colors cursor-pointer"
          >
            就地配置
          </button>
        </div>

        <!-- 自然语言 / 多模态图片输入框 (Amie / Raycast 风格) -->
        <div
          :class="[
            'relative rounded-xl border bg-slate-50/50 dark:bg-slate-800/50 transition-all shadow-2xs',
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
              : 'border-slate-200 dark:border-slate-700/80 focus-within:border-blue-500 dark:focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
          ]"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <!-- 隐藏的文件上传 input -->
          <input
            ref="imageInputRef"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp,image/jpg"
            class="hidden"
            @change="handleImageFileSelect"
          />

          <!-- 已选图片预览胶囊条 -->
          <div
            v-if="selectedImageBase64"
            class="m-2.5 p-2 rounded-lg bg-indigo-50/90 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/70 flex items-center justify-between gap-3 animate-in fade-in select-none"
          >
            <div class="flex items-center gap-2.5 overflow-hidden">
              <img
                :src="selectedImageBase64"
                class="w-10 h-10 object-cover rounded-md border border-indigo-200 dark:border-indigo-700 shrink-0"
                alt="Image Preview"
              />
              <div class="text-xs truncate">
                <div class="font-medium text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                  <span>📷 {{ selectedImageName || '已选图片' }}</span>
                  <span v-if="selectedImageSize" class="text-[10px] text-slate-400">({{ selectedImageSize }})</span>
                </div>
                <p class="text-[11px] text-indigo-600 dark:text-indigo-400">将调用多模态视觉模型深度提取排程与计划</p>
              </div>
            </div>
            <button
              type="button"
              @click="clearImage"
              class="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              title="移除图片"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <textarea
            ref="inputRef"
            v-model="inputPrompt"
            :rows="isExpanded ? (currentPlan ? 4 : 8) : 3"
            :placeholder="selectedImageBase64 ? '可选输入对图片的补充要求（如「提取为周排程」、「只识别下周日程」），或直接点击【开始视觉解析】...' : '告诉 Copilot 你的计划，例如：「明天下午3点跟团队开上线会，周五前完成PPT，每天早晨阅读20分钟」...（支持直接粘贴截图）'"
            :class="[
              'w-full p-3 sm:p-4 bg-transparent text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden leading-relaxed transition-all',
              isExpanded
                ? (currentPlan ? 'text-xs sm:text-sm min-h-[110px] max-h-[35vh] resize-y' : 'text-sm sm:text-base min-h-[190px] sm:min-h-[240px] max-h-[50vh] resize-y')
                : 'text-xs sm:text-sm resize-none'
            ]"
            @keydown="handleKeyDown"
            @paste="handlePaste"
          ></textarea>

          <div class="px-3 pb-2.5 flex items-center justify-between text-xs text-slate-400">
            <div class="flex items-center gap-2 sm:gap-3 text-[11px]">
              <span class="hidden sm:inline">Enter 发送 · Shift+Enter 换行</span>
              <button
                type="button"
                @click="triggerImageSelect"
                class="flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors cursor-pointer"
                title="上传或粘贴日程/作息/课表等图片，由多模态 AI 视觉智能解析排期"
              >
                <Camera class="w-3.5 h-3.5 text-indigo-500" />
                <span>{{ selectedImageBase64 ? '更换图片' : 'AI 识图排期' }}</span>
              </button>
            </div>

            <button
              @click="handleStartGenerate"
              :disabled="isLoading || (!selectedImageBase64 && !inputPrompt.trim())"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 text-white font-medium text-xs shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw v-if="isLoading" class="w-3.5 h-3.5 animate-spin" />
              <Send v-else class="w-3.5 h-3.5" />
              <span>{{ selectedImageBase64 ? (isLoading ? '正在视觉识图...' : '开始视觉解析') : (isLoading ? '正在深度排程...' : '生成规划') }}</span>
            </button>
          </div>
        </div>

        <!-- 常用推荐 Prompt 胶囊 -->
        <div v-if="!currentPlan && !isLoading" class="space-y-1.5">
          <div class="text-[11px] font-medium text-slate-400">试试这些场景启发：</div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="chip in promptChips"
              :key="chip"
              @click="applyChip(chip)"
              class="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-750 dark:hover:text-blue-400 text-slate-600 dark:text-slate-300 text-[11px] transition-colors cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-900/40"
            >
              {{ chip }}
            </button>
          </div>
        </div>

        <!-- 流式打字生成进度与思考推理 -->
        <div
          v-if="isLoading || streamingText"
          class="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2 animate-in fade-in"
        >
          <div class="flex items-center justify-between text-xs font-semibold text-blue-700 dark:text-blue-300">
            <div class="flex items-center gap-2">
              <Sparkles class="w-3.5 h-3.5 text-blue-500 animate-spin" />
              <span>AI 排程思考与构思中...</span>
            </div>
            <!-- 当用户向上翻动脱耦时，显示快速回到底部的提示按钮 -->
            <button
              v-if="!isThinkingAutoScrollCoupled"
              type="button"
              @click="resumeAutoScroll"
              class="text-[10px] font-normal text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-800/60 px-2 py-0.5 rounded-md cursor-pointer transition-colors flex items-center gap-1"
            >
              <span>↓ 回到底部</span>
            </button>
          </div>
          <div
            ref="thinkingBoxRef"
            @scroll="handleThinkingScroll"
            :class="[
              'text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed overflow-y-auto',
              isExpanded ? 'max-h-72 sm:max-h-88' : 'max-h-48'
            ]"
          >
            {{ streamingText || '正在解析时间线与碰撞检测...' }}
          </div>
        </div>

        <!-- 拟定方案卡片流 (Proposal Diff Review) -->
        <div v-if="currentPlan" class="space-y-4 pt-1 animate-in fade-in duration-200">
          <!-- 排程理由解读横幅 -->
          <div
            v-if="currentPlan.reasoning"
            class="p-3 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/20 border border-blue-100/90 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-200 space-y-1"
          >
            <div class="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 text-[11px]">
              <Sparkles class="w-3.5 h-3.5" />
              <span>排程决策说明</span>
            </div>
            <p class="leading-relaxed">{{ currentPlan.reasoning }}</p>
          </div>

          <!-- 日历预览轻量提示（非按钮，仅作提示） -->
          <div
            v-if="currentPlan.schedules.length > 0"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400"
          >
            <Calendar class="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span class="leading-tight">
              已在日历中同步显示 <strong>{{ currentPlan.schedules.length }}</strong> 项日程预览（确认后正式生效）
            </span>
          </div>

          <!-- 分组卡片列表 -->
          <!-- 1. 日程列表 (Schedules) -->
          <div v-if="currentPlan.schedules.length > 0" class="space-y-2">
            <div class="flex items-center justify-between text-xs font-semibold text-slate-500 tracking-wider">
              <span class="flex items-center gap-1.5">
                <Calendar class="w-3.5 h-3.5 text-blue-500" />
                <span>拟定日程 ({{ currentPlan.schedules.length }})</span>
              </span>
              <button
                @click="toggleGroupSelection('schedules')"
                class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                全选/反选
              </button>
            </div>

            <div :class="isExpanded ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5' : 'space-y-2'">
              <div
                v-for="s in currentPlan.schedules"
                :key="s.id"
                :class="[
                  'p-3 rounded-xl border transition-all text-xs space-y-1.5',
                  s.selected
                    ? s.isConflict
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/70'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs'
                    : 'bg-slate-50/60 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                ]"
              >
                <div class="flex items-center justify-between gap-2">
                  <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      v-model="s.selected"
                      @change="handleDraftSelectionChanged"
                      class="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span class="font-semibold text-slate-800 dark:text-slate-100 truncate">{{ s.title }}</span>
                  </label>

                  <!-- 关联项目标识 -->
                  <span
                    v-if="s.suggestedProjectTitle"
                    class="text-[10px] px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shrink-0"
                  >
                    {{ s.suggestedProjectTitle }}
                  </span>
                </div>

                <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pl-5">
                  <span class="flex items-center gap-1 font-mono">
                    <Clock class="w-3 h-3 text-slate-400" />
                    <span>{{ s.date }}</span>
                    <span v-if="s.time">{{ s.time }} ~ {{ s.endTime || '' }}</span>
                  </span>

                  <!-- 冲突警告标签 -->
                  <span
                    v-if="s.isConflict"
                    class="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-900/50 px-2 py-0.5 rounded-md font-medium"
                  >
                    <AlertTriangle class="w-3 h-3 text-amber-500" />
                    <span>{{ s.conflictReason || '存在时间冲突' }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 2. 待办列表 (Todos) -->
          <div v-if="currentPlan.todos.length > 0" class="space-y-2">
            <div class="flex items-center justify-between text-xs font-semibold text-slate-500 tracking-wider">
              <span class="flex items-center gap-1.5">
                <CheckSquare class="w-3.5 h-3.5 text-emerald-500" />
                <span>拟定待办事项 ({{ currentPlan.todos.length }})</span>
              </span>
              <button
                @click="toggleGroupSelection('todos')"
                class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                全选/反选
              </button>
            </div>

            <div :class="isExpanded ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5' : 'space-y-2'">
              <div
                v-for="t in currentPlan.todos"
                :key="t.id"
                :class="[
                  'p-3 rounded-xl border transition-all text-xs space-y-1.5',
                  t.selected
                    ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs'
                    : 'bg-slate-50/60 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                ]"
              >
                <div class="flex items-center justify-between gap-2">
                  <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      v-model="t.selected"
                      class="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <!-- 优先级圆点 -->
                    <span
                      :class="[
                        'w-2 h-2 rounded-full shrink-0',
                        t.importance === 4 ? 'bg-rose-500 ring-2 ring-rose-300 dark:ring-rose-900' :
                        t.importance === 3 ? 'bg-amber-500' :
                        t.importance === 2 ? 'bg-blue-500' : 'bg-slate-400'
                      ]"
                    ></span>
                    <span class="font-semibold text-slate-800 dark:text-slate-100 truncate">{{ t.title }}</span>
                  </label>

                  <span
                    v-if="t.dueDate"
                    class="text-[10px] text-slate-400 font-mono"
                  >
                    截止: {{ t.dueDate }} {{ t.dueTime || '' }}
                  </span>
                </div>

                <!-- 备注或子任务 -->
                <div v-if="t.notes || (t.subtasks && t.subtasks.length > 0)" class="pl-6 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <p v-if="t.notes">{{ t.notes }}</p>
                  <ul v-if="t.subtasks && t.subtasks.length > 0" class="list-disc list-inside space-y-0.5 text-[10px]">
                    <li v-for="(sub, sIdx) in t.subtasks" :key="sIdx">{{ sub }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. 习惯打卡 (Habits) -->
          <div v-if="currentPlan.habits.length > 0" class="space-y-2">
            <div class="flex items-center justify-between text-xs font-semibold text-slate-500 tracking-wider">
              <span class="flex items-center gap-1.5">
                <Flame class="w-3.5 h-3.5 text-amber-500" />
                <span>拟定日常习惯 ({{ currentPlan.habits.length }})</span>
              </span>
              <button
                @click="toggleGroupSelection('habits')"
                class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                全选/反选
              </button>
            </div>

            <div :class="isExpanded ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5' : 'space-y-2'">
              <div
                v-for="h in currentPlan.habits"
                :key="h.id"
                :class="[
                  'p-3 rounded-xl border transition-all text-xs flex items-center justify-between gap-2',
                  h.selected
                    ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 shadow-2xs'
                    : 'bg-slate-50/60 dark:bg-slate-850/40 border-slate-200/60 dark:border-slate-800 opacity-60'
                ]"
              >
                <label class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    v-model="h.selected"
                    class="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span class="font-semibold text-slate-800 dark:text-slate-100 truncate">{{ h.title }}</span>
                </label>

                <div class="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                  <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {{ h.frequency === 'daily' ? '每日' : '每周' }}
                  </span>
                  <span v-if="h.time" class="font-mono text-blue-600 dark:text-blue-400 font-medium">
                    {{ h.time }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-3 text-xs">
        <div class="text-slate-500 dark:text-slate-400 text-[11px]">
          <span v-if="currentPlan">
            已选中 <strong>{{ totalSelectedCount }}</strong> / {{ totalItemsCount }} 项
          </span>
          <span v-else>
            支持自然语言输入任意计划日程
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            v-if="currentPlan"
            @click="handleDiscardPlan"
            class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium transition-colors cursor-pointer"
          >
            丢弃重新生成
          </button>

          <button
            v-if="currentPlan"
            @click="handleApplyPlan"
            :disabled="totalSelectedCount === 0"
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-40 text-white font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Check class="w-3.5 h-3.5" />
            <span>确认应用 (Enter)</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  Sparkles,
  Calendar,
  CheckSquare,
  Flame,
  Maximize2,
  Minimize2,
  Send,
  X,
  Clock,
  AlertTriangle,
  Check,
  RefreshCw,
  ArrowLeft,
  Camera,
  MessageSquare,
  Info,
} from 'lucide-vue-next'
import type { Area, Project, ScheduleItem, Habit } from '@/types'
import type { CopilotMode, CopilotPlanResult, AiProviderConfig, AiProviderType } from '@/types/copilot'
import { t } from '@/utils/i18n'
import {
  loadAiConfig,
  saveAiConfig,
  testAiConnection,
  buildSystemPrompt,
  streamPlanGeneration,
  recognizeScheduleFromImage,
  getTextConfig,
  getVisionConfig,
} from '@/services/aiService'
import { annotateConflicts } from '@/services/conflictDetector'

const props = defineProps<{
  isOpen: boolean
  areas: Area[]
  projects: Project[]
  schedules: ScheduleItem[]
  habits: Habit[]
  activeHours?: { start: string; end: string }
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-settings'): void
  (e: 'update-ghosts', drafts: any[]): void
  (e: 'apply-plan', plan: CopilotPlanResult): void
}>()

const inputRef = ref<HTMLTextAreaElement | null>(null)
const inputPrompt = ref('')
const activeMode = ref<CopilotMode>('smart')
const isExpanded = ref(localStorage.getItem('akasha_copilot_expanded') === 'true')
watch(isExpanded, (val) => {
  try {
    localStorage.setItem('akasha_copilot_expanded', String(val))
  } catch {}
})
const isLoading = ref(false)
const streamingText = ref('')
const currentPlan = ref<CopilotPlanResult | null>(null)
const aiConfig = ref<AiProviderConfig>(loadAiConfig())

const imageInputRef = ref<HTMLInputElement | null>(null)
const selectedImageBase64 = ref<string | null>(null)
const selectedImageName = ref('')
const selectedImageSize = ref('')
const isDragging = ref(false)

function triggerImageSelect() {
  imageInputRef.value?.click()
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function processImageFile(file: File) {
  if (!file.type.startsWith('image/')) return
  selectedImageName.value = file.name
  selectedImageSize.value = formatBytes(file.size)

  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImageBase64.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

function handleImageFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    processImageFile(file)
  }
  target.value = ''
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processImageFile(file)
  }
}

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      const file = items[i].getAsFile()
      if (file) {
        e.preventDefault()
        processImageFile(file)
        return
      }
    }
  }
}

function clearImage() {
  selectedImageBase64.value = null
  selectedImageName.value = ''
  selectedImageSize.value = ''
}

const showConfigView = ref(false)
const isTestingAi = ref(false)
const aiTestResult = ref<{ success: boolean; message: string } | null>(null)

const effectiveVisionConfig = computed(() => getVisionConfig(aiConfig.value))
const effectiveTextConfig = computed(() => getTextConfig(aiConfig.value))

const currentModelBadgeText = computed(() => {
  const tCfg = effectiveTextConfig.value
  return tCfg.apiKey || tCfg.provider === 'ollama' ? tCfg.model : '配置 AI'
})

const isCurrentActiveModelConfigured = computed(() => {
  const tCfg = effectiveTextConfig.value
  return !!(tCfg.apiKey || tCfg.provider === 'ollama')
})

const currentModelTooltip = computed(() => {
  const tCfg = effectiveTextConfig.value
  const vCfg = effectiveVisionConfig.value
  if (aiConfig.value.visionSeparate) {
    return `文字: ${tCfg.model || '未配置'} | 识图: ${vCfg.model || '未配置'}`
  }
  return `模型: ${tCfg.model || '未配置'}`
})

const mainScrollRef = ref<HTMLElement | null>(null)
const thinkingBoxRef = ref<HTMLElement | null>(null)

// 自动滚动耦合状态：默认接偶（跟随最新流式内容）。向上翻动时脱耦，拉回底部时再次接偶
const isThinkingAutoScrollCoupled = ref(true)
const isMainAutoScrollCoupled = ref(true)

function handleThinkingScroll() {
  if (!thinkingBoxRef.value) return
  const el = thinkingBoxRef.value
  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  // 离底部 <= 24px 判定为处于最下方（重新接偶），否则向上翻动判定为脱耦
  isThinkingAutoScrollCoupled.value = distanceToBottom <= 24
}

function handleMainScroll() {
  if (!mainScrollRef.value) return
  const el = mainScrollRef.value
  const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  // 离底部 <= 36px 判定为处于最下方（重新接偶）
  isMainAutoScrollCoupled.value = distanceToBottom <= 36
}

function resumeAutoScroll() {
  isThinkingAutoScrollCoupled.value = true
  isMainAutoScrollCoupled.value = true
  if (thinkingBoxRef.value) {
    thinkingBoxRef.value.scrollTop = thinkingBoxRef.value.scrollHeight
  }
  if (mainScrollRef.value) {
    mainScrollRef.value.scrollTop = mainScrollRef.value.scrollHeight
  }
}

// 监听 AI 流式思考文本，若接偶则自动跟随滚动到最下方
watch(streamingText, async () => {
  await nextTick()
  if (isThinkingAutoScrollCoupled.value && thinkingBoxRef.value) {
    thinkingBoxRef.value.scrollTop = thinkingBoxRef.value.scrollHeight
  }
  if (isMainAutoScrollCoupled.value && mainScrollRef.value) {
    mainScrollRef.value.scrollTop = mainScrollRef.value.scrollHeight
  }
})

function handleSaveAndReturn() {
  saveAiConfig(aiConfig.value)
  showConfigView.value = false
  aiTestResult.value = null
}

async function handleTestConnection() {
  isTestingAi.value = true
  aiTestResult.value = null
  try {
    const textCfg = getTextConfig(aiConfig.value)
    if (!textCfg.baseUrl || !textCfg.model) {
      aiTestResult.value = {
        success: false,
        message: '请先填写文字模型的接口地址 (Base URL) 与模型名称 (Model)'
      }
      return
    }
    const textRes = await testAiConnection(textCfg)
    if (!textRes.success) {
      aiTestResult.value = {
        success: false,
        message: `文字模型连接失败: ${textRes.message}`
      }
      return
    }

    if (aiConfig.value.visionSeparate) {
      const visionCfg = getVisionConfig(aiConfig.value)
      if (!visionCfg.baseUrl || !visionCfg.model) {
        aiTestResult.value = {
          success: false,
          message: '文字模型连接正常，但识图模型的接口地址或模型名称未填写完整'
        }
        return
      }
      const visionRes = await testAiConnection(visionCfg)
      if (!visionRes.success) {
        aiTestResult.value = {
          success: false,
          message: `文字模型正常，但识图模型连接失败: ${visionRes.message}`
        }
        return
      }
      aiTestResult.value = {
        success: true,
        message: `文字模型与识图模型连接均正常 (延时: ${textRes.latencyMs}ms / ${visionRes.latencyMs}ms)`
      }
    } else {
      aiTestResult.value = {
        success: true,
        message: `文字模型连接正常 (延时: ${textRes.latencyMs}ms)`
      }
    }
  } catch (err: any) {
    aiTestResult.value = {
      success: false,
      message: err.message || '网络连接异常'
    }
  } finally {
    isTestingAi.value = false
  }
}

const modeOptions = computed<{ label: string; value: CopilotMode; icon: any }[]>(() => [
  { label: '智能', value: 'smart', icon: Sparkles },
  { label: t('nav.schedules'), value: 'schedule', icon: Calendar },
  { label: t('nav.todos'), value: 'todo', icon: CheckSquare },
  { label: t('nav.habits'), value: 'habit', icon: Flame },
])

const promptChips = [
  '📷 识图排程：上传作息/日程截图',
  '🚀 帮我规划明天全天的高效日程',
  '📊 拆解下周二复盘汇报任务及准备事项',
  '🏃 制定每周一三五晨间慢跑打卡习惯',
  '💡 学习Vue3与Rust系统架构路线',
]

function applyChip(chipText: string) {
  if (chipText.includes('识图排程')) {
    triggerImageSelect()
    return
  }
  inputPrompt.value = chipText.replace(/^[^\s]+\s*/, '')
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      aiConfig.value = loadAiConfig()
      setTimeout(() => {
        inputRef.value?.focus()
      }, 50)
    } else {
      showConfigView.value = false
      aiTestResult.value = null
      clearImage()
      // 关闭时清理幽灵草稿
      emit('update-ghosts', [])
    }
  }
)

const totalItemsCount = computed(() => {
  if (!currentPlan.value) return 0
  return (
    currentPlan.value.schedules.length +
    currentPlan.value.todos.length +
    currentPlan.value.habits.length
  )
})

const totalSelectedCount = computed(() => {
  if (!currentPlan.value) return 0
  const sCount = currentPlan.value.schedules.filter((s) => s.selected).length
  const tCount = currentPlan.value.todos.filter((t) => t.selected).length
  const hCount = currentPlan.value.habits.filter((h) => h.selected).length
  return sCount + tCount + hCount
})

function handleDraftSelectionChanged() {
  if (!currentPlan.value) return
  // 将已选中的日程草稿向外广播，以更新日历上的幽灵虚影
  const activeGhostSchedules = currentPlan.value.schedules.filter((s) => s.selected)
  emit('update-ghosts', activeGhostSchedules)
}

function toggleGroupSelection(group: 'schedules' | 'todos' | 'habits') {
  if (!currentPlan.value) return
  const items = currentPlan.value[group]
  const hasUnselected = items.some((i) => !i.selected)
  items.forEach((i) => {
    i.selected = hasUnselected
  })
  if (group === 'schedules') {
    handleDraftSelectionChanged()
  }
}

async function handleStartGenerate() {
  if (isLoading.value) return
  if (!selectedImageBase64.value && !inputPrompt.value.trim()) return

  // 检验 API 接口密钥
  if (selectedImageBase64.value) {
    const vCfg = effectiveVisionConfig.value
    if (!vCfg.apiKey && vCfg.provider !== 'ollama') {
      showConfigView.value = true
      return
    }
  } else {
    const tCfg = effectiveTextConfig.value
    if (!tCfg.apiKey && tCfg.provider !== 'ollama') {
      showConfigView.value = true
      return
    }
  }

  isLoading.value = true
  streamingText.value = ''
  currentPlan.value = null
  isThinkingAutoScrollCoupled.value = true
  isMainAutoScrollCoupled.value = true
  emit('update-ghosts', [])

  try {
    let result: CopilotPlanResult
    if (selectedImageBase64.value) {
      streamingText.value = '📷 正在调用多模态视觉模型深度解析图片中的日程与安排...'
      result = await recognizeScheduleFromImage(
        selectedImageBase64.value,
        inputPrompt.value.trim() || undefined,
        aiConfig.value
      )
      // 识别完成后清理图片缓存
      clearImage()
    } else {
      const sysPrompt = buildSystemPrompt({
        mode: activeMode.value,
        areas: props.areas,
        projects: props.projects,
        schedules: props.schedules,
        habits: props.habits,
        activeHours: props.activeHours,
      })

      result = await streamPlanGeneration(
        inputPrompt.value.trim(),
        sysPrompt,
        getTextConfig(aiConfig.value),
        (textChunk) => {
          streamingText.value = textChunk
        }
      )
    }

    // 对日程草稿进行本地高精度碰撞检测
    result.schedules = annotateConflicts(result.schedules, props.schedules)
    currentPlan.value = result

    await nextTick()
    if (isMainAutoScrollCoupled.value && mainScrollRef.value) {
      mainScrollRef.value.scrollTop = mainScrollRef.value.scrollHeight
    }

    handleDraftSelectionChanged()
  } catch (err: any) {
    streamingText.value = `❌ 解析排程失败: ${err?.message || '未知错误'}`
  } finally {
    isLoading.value = false
  }
}

function handleDiscardPlan() {
  currentPlan.value = null
  emit('update-ghosts', [])
}

function handleApplyPlan() {
  if (!currentPlan.value) return
  emit('apply-plan', currentPlan.value)
  handleDiscardPlan()
  emit('close')
}

function handleClose() {
  handleDiscardPlan()
  emit('close')
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    if (currentPlan.value) {
      handleApplyPlan()
    } else {
      handleStartGenerate()
    }
  } else if (e.key === 'Escape') {
    handleClose()
  }
}

function handleGlobalKey(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
    e.preventDefault()
    if (props.isOpen) {
      handleClose()
    } else {
      // 外层 App.vue 会监听并切换 isOpen
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKey)
})
</script>

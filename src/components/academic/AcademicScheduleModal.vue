<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-start justify-center pt-2 sm:pt-10 px-2 sm:px-4 bg-black/60 backdrop-blur-md transition-all duration-200"
    @click.self="handleClose"
  >
    <div
      class="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden transition-all duration-300 animate-in zoom-in-95"
    >
      <!-- 头部 -->
      <div class="px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/60 select-none">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
            <GraduationCap class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm sm:text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
              高校课表导入 (AI 识图 / WakeUp 模式)
            </h3>
            <p class="text-[11px] text-slate-400">
              支持 AI 多模态识图提取、自主登录抓取、WakeUp CSV 与 iCalendar (.ics) 日历互通
            </p>
          </div>
        </div>

        <button
          @click="handleClose"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- 标签栏导航 (5 种导入途径) -->
      <div class="px-4 sm:px-6 pt-2.5 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto bg-slate-50/40 dark:bg-slate-950/40 text-xs select-none">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          @click="activeTab = t.id"
          :class="[
            'px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
            activeTab === t.id
              ? 'bg-blue-600 text-white shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
          ]"
        >
          <component :is="t.icon" class="w-3.5 h-3.5" />
          <span>{{ t.label }}</span>
        </button>
      </div>

      <!-- 主内容区域 (滚动) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
        <!-- 途径 0: AI 多模态视觉识图 (图片识别排课) -->
        <div v-if="activeTab === 'vision'" class="space-y-4">
          <!-- AI 状态卡片 -->
          <div class="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles class="w-4 h-4" />
              </div>
              <div>
                <div class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>AI 多模态课程表识别引擎</span>
                  <span
                    v-if="aiConfig.apiKey"
                    class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300"
                  >
                    已就绪 · {{ aiConfig.model }}
                  </span>
                  <span
                    v-else
                    class="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300"
                  >
                    未配置 API Key
                  </span>
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  支持教务系统网页截图、教务App课表、纸质作息表拍照等；建议使用多模态视觉模型 (如 gpt-4o-mini 或 Qwen2.5-VL)。
                </p>
              </div>
            </div>

            <button
              v-if="!aiConfig.apiKey"
              type="button"
              @click="$emit('open-settings')"
              class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium shrink-0 transition-colors cursor-pointer self-start sm:self-center"
            >
              前往配置 AI
            </button>
          </div>

          <!-- 图片拖拽上传 / 粘贴预览区 -->
          <div
            v-if="!selectedImageBase64"
            @dragover.prevent="isDraggingImage = true"
            @dragleave.prevent="isDraggingImage = false"
            @drop.prevent="handleImageDrop"
            @click="triggerImageInput"
            :class="[
              'p-8 sm:p-10 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5',
              isDraggingImage
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-900/60'
            ]"
          >
            <input
              ref="imageInputRef"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/bmp,image/jpg"
              class="hidden"
              @change="handleImageFileSelect"
            />
            <div class="w-13 h-13 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Camera class="w-6 h-6" />
            </div>
            <div class="space-y-1">
              <p class="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                点击选择或将课表图片拖拽至此
              </p>
              <p class="text-[11px] text-slate-400">
                支持直接按 <kbd class="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-200 dark:border-slate-700">Ctrl + V</kbd> 粘贴剪贴板截图 · 支持 PNG / JPG / WebP
              </p>
            </div>
          </div>

          <!-- 已选中图片预览卡片 -->
          <div
            v-else
            class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 space-y-3"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Image class="w-4 h-4 text-indigo-500" />
                <span>已载入待识别课表图片</span>
                <span class="text-[11px] font-normal text-slate-400">({{ selectedImageName }} · {{ selectedImageSize }})</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="triggerImageInput"
                  class="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  更换图片
                </button>
                <button
                  type="button"
                  @click="clearSelectedImage"
                  class="text-xs text-rose-500 hover:underline cursor-pointer"
                >
                  移除
                </button>
              </div>
            </div>

            <!-- 图片缩略图 -->
            <div class="flex justify-center bg-slate-100 dark:bg-slate-950 rounded-lg p-2 overflow-hidden border border-slate-200/60 dark:border-slate-800">
              <img
                :src="selectedImageBase64"
                alt="课表截图预览"
                class="max-h-60 sm:max-h-72 object-contain rounded-md shadow-xs"
              />
            </div>
          </div>

          <!-- 选填补充说明 -->
          <div class="space-y-1">
            <label class="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>识别补充说明 (选填)</span>
              <span class="text-[11px] text-slate-400 font-normal">可指定学期起始日期、单双周或特殊备注</span>
            </label>
            <input
              v-model="visionUserInstruction"
              type="text"
              placeholder="例如：这是2026年秋季课表，第1周从9月1日开始，请提取全部1-16周课程..."
              class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <!-- 启动识别按钮与状态 -->
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div class="text-xs text-slate-400">
              <span v-if="isVisionRecognizing" class="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium">
                <Loader2 class="w-3.5 h-3.5 animate-spin" />
                <span>正在调用多模态大模型智能提取课程矩阵，通常耗时 3~8 秒...</span>
              </span>
            </div>

            <button
              type="button"
              @click="handleStartVisionRecognition"
              :disabled="!selectedImageBase64 || isVisionRecognizing"
              class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 disabled:opacity-40 text-white text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Loader2 v-if="isVisionRecognizing" class="w-4 h-4 animate-spin" />
              <Sparkles v-else class="w-4 h-4" />
              <span>{{ isVisionRecognizing ? '正在识别排课中...' : '启动 AI 识图识别课程表' }}</span>
            </button>
          </div>

          <!-- 错误提示 -->
          <div
            v-if="visionError"
            class="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-1.5 animate-in fade-in"
          >
            <div class="flex items-start gap-2">
              <AlertTriangle class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div class="space-y-1">
                <div class="font-bold">课程表图像识别未完成</div>
                <div class="whitespace-pre-line leading-relaxed text-[11px]">{{ visionError }}</div>
              </div>
            </div>
            <div v-if="visionError.includes('视觉') || visionError.includes('模型')" class="pt-1 flex justify-end">
              <button
                type="button"
                @click="$emit('open-settings')"
                class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-medium transition-colors cursor-pointer"
              >
                前往切换支持视觉的模型
              </button>
            </div>
          </div>

          <!-- 成功提示 -->
          <div
            v-if="visionSuccessMessage"
            class="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in"
          >
            <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{{ visionSuccessMessage }}</span>
          </div>
        </div>

        <!-- 途径 1: 教务系统抓取向导 (WakeUp 经典自主登录抓取) -->
        <div v-else-if="activeTab === 'crawler'" class="space-y-4">
          <div class="p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
            <div class="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
              <Sparkles class="w-4 h-4" />
              <span>WakeUp 极客模式：用户端自主登录并一键提取</span>
            </div>
            <p class="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              无需向任何第三方透露学号密码。请按以下简短 3 步，即可轻松规避验证码与校园内网拦截：
            </p>

            <div class="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pt-1">
              <div class="flex items-start gap-2">
                <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <div>
                  <span class="font-semibold">获取抓取胶囊：</span>
                  <span>可将下方按钮拖入浏览器书签栏，或点击一键复制提取代码。</span>
                  <div class="flex items-center gap-2 mt-2">
                    <a
                      :href="bookmarkletHref"
                      onclick="return false;"
                      class="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold inline-flex items-center gap-1 shadow-2xs cursor-grab"
                      title="拖动此链接到浏览器书签栏即可使用"
                    >
                      <Bookmark class="w-3 h-3" />
                      <span>抓取到 Akasha (拖入书签栏)</span>
                    </a>
                    <button
                      type="button"
                      @click="copyBookmarkletScript"
                      class="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      {{ hasCopiedScript ? '已复制提取脚本 ✓' : '复制提取脚本' }}
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex items-start gap-2">
                <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <div>
                  <span class="font-semibold">登录教务系统：</span>
                  <span>在浏览器打开你学校的教务系统（正方、强智、新URP等），输入账号密码过验证码，进入<b>【我的课表/学期课表】</b>页面。</span>
                </div>
              </div>

              <div class="flex items-start gap-2">
                <span class="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <div>
                  <span class="font-semibold">点击抓取并粘贴：</span>
                  <span>在课表页点击书签栏中的胶囊（或按 F12 打开控制台回车执行刚才复制的脚本），数据将自动复制到剪贴板。</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 一键粘贴与快速输入区 -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-slate-700 dark:text-slate-300">
                课表文本 / 网页源码 / API JSON 粘贴区
              </label>
              <button
                type="button"
                @click="pasteFromClipboard"
                class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ClipboardPaste class="w-3.5 h-3.5" />
                <span>从剪贴板读取并解析</span>
              </button>
            </div>
            <textarea
              v-model="rawContentInput"
              rows="4"
              placeholder="在此粘贴教务系统课表网页复制的内容、表格源码、或网络接口 JSON 数据..."
              class="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
            ></textarea>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                @click="handleParseRawContent"
                :disabled="!rawContentInput.trim()"
                class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles class="w-3.5 h-3.5" />
                <span>立即解析为课表</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 途径 2: WakeUp CSV 模板导入 -->
        <div v-else-if="activeTab === 'csv'" class="space-y-4">
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">WakeUp 官方标准 CSV 模板</span>
              </div>
              <button
                type="button"
                @click="downloadCsvTemplate"
                class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-medium flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              >
                <Download class="w-3.5 h-3.5" />
                <span>下载官方 CSV 模板</span>
              </button>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              支持在 Excel 或 WPS 中自由编辑：支持单双周写法（如 <code>1-15单</code>、<code>2-16双</code>）、不连续周（<code>1、3、5、7</code>），无上课教师或教室请填“无”。
            </p>
          </div>

          <!-- 上传 / 拖拽区域 -->
          <div
            @dragover.prevent="isDraggingCsv = true"
            @dragleave.prevent="isDraggingCsv = false"
            @drop.prevent="handleCsvDrop"
            :class="[
              'p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2',
              isDraggingCsv
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 bg-white dark:bg-slate-900'
            ]"
            @click="triggerCsvFileInput"
          >
            <input
              ref="csvFileInputRef"
              type="file"
              accept=".csv"
              class="hidden"
              @change="handleCsvFileSelect"
            />
            <div class="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet class="w-6 h-6" />
            </div>
            <div class="space-y-0.5">
              <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                点击选择或将填好的 CSV 文件拖拽到此处
              </p>
              <p class="text-[11px] text-slate-400">
                支持标准 WakeUp 格式、各大高校 2wakeup 导出 CSV
              </p>
            </div>
          </div>
        </div>

        <!-- 途径 3: iCal (.ics) 日历格式互通 -->
        <div v-else-if="activeTab === 'ics'" class="space-y-4">
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Calendar class="w-4 h-4 text-indigo-500" />
              <span>RFC 5545 通用日历导入 (.ics)</span>
            </div>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              支持直接导入各大课表 App（如 WakeUp、小爱、拾光）、高校教务日历或系统日历导出的 <code>.ics</code> 日历文件。
            </p>
          </div>

          <div
            @dragover.prevent="isDraggingIcs = true"
            @dragleave.prevent="isDraggingIcs = false"
            @drop.prevent="handleIcsDrop"
            :class="[
              'p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2',
              isDraggingIcs
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900'
            ]"
            @click="triggerIcsFileInput"
          >
            <input
              ref="icsFileInputRef"
              type="file"
              accept=".ics"
              class="hidden"
              @change="handleIcsFileSelect"
            />
            <div class="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Calendar class="w-6 h-6" />
            </div>
            <div class="space-y-0.5">
              <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">
                点击选择或将 .ics 文件拖拽到此处
              </p>
              <p class="text-[11px] text-slate-400">
                自动提取日程事件、教室地点与作息起止时间
              </p>
            </div>
          </div>
        </div>

        <!-- 途径 4: 常用样例快速体验 -->
        <div v-else-if="activeTab === 'sample'" class="space-y-3">
          <div class="text-xs text-slate-500">
            你可以点击下方按钮一键载入标准大学课程样例，快速体验 WakeUp 课表解析与周视图效果：
          </div>
          <button
            type="button"
            @click="loadSampleCourses"
            class="px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles class="w-4 h-4 text-blue-500" />
            <span>加载【大学计算机系标准学期课表】样例</span>
          </button>
        </div>

        <!-- 解析结果与可视化预览区 (当提取到课程时激活呈现) -->
        <div v-if="parsedCourses.length > 0" class="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 animate-in fade-in">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-100">
                已成功解析 {{ parsedCourses.length }} 门课程
              </span>
              <span class="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-medium">
                格式校验通过
              </span>
            </div>

            <!-- 导出工具按钮组 -->
            <div class="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                @click="exportToWakeUpCsvFile"
                class="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                title="导出为 WakeUp CSV 格式供备份或其他 App 使用"
              >
                导出 CSV
              </button>
              <button
                type="button"
                @click="exportToIcsFile"
                class="px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-[11px] font-medium transition-colors cursor-pointer"
                title="导出为系统日历通用的 .ics 文件"
              >
                导出 .ics 日历
              </button>
              <button
                type="button"
                @click="parsedCourses = []"
                class="px-2 py-1 rounded-md text-slate-400 hover:text-rose-600 text-[11px] transition-colors cursor-pointer"
              >
                清空
              </button>
            </div>
          </div>

          <!-- 仿 WakeUp 经典周课表网格预览 -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>周课表全局排期速览</span>
              <span class="text-[11px] text-slate-400">星期一至星期日 · 第 1-12 节</span>
            </div>

            <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950 shadow-2xs">
              <!-- 表头 星期一到星期日 -->
              <div class="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center py-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <div class="border-r border-slate-200 dark:border-slate-800">节次</div>
                <div>周一</div>
                <div>周二</div>
                <div>周三</div>
                <div>周四</div>
                <div>周五</div>
                <div class="text-blue-600 dark:text-blue-400">周六</div>
                <div class="text-blue-600 dark:text-blue-400">周日</div>
              </div>

              <!-- 大节次 1-2, 3-4, 5-6, 7-8, 9-10 -->
              <div class="divide-y divide-slate-100 dark:divide-slate-800/80 text-[11px]">
                <div
                  v-for="block in [1, 3, 5, 7, 9, 11]"
                  :key="block"
                  class="grid grid-cols-8 min-h-[52px]"
                >
                  <div class="border-r border-slate-100 dark:border-slate-800/80 p-1 flex flex-col items-center justify-center font-mono text-[10px] text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                    <span>{{ block }}-{{ block + 1 }}</span>
                  </div>

                  <div
                    v-for="d in 7"
                    :key="d"
                    class="p-1 border-r border-slate-50 dark:border-slate-900/50 flex flex-col gap-1 overflow-hidden"
                  >
                    <div
                      v-for="c in getCoursesForSlot(d, block)"
                      :key="c.id"
                      class="p-1 rounded-md text-[10px] leading-tight text-white font-medium shadow-2xs truncate"
                      :style="{ backgroundColor: c.color || '#3b82f6' }"
                      :title="`${c.name} (${c.teacher || '无教师'}) @${c.location || '无地点'} [${formatWeeks(c.weeks)}]`"
                    >
                      <div class="font-bold truncate">{{ c.name }}</div>
                      <div class="opacity-90 truncate text-[9px]">{{ c.location || c.teacher || '无地点' }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 学期、作息与本地转换配置表单 -->
          <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 space-y-4 text-xs">
            <h4 class="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <SlidersHorizontal class="w-4 h-4 text-blue-500" />
              <span>入库转换配置 (学期与时间规则)</span>
            </h4>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- 开学第1周周一日期 -->
              <div class="space-y-1">
                <label class="block font-medium text-slate-700 dark:text-slate-300">
                  开学第 1 周周一日期 <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="config.semesterStartDate"
                  type="date"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>

              <!-- 学期名称 -->
              <div class="space-y-1">
                <label class="block font-medium text-slate-700 dark:text-slate-300">学期名称</label>
                <input
                  v-model="config.semesterName"
                  type="text"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
                />
              </div>

              <!-- 学期总周数 -->
              <div class="space-y-1">
                <label class="block font-medium text-slate-700 dark:text-slate-300">学期总周数</label>
                <input
                  v-model.number="config.totalWeeks"
                  type="number"
                  min="1"
                  max="30"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <!-- 目标所属领域 -->
              <div class="space-y-1">
                <label class="block font-medium text-slate-700 dark:text-slate-300">导入归属领域</label>
                <select
                  v-model="targetAreaId"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 cursor-pointer"
                >
                  <option v-for="a in areas" :key="a.id" :value="a.id">{{ a.title }}</option>
                  <option value="__new__">+ 自动创建「学业」领域</option>
                </select>
              </div>

              <!-- 导入生成模式 -->
              <div class="space-y-1">
                <label class="block font-medium text-slate-700 dark:text-slate-300">生成排程模式</label>
                <select
                  v-model="config.importMode"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 cursor-pointer font-medium"
                >
                  <option value="dates">全学期具体日期单次日程 (推荐 · 精确到每一周每一天)</option>
                  <option value="weekly">周固定重复日程 (按星期循环)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
        <span class="text-xs text-slate-400">
          {{ parsedCourses.length > 0 ? `已就绪 ${parsedCourses.length} 门课程` : '等待导入课表数据' }}
        </span>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="handleClose"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            取消
          </button>

          <button
            type="button"
            @click="executeImportToAkasha"
            :disabled="parsedCourses.length === 0 || isImporting"
            class="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Check class="w-4 h-4 stroke-[3]" />
            <span>{{ isImporting ? '正在生成日程...' : '一键转换为 Akasha 本地日程' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  GraduationCap,
  X,
  Sparkles,
  Bookmark,
  FileSpreadsheet,
  Calendar,
  Download,
  ClipboardPaste,
  SlidersHorizontal,
  Check,
  Camera,
  Image,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-vue-next'
import type { Area } from '@/types'
import type { CourseItem, AcademicScheduleConfig } from '@/types/academic'
import { DEFAULT_SECTION_TIMES } from '@/types/academic'
import {
  parseWakeUpCsv,
  generateWakeUpCsvTemplate,
  exportCoursesToWakeUpCsv,
  parseEducationalContent,
  generateIcsCalendar,
  parseIcsCalendar,
  convertAcademicToAkasha,
  getBookmarkletCode,
  formatWeeksArray,
} from '@/utils/academicParser'
import { loadAiConfig, onAiConfigChange, recognizeScheduleFromImage } from '@/services/aiService'

const props = defineProps<{
  isOpen: boolean
  areas: Area[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-settings'): void
  (e: 'apply-academic-schedule', payload: {
    project: any
    schedules: any[]
    areaId?: string
    summary: string
  }): void
}>()

type TabType = 'vision' | 'crawler' | 'csv' | 'ics' | 'sample'

const tabs = [
  { id: 'vision' as TabType, label: '📷 AI 识图导入', icon: Camera },
  { id: 'crawler' as TabType, label: '教务系统抓取向导', icon: Sparkles },
  { id: 'csv' as TabType, label: 'WakeUp CSV 模板导入', icon: FileSpreadsheet },
  { id: 'ics' as TabType, label: '.ics 日历互通导入', icon: Calendar },
  { id: 'sample' as TabType, label: '样例体验', icon: GraduationCap },
]

const activeTab = ref<TabType>('vision')
const rawContentInput = ref('')
const hasCopiedScript = ref(false)
const isDraggingCsv = ref(false)
const isDraggingIcs = ref(false)
const isImporting = ref(false)
const csvFileInputRef = ref<HTMLInputElement | null>(null)
const icsFileInputRef = ref<HTMLInputElement | null>(null)

// AI 识图状态
const aiConfig = ref(loadAiConfig())
const selectedImageBase64 = ref('')
const selectedImageName = ref('')
const selectedImageSize = ref('')
const isDraggingImage = ref(false)
const isVisionRecognizing = ref(false)
const visionError = ref<string | null>(null)
const visionSuccessMessage = ref<string | null>(null)
const visionUserInstruction = ref('')
const imageInputRef = ref<HTMLInputElement | null>(null)

const parsedCourses = ref<CourseItem[]>([])
const targetAreaId = ref<string>(props.areas[0]?.id || '__new__')

// 默认学期起始周为今年 9 月或 2 月第一个周一
function getDefaultSemesterMonday(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  let targetMonth = month >= 8 || month <= 1 ? 9 : 2
  let targetYear = month === 1 ? year - 1 : year

  const d = new Date(targetYear, targetMonth - 1, 1)
  const day = d.getDay()
  const diff = day === 0 ? 1 : (day === 1 ? 0 : 8 - day)
  d.setDate(d.getDate() + diff)

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dt = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dt}`
}

const config = ref<AcademicScheduleConfig>({
  semesterName: `${new Date().getFullYear()}年秋季学期课表`,
  semesterStartDate: getDefaultSemesterMonday(),
  totalWeeks: 20,
  timeSlots: [...DEFAULT_SECTION_TIMES],
  courses: [],
  targetAreaTitle: '学业',
  targetProjectTitle: `${new Date().getFullYear()}学年课程表`,
  importMode: 'dates',
})

const bookmarkletHref = computed(() => getBookmarkletCode())

function formatWeeks(weeks: number[]): string {
  return formatWeeksArray(weeks)
}

function getCoursesForSlot(dayOfWeek: number, startSection: number): CourseItem[] {
  return parsedCourses.value.filter(
    (c) => c.dayOfWeek === dayOfWeek && c.startSection <= startSection + 1 && c.startSection + c.step > startSection
  )
}

function handleClose() {
  emit('close')
}

// 图片选择与拖拽处理
function triggerImageInput() {
  imageInputRef.value?.click()
}

function handleImageFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) processImageFile(file)
}

function handleImageDrop(e: DragEvent) {
  isDraggingImage.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processImageFile(file)
}

function processImageFile(file: File) {
  if (!file.type.startsWith('image/')) {
    alert('请选择有效的图片文件（PNG、JPG、JPEG、WebP等）。')
    return
  }
  selectedImageName.value = file.name || '剪贴板粘贴图片'
  selectedImageSize.value = (file.size / 1024).toFixed(1) + ' KB'

  const reader = new FileReader()
  reader.onload = (e) => {
    selectedImageBase64.value = e.target?.result as string
    visionError.value = null
    visionSuccessMessage.value = null
  }
  reader.readAsDataURL(file)
}

function clearSelectedImage() {
  selectedImageBase64.value = ''
  selectedImageName.value = ''
  selectedImageSize.value = ''
  visionError.value = null
  visionSuccessMessage.value = null
  if (imageInputRef.value) {
    imageInputRef.value.value = ''
  }
}

// 启动 AI 视觉识图识别
async function handleStartVisionRecognition() {
  if (!selectedImageBase64.value) return
  isVisionRecognizing.value = true
  visionError.value = null
  visionSuccessMessage.value = null

  try {
    const result = await recognizeScheduleFromImage(
      selectedImageBase64.value,
      visionUserInstruction.value.trim() || undefined
    )

    if (result.courses.length === 0) {
      throw new Error('未能从图片中解析到有效课程，请确保图片清晰且包含课表表格，或输入补充说明指定节次。')
    }

    parsedCourses.value = result.courses
    config.value.courses = result.courses

    if (result.semesterInfo?.semesterName) {
      config.value.semesterName = result.semesterInfo.semesterName
      config.value.targetProjectTitle = `${result.semesterInfo.semesterName}课程`
    }
    if (result.semesterInfo?.totalWeeks && result.semesterInfo.totalWeeks > 0) {
      config.value.totalWeeks = result.semesterInfo.totalWeeks
    }
    if (result.semesterInfo?.semesterStartDate) {
      config.value.semesterStartDate = result.semesterInfo.semesterStartDate
    }

    visionSuccessMessage.value = `🎉 成功提取出 ${result.courses.length} 门课程！已自动生成周课表与排期规则，请在下方核对无误后一键导入。`
  } catch (err: any) {
    visionError.value = err?.message || 'AI 识图出现异常，请稍后重试。'
  } finally {
    isVisionRecognizing.value = false
  }
}

// 剪贴板粘贴图片监听
function handlePaste(e: ClipboardEvent) {
  if (!props.isOpen || activeTab.value !== 'vision') return
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        processImageFile(file)
        e.preventDefault()
        break
      }
    }
  }
}

let unsubAiConfig: (() => void) | null = null

onMounted(() => {
  window.addEventListener('paste', handlePaste)
  unsubAiConfig = onAiConfigChange((cfg) => {
    aiConfig.value = cfg
  })
})

onUnmounted(() => {
  window.removeEventListener('paste', handlePaste)
  if (unsubAiConfig) unsubAiConfig()
})

// 复制抓取脚本
async function copyBookmarkletScript() {
  try {
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
      navigator.clipboard.writeText(content).then(function(){
        alert('🎉 课表数据已成功复制到剪贴板！\\n请切回 Akasha 导入窗口，点击“粘贴课表内容”即可一键导入。');
      }).catch(function(){
        prompt('请复制以下提取的课表数据后粘贴到 Akasha：', content.substring(0, 3000));
      });
    })();`

    await navigator.clipboard.writeText(rawScript)
    hasCopiedScript.value = true
    setTimeout(() => {
      hasCopiedScript.value = false
    }, 3000)
  } catch (_e) {
    alert('复制失败，请手动选择复制。')
  }
}

// 粘贴剪贴板并解析
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    if (text) {
      rawContentInput.value = text
      handleParseRawContent()
    }
  } catch (_e) {
    alert('无法直接读取剪贴板，请在输入框中按 Ctrl+V 粘贴。')
  }
}

// 解析输入文本
function handleParseRawContent() {
  const result = parseEducationalContent(rawContentInput.value)
  if (result.length > 0) {
    parsedCourses.value = result
    config.value.courses = result
  } else {
    alert('未能识别出课程表数据。请确保粘贴了包含课表表格的源码或 API JSON。')
  }
}

// CSV 模板下载
function downloadCsvTemplate() {
  const csv = generateWakeUpCsvTemplate()
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'WakeUp_Course_Template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function triggerCsvFileInput() {
  csvFileInputRef.value?.click()
}

function handleCsvFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadCsvFile(file)
}

function handleCsvDrop(e: DragEvent) {
  isDraggingCsv.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) loadCsvFile(file)
}

function loadCsvFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) {
      const courses = parseWakeUpCsv(text)
      if (courses.length > 0) {
        parsedCourses.value = courses
        config.value.courses = courses
      } else {
        alert('CSV 文件未能解析出有效课程，请确保列名与格式匹配 WakeUp 模板。')
      }
    }
  }
  reader.readAsText(file)
}

function triggerIcsFileInput() {
  icsFileInputRef.value?.click()
}

function handleIcsFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) loadIcsFile(file)
}

function handleIcsDrop(e: DragEvent) {
  isDraggingIcs.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) loadIcsFile(file)
}

function loadIcsFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    if (text) {
      const events = parseIcsCalendar(text)
      if (events.length > 0) {
        // 直接将事件封装为虚拟课程展示
        const mappedCourses: CourseItem[] = events.slice(0, 30).map((ev, idx) => ({
          id: `ics-${idx}`,
          name: ev.title || '日历事项',
          dayOfWeek: ev.date ? (new Date(ev.date).getDay() || 7) : 1,
          startSection: 1,
          step: 2,
          weeks: [1],
          location: ev.title?.includes('@') ? ev.title.split('@')[1] : undefined,
        }))
        parsedCourses.value = mappedCourses
        config.value.courses = mappedCourses
      } else {
        alert('ICS 文件解析失败，未找到合法的 VEVENT 日程事件。')
      }
    }
  }
  reader.readAsText(file)
}

function loadSampleCourses() {
  const sample = generateWakeUpCsvTemplate()
  const courses = parseWakeUpCsv(sample)
  parsedCourses.value = courses
  config.value.courses = courses
}

// 导出为 WakeUp CSV
function exportToWakeUpCsvFile() {
  const csv = exportCoursesToWakeUpCsv(parsedCourses.value)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${config.value.semesterName || 'Course_Schedule'}_WakeUp.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// 导出为 .ics 日历
function exportToIcsFile() {
  config.value.courses = parsedCourses.value
  const ics = generateIcsCalendar(config.value)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${config.value.semesterName || 'Course_Schedule'}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

// 执行入库
function executeImportToAkasha() {
  if (parsedCourses.value.length === 0) return
  isImporting.value = true
  try {
    config.value.courses = parsedCourses.value
    const { project, schedules } = convertAcademicToAkasha(config.value)

    emit('apply-academic-schedule', {
      project,
      schedules,
      areaId: targetAreaId.value === '__new__' ? undefined : targetAreaId.value,
      summary: `已成功导入课表「${project.title}」（共 ${parsedCourses.value.length} 门课程，生成 ${schedules.length} 项日程）`,
    })

    emit('close')
  } finally {
    isImporting.value = false
  }
}
</script>

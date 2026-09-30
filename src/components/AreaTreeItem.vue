<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Layers,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  CalendarOff
} from 'lucide-vue-next'
import type { Area, AreaTreeNode } from '@/types'

const props = defineProps<{
  node: AreaTreeNode
  selectedAreaId: string
  collapsedMap: Record<string, boolean>
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'toggle-collapse', id: string): void
  (e: 'add-subarea', parentId: string): void
  (e: 'edit-area', area: Area): void
  (e: 'delete-area', area: Area): void
  (e: 'toggle-calendar', area: Area): void
  (e: 'drop-area', payload: { draggedId: string; targetId: string; position: 'before' | 'after' | 'inside' }): void
  (e: 'drop-project', payload: { projectId: string; targetAreaId: string }): void
}>()

const isSelected = computed(() => props.selectedAreaId === props.node.id)
const isCollapsed = computed(() => !!props.collapsedMap[props.node.id])
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)

const isDragging = ref(false)
const dropPosition = ref<'before' | 'after' | 'inside' | null>(null)
let hoverTimer: any = null

function handleDragStart(e: DragEvent) {
  isDragging.value = true
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/x-akasha-area', props.node.id)
    e.dataTransfer.setData('text/plain', props.node.id)
    e.dataTransfer.effectAllowed = 'move'
  }
}

function handleDragEnd() {
  isDragging.value = false
  dropPosition.value = null
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
}

function handleDragOver(e: DragEvent) {
  const dt = e.dataTransfer
  if (!dt) return
  const isArea = dt.types.includes('application/x-akasha-area')
  const isProject = dt.types.includes('application/x-akasha-project')

  if (!isArea && !isProject) return

  e.preventDefault()
  dt.dropEffect = 'move'

  if (isProject) {
    dropPosition.value = 'inside'
    return
  }

  // 拖拽领域时计算投放位置：上 25% 为 before，下 25% 为 after，中间为 inside
  const targetEl = e.currentTarget as HTMLElement
  const rect = targetEl.getBoundingClientRect()
  const offsetY = e.clientY - rect.top
  const ratio = offsetY / rect.height

  if (ratio < 0.25) {
    dropPosition.value = 'before'
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
  } else if (ratio > 0.75) {
    dropPosition.value = 'after'
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
  } else {
    dropPosition.value = 'inside'
    // 悬停在折叠节点上超过 500ms 时自动展开，方便往深层子目录投放
    if (hasChildren.value && isCollapsed.value && !hoverTimer) {
      hoverTimer = setTimeout(() => {
        emit('toggle-collapse', props.node.id)
        hoverTimer = null
      }, 500)
    }
  }
}

function handleDragLeave(e: DragEvent) {
  const related = e.relatedTarget as HTMLElement | null
  const current = e.currentTarget as HTMLElement
  if (!related || !current.contains(related)) {
    dropPosition.value = null
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      hoverTimer = null
    }
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault()
  e.stopPropagation()

  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }

  const dt = e.dataTransfer
  if (!dt) return

  const draggedAreaId = dt.getData('application/x-akasha-area') || dt.getData('text/plain')
  const draggedProjectId = dt.getData('application/x-akasha-project')

  if (draggedProjectId) {
    emit('drop-project', { projectId: draggedProjectId, targetAreaId: props.node.id })
  } else if (draggedAreaId && draggedAreaId !== props.node.id) {
    const pos = dropPosition.value || 'inside'
    emit('drop-area', { draggedId: draggedAreaId, targetId: props.node.id, position: pos })
  }

  dropPosition.value = null
}
</script>

<template>
  <div class="select-none">
    <!-- 节点单行条目 -->
    <div
      draggable="true"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      @click="emit('select', node.id)"
      :class="[
        'group relative flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer border border-transparent',
        isDragging ? 'opacity-40' : '',
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-semibold border-blue-200/60 dark:border-blue-800/40 shadow-2xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60',
        dropPosition === 'inside'
          ? 'bg-blue-100/80 dark:bg-blue-900/60 ring-2 ring-blue-500/70 text-blue-700 dark:text-blue-200'
          : ''
      ]"
    >
      <!-- 拖拽至顶部/底部时的插入指示线 -->
      <div
        v-if="dropPosition === 'before'"
        class="absolute -top-[1.5px] left-1 right-1 h-[2px] bg-blue-500 rounded-full z-10 pointer-events-none"
      ></div>
      <div
        v-if="dropPosition === 'after'"
        class="absolute -bottom-[1.5px] left-1 right-1 h-[2px] bg-blue-500 rounded-full z-10 pointer-events-none"
      ></div>

      <div class="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
        <!-- 折叠/展开箭头 -->
        <button
          v-if="hasChildren"
          type="button"
          @click.stop="emit('toggle-collapse', node.id)"
          class="w-4 h-4 -ml-1 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
          :title="isCollapsed ? '展开' : '折叠'"
        >
          <ChevronRight
            class="w-3.5 h-3.5 transition-transform duration-200"
            :class="!isCollapsed ? 'rotate-90 text-slate-600 dark:text-slate-300' : ''"
          />
        </button>
        <span v-else class="w-3 inline-block shrink-0"></span>

        <!-- 领域图层图标 -->
        <Layers
          class="w-3.5 h-3.5 shrink-0"
          :class="[
            isSelected
              ? 'text-blue-600 dark:text-blue-400'
              : hasChildren
                ? 'text-indigo-500/90 dark:text-indigo-400/80'
                : 'text-slate-400 dark:text-slate-500'
          ]"
          :style="node.color ? { color: node.color } : {}"
        />

        <!-- 领域标题 -->
        <span class="truncate" :title="node.title">
          {{ node.title }}
        </span>
      </div>

      <!-- 右侧：汇总 Badge 与悬浮工具栏 -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- 悬浮操作图标组（仅在 hover 时显现，保持界面素雅） -->
        <div class="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
          <button
            type="button"
            @click.stop="emit('toggle-calendar', node)"
            class="p-0.5 rounded transition-colors cursor-pointer"
            :class="node.showOnCalendar === false
              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-100/60 dark:hover:bg-amber-900/40'
              : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'"
            :title="node.showOnCalendar === false ? '日历已隐藏（点击在日历中显示）' : '日历已显示（点击在日历中隐藏）'"
          >
            <CalendarOff v-if="node.showOnCalendar === false" class="w-3 h-3" />
            <Calendar v-else class="w-3 h-3" />
          </button>
          <button
            type="button"
            @click.stop="emit('add-subarea', node.id)"
            class="p-0.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            title="新建子领域"
          >
            <Plus class="w-3 h-3" />
          </button>
          <button
            type="button"
            @click.stop="emit('edit-area', node)"
            class="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
            title="编辑领域"
          >
            <Edit2 class="w-3 h-3" />
          </button>
          <button
            type="button"
            @click.stop="emit('delete-area', node)"
            class="p-0.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="删除领域"
          >
            <Trash2 class="w-3 h-3" />
          </button>
        </div>

        <!-- 日历隐藏状态常驻指示（非 hover 状态也能感知） -->
        <span
          v-if="node.showOnCalendar === false"
          class="text-amber-500/80 dark:text-amber-400/80 group-hover:hidden"
          title="此领域已在日历中隐藏"
        >
          <CalendarOff class="w-3 h-3" />
        </span>

        <!-- 项目计数 Badge -->
        <span
          class="text-[10px] px-1.5 py-0.5 rounded-full font-mono transition-colors"
          :class="[
            isSelected
              ? 'bg-blue-100 dark:bg-blue-900/80 text-blue-700 dark:text-blue-200 font-bold'
              : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
          ]"
          :title="hasChildren ? `包含子领域共 ${node.totalProjectCount} 个项目 (直属 ${node.projectCount} 个)` : `直属 ${node.projectCount} 个项目`"
        >
          {{ node.totalProjectCount }}
        </span>
      </div>
    </div>

    <!-- 递归渲染子节点 -->
    <div
      v-if="hasChildren && !isCollapsed"
      class="mt-0.5 space-y-0.5 border-l border-slate-200/80 dark:border-slate-800 ml-3 pl-1"
    >
      <AreaTreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-area-id="selectedAreaId"
        :collapsed-map="collapsedMap"
        @select="emit('select', $event)"
        @toggle-collapse="emit('toggle-collapse', $event)"
        @add-subarea="emit('add-subarea', $event)"
        @edit-area="emit('edit-area', $event)"
        @delete-area="emit('delete-area', $event)"
        @toggle-calendar="emit('toggle-calendar', $event)"
        @drop-area="emit('drop-area', $event)"
        @drop-project="emit('drop-project', $event)"
      />
    </div>
  </div>
</template>

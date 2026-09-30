<script setup lang="ts">
import { computed } from 'vue'
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Plus,
  Edit2,
  Trash2
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
}>()

const isSelected = computed(() => props.selectedAreaId === props.node.id)
const isCollapsed = computed(() => !!props.collapsedMap[props.node.id])
const hasChildren = computed(() => props.node.children && props.node.children.length > 0)
</script>

<template>
  <div class="select-none">
    <!-- 节点单行条目 -->
    <div
      @click="emit('select', node.id)"
      :class="[
        'group flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-all cursor-pointer border border-transparent',
        isSelected
          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-semibold border-blue-200/60 dark:border-blue-800/40 shadow-2xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
      ]"
    >
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

        <!-- 文件夹图标 -->
        <component
          :is="hasChildren && !isCollapsed ? FolderOpen : Folder"
          class="w-3.5 h-3.5 shrink-0"
          :class="[
            isSelected
              ? 'text-blue-600 dark:text-blue-400'
              : hasChildren
                ? 'text-amber-500/90 dark:text-amber-400/80'
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
      />
    </div>
  </div>
</template>

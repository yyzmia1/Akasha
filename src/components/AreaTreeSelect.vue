<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  ChevronRight,
  ChevronDown,
  Check,
  Search,
  Layers,
  X
} from 'lucide-vue-next'
import type { Area, AreaTreeNode, Project } from '@/types'
import { buildAreaTree, flattenAreaTree } from '@/utils/areaTree'

const props = withDefaults(
  defineProps<{
    modelValue: string | null
    areas: Area[]
    projects?: Project[]
    allowRoot?: boolean
    rootLabel?: string
    disabledAreaIds?: string[]
    placeholder?: string
  }>(),
  {
    modelValue: null,
    allowRoot: false,
    rootLabel: '顶级根领域（无上级）',
    disabledAreaIds: () => [],
    placeholder: '请选择领域'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement | null>(null)
const collapsedMap = ref<Record<string, boolean>>({})

const areaTree = computed(() => buildAreaTree(props.areas, props.projects))
const flatNodes = computed(() => flattenAreaTree(areaTree.value))

const selectedArea = computed(() => {
  if (!props.modelValue) return null
  return props.areas.find((a) => a.id === props.modelValue) || null
})

function toggleOpen() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
  }
}

function closeDropdown() {
  isOpen.value = false
}

function handleSelect(id: string | null) {
  if (id && props.disabledAreaIds.includes(id)) return
  emit('update:modelValue', id)
  isOpen.value = false
}

function toggleCollapse(nodeId: string, e: MouseEvent) {
  e.stopPropagation()
  collapsedMap.value[nodeId] = !collapsedMap.value[nodeId]
}

function isNodeDisabled(nodeId: string): boolean {
  return props.disabledAreaIds.includes(nodeId)
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    closeDropdown()
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})

// 搜索过滤匹配的节点 ID 集合
const filteredFlatNodes = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return null
  return flatNodes.value.filter((n) => n.title.toLowerCase().includes(q))
})
</script>

<template>
  <div ref="containerRef" class="relative w-full select-none">
    <!-- 触发器按钮 -->
    <button
      type="button"
      @click="toggleOpen"
      class="w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm rounded-lg border bg-white dark:bg-slate-950 transition-all cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      :class="[
        isOpen
          ? 'border-blue-500 ring-2 ring-blue-500/10'
          : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
      ]"
    >
      <div class="flex items-center gap-2 min-w-0 flex-1 mr-2">
        <template v-if="modelValue === null && allowRoot">
          <Layers class="w-4 h-4 text-blue-500 shrink-0" />
          <span class="truncate font-medium text-slate-700 dark:text-slate-200">
            {{ rootLabel }}
          </span>
        </template>
        <template v-else-if="selectedArea">
          <span
            class="w-2.5 h-2.5 rounded-full shrink-0"
            :style="{ backgroundColor: selectedArea.color || '#3b82f6' }"
          ></span>
          <span class="truncate font-medium text-slate-800 dark:text-slate-100">
            {{ selectedArea.title }}
          </span>
        </template>
        <template v-else>
          <Layers class="w-4 h-4 text-slate-400 shrink-0" />
          <span class="text-slate-400 dark:text-slate-500 truncate">
            {{ placeholder }}
          </span>
        </template>
      </div>

      <ChevronDown
        class="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200"
        :class="isOpen ? 'rotate-180 text-blue-500' : ''"
      />
    </button>

    <!-- 下拉弹层 -->
    <div
      v-if="isOpen"
      class="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-1.5 max-h-56 flex flex-col animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- 搜索框（当领域数量较多时展现） -->
      <div v-if="areas.length > 5" class="relative shrink-0">
        <Search class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索分类..."
          class="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
          @click.stop
        />
        <button
          v-if="searchQuery"
          type="button"
          @click="searchQuery = ''"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
        >
          <X class="w-3 h-3" />
        </button>
      </div>

      <!-- 选项滚动容器 -->
      <div class="overflow-y-auto no-scrollbar flex-1 space-y-0.5 py-0.5">
        <!-- 根领域选项（如果启用 allowRoot） -->
        <div
          v-if="allowRoot && !searchQuery"
          @click="handleSelect(null)"
          :class="[
            'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer select-none',
            modelValue === null
              ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 font-semibold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
          ]"
        >
          <div class="flex items-center gap-2 min-w-0">
            <Layers class="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span class="truncate">{{ rootLabel }}</span>
          </div>
          <Check v-if="modelValue === null" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        </div>

        <!-- 搜索匹配模式展示 -->
        <template v-if="filteredFlatNodes !== null">
          <div v-if="filteredFlatNodes.length === 0" class="py-4 text-center text-xs text-slate-400">
            无匹配分类
          </div>
          <div
            v-for="node in filteredFlatNodes"
            :key="node.id"
            @click="!isNodeDisabled(node.id) && handleSelect(node.id)"
            :class="[
              'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all select-none',
              isNodeDisabled(node.id)
                ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40 text-slate-400'
                : modelValue === node.id
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 font-semibold cursor-pointer'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer'
            ]"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span
                class="w-2.5 h-2.5 rounded-full shrink-0"
                :style="{ backgroundColor: node.color || '#3b82f6' }"
              ></span>
              <span class="truncate">{{ node.title }}</span>
              <span v-if="isNodeDisabled(node.id)" class="text-[10px] text-slate-400 shrink-0">(不可选)</span>
            </div>
            <Check v-if="modelValue === node.id" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          </div>
        </template>

        <!-- 完整树形折叠层级渲染 -->
        <template v-else>
          <!-- 递归渲染组件片段 -->
          <div
            v-for="node in flatNodes"
            :key="node.id"
            @click="!isNodeDisabled(node.id) && handleSelect(node.id)"
            :class="[
              'group flex items-center justify-between py-1.5 px-2 rounded-lg text-xs transition-all select-none',
              isNodeDisabled(node.id)
                ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-900/40 text-slate-400'
                : modelValue === node.id
                  ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-300 font-semibold cursor-pointer'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 cursor-pointer'
            ]"
            :style="{ paddingLeft: `${node.depth * 14 + 8}px` }"
          >
            <div class="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
              <!-- 折叠箭头提示/占位 -->
              <span
                v-if="node.children && node.children.length > 0"
                class="w-3.5 h-3.5 rounded flex items-center justify-center text-slate-400 shrink-0"
              >
                <ChevronRight class="w-3 h-3 text-slate-400 rotate-90" />
              </span>
              <span v-else class="w-2.5 inline-block shrink-0"></span>

              <!-- 颜色圆点或文件夹 -->
              <span
                class="w-2 h-2 rounded-full shrink-0"
                :style="{ backgroundColor: node.color || '#3b82f6' }"
              ></span>

              <span class="truncate" :title="node.title">
                {{ node.title }}
              </span>
              <span v-if="isNodeDisabled(node.id)" class="text-[10px] text-slate-400 shrink-0">(不可选)</span>
            </div>

            <div class="flex items-center gap-1 shrink-0">
              <span class="text-[10px] px-1.5 py-0.5 rounded-full font-mono bg-slate-100 dark:bg-slate-800 text-slate-400">
                {{ node.totalProjectCount }}
              </span>
              <Check v-if="modelValue === node.id" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

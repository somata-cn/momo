<template>
  <div class="card h-full memorize-mode-list" :class="{ 'flex flex-col': trainingMode === 'memorize' }">
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <h2 class="text-lg font-semibold text-gray-800">题目列表</h2>
      <div class="text-sm text-gray-500">
        {{ answeredQuestions }}/{{ totalQuestions }}
      </div>
    </div>
    
    <!-- 进度条 -->
    <div class="mb-4 flex-shrink-0">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div 
          class="bg-blue-600 h-2 rounded-full transition-all duration-300"
          :style="{ width: progressPercentage + '%' }"
        ></div>
      </div>
      <div class="text-xs text-gray-500 mt-1">
        正确率: {{ correctRate }}%
      </div>
    </div>

    <!-- 题目编号方块网格 -->
    <div 
      ref="containerRef"
      class="question-grid grid gap-2 max-h-96 overflow-y-auto hide-scrollbar"
      :class="{ 'flex-1': trainingMode === 'memorize' }"
      :style="{ gridTemplateColumns: `repeat(${dynamicColumns}, minmax(0, 1fr))` }"
    >
      <!-- 调试信息（开发时调为true查看） -->
      <div v-if="false" class="col-span-full text-xs text-gray-400 mb-2 leading-tight">
        <div>列数: {{ dynamicColumns }} | 容器: {{ containerRef?.value?.clientWidth || 0 }}px</div>
        <div>题目: {{ allQuestions.length }} | 行数: {{ Math.ceil(allQuestions.length / dynamicColumns) }}</div>
      </div>
      <div
        v-for="question in allQuestions"
        :key="question.index"
        @click="selectQuestion(question.index)"
        class="question-grid-item aspect-square w-full max-w-8 h-8 flex items-center justify-center text-xs font-medium rounded cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 mx-auto"
        :class="getQuestionBlockClass(question)"
        :title="`第 ${question.index + 1} 题`"
      >
        {{ question.index + 1 }}
      </div>
    </div>

    <!-- 图例 -->
    <div class="mt-4 grid grid-cols-2 gap-2 text-xs flex-shrink-0">
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-gray-300 rounded"></div>
        <span class="text-gray-600">未作答</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-green-500 rounded"></div>
        <span class="text-gray-600">正确</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 bg-red-500 rounded"></div>
        <span class="text-gray-600">错误</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 border-2 border-blue-500 rounded bg-blue-50"></div>
        <span class="text-gray-600">当前</span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="totalQuestions === 0" class="text-center py-8">
      <div class="text-gray-500 mb-2">暂无题目</div>
      <div class="text-sm text-gray-400">请先导入题目文件</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useQuestionStore } from '../stores/question.js'

const questionStore = useQuestionStore()
const containerRef = ref(null)
const dynamicColumns = ref(12)

const currentQuestionIndex = computed(() => questionStore.currentQuestionIndex)
const totalQuestions = computed(() => questionStore.totalQuestions)
const answeredQuestions = computed(() => questionStore.answeredQuestions)
const correctAnswers = computed(() => questionStore.correctAnswers)
const trainingMode = computed(() => questionStore.trainingMode)
const availableQuestionCount = computed(() => questionStore.availableQuestionCount)

const allQuestions = computed(() => {
  // 显示所有题目
  const questions = []
  const sections = questionStore.sections
  for (const sectionName in sections) {
    if (Array.isArray(sections[sectionName])) {
      questions.push(...sections[sectionName])
    }
  }
  return questions.sort((a, b) => a.index - b.index)
})

const progressPercentage = computed(() => {
  if (!totalQuestions.value || totalQuestions.value === 0) return 0
  if (!answeredQuestions.value || answeredQuestions.value === 0) return 0
  return (answeredQuestions.value / totalQuestions.value) * 100
})

const correctRate = computed(() => {
  if (!answeredQuestions.value || answeredQuestions.value === 0) return 0
  if (!correctAnswers.value || correctAnswers.value === 0) return 0
  return Math.round((correctAnswers.value / answeredQuestions.value) * 100)
})

function getQuestionBlockClass(question) {
  if (!question || typeof question !== 'object') {
    return 'bg-gray-300 text-gray-700 hover:bg-gray-400'
  }
  
  const isCurrent = question.index === currentQuestionIndex.value
  
  if (isCurrent) {
    return 'border-2 border-blue-500 bg-blue-50 text-blue-700 font-bold'
  }
  
  switch (question.status) {
    case 'correct':
      return 'bg-green-500 text-white hover:bg-green-600'
    case 'incorrect':
      return 'bg-red-500 text-white hover:bg-red-600'
    default:
      return 'bg-gray-300 text-gray-700 hover:bg-gray-400'
  }
}

function calculateDynamicColumns() {
  if (!containerRef.value) return
  
  try {
    const containerWidth = containerRef.value.clientWidth // 使用clientWidth排除滚动条
    
    // 边界情况：容器宽度为0或无效
    if (!containerWidth || containerWidth <= 0) {
      console.warn('容器宽度无效，使用默认列数')
      dynamicColumns.value = 12
      return
    }
    
    const minBlockWidth = 32 // 减小到32px，更紧凑
    const maxBlockWidth = 48 // 最大48px
    const gapWidth = 8 // gap-2 = 0.5rem = 8px
    
    // 获取容器padding（如果有的话）
    const computedStyle = window.getComputedStyle(containerRef.value)
    const paddingLeft = parseInt(computedStyle.paddingLeft) || 0
    const paddingRight = parseInt(computedStyle.paddingRight) || 0
    
    // 计算可用宽度（减去padding）
    const availableWidth = containerWidth - paddingLeft - paddingRight
    
    // 边界情况：可用宽度不足
    if (availableWidth < minBlockWidth + gapWidth) {
      console.warn('可用宽度不足，使用最小列数')
      dynamicColumns.value = 6
      return
    }
    
    // 计算最大可能的列数
    const maxColumns = Math.floor(availableWidth / (minBlockWidth + gapWidth))
    
    // 计算最优列数，确保方块不会太大
    const optimalColumns = Math.floor(availableWidth / (maxBlockWidth + gapWidth))
    
    // 限制在合理范围内（6-20列），优先使用最优列数
    const targetColumns = optimalColumns > 6 ? optimalColumns : maxColumns
    dynamicColumns.value = Math.max(6, Math.min(targetColumns, 20))
    
    console.log(`动态列数计算: 容器宽度=${containerWidth}, 可用宽度=${availableWidth}, 列数=${dynamicColumns.value}`)
  } catch (error) {
    console.error('计算动态列数失败:', error)
    dynamicColumns.value = 12 // 使用默认列数
  }
}

function selectQuestion(index) {
  if (typeof index !== 'number' || index < 0) return
  questionStore.setCurrentQuestion(index)
}

// 防抖函数
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

onMounted(() => {
  const debouncedCalculate = debounce(calculateDynamicColumns, 100)
  
  // 初始计算
  calculateDynamicColumns()
  
  // 监听容器大小变化
  const resizeObserver = new ResizeObserver(debouncedCalculate)
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }
  
  // 监听窗口大小变化（作为备选）
  window.addEventListener('resize', debouncedCalculate)
  
  onUnmounted(() => {
    resizeObserver.disconnect()
    window.removeEventListener('resize', debouncedCalculate)
  })
})
</script>
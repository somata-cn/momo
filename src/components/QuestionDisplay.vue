<template>
  <!-- 训练模式控制栏 - 始终显示 -->
  <div class="mb-4 p-3 bg-gray-50 rounded-lg">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
      <div class="flex items-center space-x-3">
        <span class="text-sm font-medium text-gray-700">训练模式：</span>
        <div class="flex space-x-2">
          <button
            @click="setTrainingMode('normal')"
            class="px-3 py-1 text-xs rounded-full transition-colors"
            :class="trainingMode === 'normal' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
          >
            正常模式
          </button>


          <button
            @click="setTrainingMode('memorize')"
            class="px-3 py-1 text-xs rounded-full transition-colors"
            :class="trainingMode === 'memorize' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
          >
            背题模式
          </button>
        </div>
      </div>
      <div class="flex items-center justify-between">
        <div class="text-xs text-gray-500">
          <span v-if="trainingMode === 'memorize'">背题模式</span>
          <span v-else>总题数：{{ totalQuestions }} 题</span>
        </div>
       <span
         v-if="trainingMode === 'normal'"
         @click="shuffleQuestions"
         class="ml-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 cursor-pointer transition-colors"
       >
         重新打乱
       </span>
      </div>
    </div>
  </div>

  <!-- 正常模式 - 单题显示 -->
  <div v-if="trainingMode !== 'memorize' && currentQuestion" class="card">
    <!-- 题目头部信息 -->
    <div class="mb-4 sm:mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
        <span class="text-sm text-gray-500 order-2 sm:order-1">
          第 {{ currentDisplayIndex }} 题 / 共 {{ availableQuestionCount }} 题
        </span>
        <div class="flex items-center space-x-2 order-1 sm:order-2 self-start sm:self-auto">
          <span class="text-xs sm:text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {{ currentQuestion.section }}
          </span>
          <span class="text-xs sm:text-sm px-2 py-1 rounded" :class="currentQuestionType === 'single' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'">
            {{ currentQuestionType === 'single' ? '单选题' : '多选题' }}
          </span>
        </div>
      </div>
      <div class="text-base sm:text-lg font-medium text-gray-800 leading-relaxed">
        {{ currentQuestion.problem }}
      </div>
    </div>

    <!-- 选项列表 -->
    <div class="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
      <div
        v-for="(option, index) in parsedOptions"
        :key="index"
        @click="toggleOption(option.key)"
        class="option-card p-3 sm:p-4"
        :class="getOptionClass(option.key)"
      >
        <div class="flex items-start space-x-2 sm:space-x-3">
          <div class="flex-shrink-0 mt-0.5 sm:mt-1">
            <div 
              class="w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center"
              :class="getOptionIndicatorClass(option.key)"
            >
              <span class="text-xs sm:text-sm font-medium">{{ option.key }}</span>
            </div>
          </div>
          <div class="flex-1 text-gray-700 text-sm sm:text-base">
            {{ option.value }}
          </div>
        </div>
      </div>
    </div>

    <!-- 答案反馈 -->
    <div v-if="hasSubmitted" class="mb-6 p-4 rounded-lg" :class="resultClass">
      <div class="flex items-center space-x-2 mb-2">
        <svg v-if="isCorrect" class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium" :class="resultTextClass">
          {{ resultMessage }}
        </span>
      </div>
      <div v-if="!isCorrect" class="text-sm text-gray-600">
        <div>正确答案：{{ correctAnswerDisplay }}</div>
        <div>你的答案：{{ userAnswerDisplay }}</div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
      <button 
        @click="previousQuestion" 
        :disabled="currentQuestionIndex === 0"
        class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-2 sm:order-1"
      >
        上一题
      </button>
      
      <div class="flex space-x-3 w-full sm:w-auto order-1 sm:order-2">
        <button 
          v-if="!hasSubmitted"
          @click="submitAnswer" 
          :disabled="selectedOptions.length === 0"
          class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
        >
          提交答案 (Enter)
        </button>
        <button 
          v-else
          @click="clearAnswer"
          class="btn-secondary flex-1 sm:flex-none"
        >
          重新作答
        </button>
      </div>
      
      <button 
        @click="nextQuestion" 
        :disabled="currentQuestionIndex === availableQuestionCount - 1"
        class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-3"
      >
        下一题
      </button>
    </div>

    <!-- 快捷键提示 -->
    <div class="mt-4 text-xs text-gray-500 text-center">
      快捷键：数字键1-9选择选项{{ currentQuestionType === 'single' ? '' : '（可多选）' }}，Enter提交，←→切换题目
    </div>
  </div>

  <!-- 背题模式 - 显示所有题目 -->
  <div v-if="trainingMode === 'memorize' && allQuestions.length > 0" class="space-y-6">
    <div v-for="(question, index) in allQuestions" :key="index" class="card">
      <!-- 题目头部信息 -->
      <div class="mb-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-2 sm:space-y-0">
          <span class="text-sm text-gray-500 order-2 sm:order-1">
            第 {{ index + 1 }} 题 / 共 {{ allQuestions.length }} 题
          </span>
          <div class="flex items-center space-x-2 order-1 sm:order-2 self-start sm:self-auto">
            <span class="text-xs sm:text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded">
              {{ question.section }}
            </span>
            <span class="text-xs sm:text-sm px-2 py-1 rounded" :class="getQuestionType(question.answer.length) === 'single' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'">
              {{ getQuestionType(question.answer.length) === 'single' ? '单选题' : '多选题' }}
            </span>
          </div>
        </div>
        <div class="text-base sm:text-lg font-medium text-gray-800 leading-relaxed">
          {{ question.problem }}
        </div>
      </div>

      <!-- 选项列表 -->
      <div class="space-y-2 mb-4">
        <div
          v-for="(option, optionIndex) in parseOptions(question.options)"
          :key="optionIndex"
          class="option-card p-3"
          :class="getMemorizeOptionClass(option.key, question.answer)"
        >
          <div class="flex items-start space-x-2">
            <div class="flex-shrink-0 mt-0.5">
              <div 
                class="w-5 h-5 rounded border-2 flex items-center justify-center"
                :class="getMemorizeIndicatorClass(option.key, question.answer)"
              >
                <span class="text-xs font-medium">{{ option.key }}</span>
              </div>
            </div>
            <div class="flex-1 text-gray-700 text-sm">
              {{ option.value }}
            </div>
          </div>
        </div>
      </div>

      <!-- 答案显示 -->
      <div class="p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div class="flex items-center mb-2">
          <div class="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mr-2">
            <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <h3 class="text-sm font-medium text-purple-800">标准答案</h3>
        </div>
        <div class="text-sm text-purple-700">
          <div class="mb-1">
            <span class="font-medium">正确答案：</span>
            <span class="font-mono">{{ question.answer.join(', ') }}</span>
          </div>
          <div v-if="question.explanation" class="mt-2 p-2 bg-purple-100 rounded text-purple-800">
            <span class="font-medium">解析：</span>
            {{ question.explanation }}
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 空状态 -->
  <div v-if="!currentQuestion && trainingMode !== 'memorize'" class="card text-center py-12">
    <div class="text-gray-500 mb-4">暂无题目可显示</div>
    <div class="text-sm text-gray-400">请先导入题目文件</div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useQuestionStore } from '../stores/question.js'

const questionStore = useQuestionStore()

const currentQuestion = computed(() => questionStore.currentQuestion)
const currentQuestionIndex = computed(() => questionStore.currentQuestionIndex)
const totalQuestions = computed(() => questionStore.totalQuestions)
const userAnswers = computed(() => questionStore.userAnswers)
const questionResults = computed(() => questionStore.questionResults)
const trainingMode = computed(() => questionStore.trainingMode)
const availableQuestionCount = computed(() => questionStore.availableQuestionCount)
const currentQuestionType = computed(() => questionStore.currentQuestionType)

// 背题模式相关
const allQuestions = computed(() => {
  if (trainingMode.value !== 'memorize') return []
  const questions = []
  const sections = questionStore.sections
  for (const sectionName in sections) {
    questions.push(...sections[sectionName])
  }
  return questions
})

const selectedOptions = ref([])
const hasSubmitted = ref(false)
const isCorrect = ref(false)

// 解析选项
const parsedOptions = computed(() => {
  if (!currentQuestion.value) return []
  return currentQuestion.value.options.map(option => {
    const parts = option.split('、')
    return {
      key: parts[0],
      value: parts.slice(1).join('、')
    }
  })
})

// 背题模式解析选项
function parseOptions(options) {
  return options.map(option => {
    const parts = option.split('、')
    return {
      key: parts[0],
      value: parts.slice(1).join('、')
    }
  })
}

// 获取题目类型
function getQuestionType(answerLength) {
  return answerLength === 1 ? 'single' : 'multiple'
}

// 背题模式获取选项样式
function getMemorizeOptionClass(optionKey, correctAnswers) {
  const classes = ['option-card']
  const isCorrectAnswer = correctAnswers.includes(optionKey)
  
  if (isCorrectAnswer) {
    classes.push('option-correct')
  }
  
  return classes
}

// 背题模式获取指示器样式
function getMemorizeIndicatorClass(optionKey, correctAnswers) {
  const classes = ['border-2']
  const isCorrectAnswer = correctAnswers.includes(optionKey)
  
  if (isCorrectAnswer) {
    classes.push('border-green-500 bg-green-500 text-white')
  } else {
    classes.push('border-gray-300')
  }
  
  return classes
}

// 获取选项样式类
function getOptionClass(optionKey) {
  const classes = []
  
  if (selectedOptions.value.includes(optionKey)) {
    classes.push('option-selected')
  }
  
  if (hasSubmitted.value || trainingMode.value === 'memorize') {
    const isCorrectAnswer = currentQuestion.value.answer.includes(optionKey)
    const isUserAnswer = selectedOptions.value.includes(optionKey)
    
    if (isCorrectAnswer) {
      classes.push('option-correct')
    } else if (isUserAnswer && !isCorrectAnswer) {
      classes.push('option-incorrect')
    }
  }
  
  return classes
}

// 获取选项指示器样式
function getOptionIndicatorClass(optionKey) {
  const classes = []
  
  if (selectedOptions.value.includes(optionKey)) {
    classes.push('border-blue-500 bg-blue-500 text-white')
  } else {
    classes.push('border-gray-300')
  }
  
  if (hasSubmitted.value || trainingMode.value === 'memorize') {
    const isCorrectAnswer = currentQuestion.value.answer.includes(optionKey)
    const isUserAnswer = selectedOptions.value.includes(optionKey)
    
    if (isCorrectAnswer) {
      classes.push('border-green-500 bg-green-500 text-white')
    } else if (isUserAnswer && !isCorrectAnswer) {
      classes.push('border-red-500 bg-red-500 text-white')
    }
  }
  
  return classes
}

// 切换选项选择
function toggleOption(optionKey) {
  if (hasSubmitted.value || trainingMode.value === 'memorize') return
  
  const index = selectedOptions.value.indexOf(optionKey)
  
  if (currentQuestionType.value === 'single') {
    // 单选题：只能选择一个选项
    selectedOptions.value = [optionKey]
  } else {
    // 多选题：可以切换多个选项
    if (index > -1) {
      selectedOptions.value.splice(index, 1)
    } else {
      selectedOptions.value.push(optionKey)
    }
  }
}

// 提交答案
function submitAnswer() {
  if (selectedOptions.value.length === 0) return
  
  const result = questionStore.submitAnswer(selectedOptions.value)
  hasSubmitted.value = true
  isCorrect.value = result
}

// 清除答案
function clearAnswer() {
  selectedOptions.value = []
  hasSubmitted.value = false
  isCorrect.value = false
}

// 上一题
function previousQuestion() {
  if (currentQuestionIndex.value > 0) {
    questionStore.setCurrentQuestion(currentQuestionIndex.value - 1)
  }
}

// 下一题
function nextQuestion() {
  if (currentQuestionIndex.value < availableQuestionCount.value - 1) {
    questionStore.setCurrentQuestion(currentQuestionIndex.value + 1)
  }
}

// 结果样式
const resultClass = computed(() => ({
  'bg-green-50 border border-green-200': isCorrect.value,
  'bg-red-50 border border-red-200': !isCorrect.value
}))

const resultTextClass = computed(() => ({
  'text-green-800': isCorrect.value,
  'text-red-800': !isCorrect.value
}))

const resultMessage = computed(() => {
  return isCorrect.value ? '回答正确！' : '回答错误！'
})

const correctAnswerDisplay = computed(() => {
  return currentQuestion.value.answer.join(', ')
})

const userAnswerDisplay = computed(() => {
  return selectedOptions.value.join(', ')
})

// 计算显示索引
const currentDisplayIndex = computed(() => {
  return currentQuestionIndex.value + 1
})

// 训练模式相关方法
function setTrainingMode(mode) {
  // 清理当前状态，防止模式切换时的显示冲突
  clearAnswer()
  questionStore.setTrainingMode(mode)
}

function shuffleQuestions() {
  questionStore.shuffleQuestions()
}

// 监听题目变化
watch(currentQuestion, (newQuestion) => {
  if (newQuestion) {
    // 恢复已提交的答案
    const actualIndex = questionStore.getActualQuestionIndex(currentQuestionIndex.value)
    const savedAnswer = userAnswers.value[actualIndex]
    const savedResult = questionResults.value[actualIndex]
    
    if (savedAnswer) {
      selectedOptions.value = [...savedAnswer]
      hasSubmitted.value = true
      isCorrect.value = savedResult?.isCorrect || false
    } else {
      selectedOptions.value = []
      hasSubmitted.value = false
      isCorrect.value = false
    }
  }
}, { immediate: true })

// 监听键盘事件
function handleKeyboardEvents() {
  const handleOptionSelectFromMain = (event) => {
    const optionIndex = event.detail.optionIndex
    if (parsedOptions.value[optionIndex]) {
      toggleOption(parsedOptions.value[optionIndex].key)
    }
  }
  
  const handleSubmitAnswerFromMain = () => {
    if (!hasSubmitted.value && selectedOptions.value.length > 0) {
      submitAnswer()
    }
  }
  
  window.addEventListener('optionSelectFromMain', handleOptionSelectFromMain)
  window.addEventListener('submitAnswerFromMain', handleSubmitAnswerFromMain)
  
  return () => {
    window.removeEventListener('optionSelectFromMain', handleOptionSelectFromMain)
    window.removeEventListener('submitAnswerFromMain', handleSubmitAnswerFromMain)
  }
}

onMounted(() => {
  const cleanup = handleKeyboardEvents()
  onUnmounted(cleanup)
})
</script>
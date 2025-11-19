<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 头部导航 -->
    <header class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-4">
            <h1 class="text-xl font-bold text-gray-900">背题练习</h1>
            <div class="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <span>共 {{ totalQuestions }} 题</span>
              <span>•</span>
              <span>已答 {{ answeredQuestions }} 题</span>
              <span>•</span>
              <span>正确率 {{ correctRate }}%</span>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <button 
              @click="showHelp = true"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="帮助 (Ctrl+?)"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button 
              @click="openSettings"
              class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="设置"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 主要内容区域 -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 prevent-x-overflow">
      <!-- 文件上传组件 -->
      <FileUpload v-if="totalQuestions === 0" />
      
      <!-- 题目练习区域 -->
      <div v-else>
        <!-- 桌面端布局 -->
        <div class="hidden lg:grid lg:grid-cols-4 gap-6">
          <!-- 左侧题目列表 -->
          <div class="lg:col-span-1">
            <div class="sticky top-6">
              <QuestionList />
            </div>
          </div>
          
          <!-- 右侧答题区域 -->
          <div class="lg:col-span-3">
            <QuestionDisplay />
          </div>
        </div>
        
        <!-- 移动端布局 -->
        <div class="lg:hidden">
          <!-- 答题区域优先显示 -->
          <div class="mb-6">
            <QuestionDisplay />
          </div>
          
          <!-- 题目列表在下方 -->
          <div class="sticky top-4">
            <QuestionList />
          </div>
        </div>
      </div>
    </main>

    <!-- 设置弹窗 -->
    <SettingsModal 
      :is-open="isSettingsOpen" 
      @close="closeSettings" 
    />

    <!-- 帮助弹窗 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showHelp" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black bg-opacity-50" @click="showHelp = false"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-bounce-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">快捷键帮助</h3>
            <button @click="showHelp = false" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="font-medium">数字键 1-9</span>
              <span class="text-gray-600">选择对应选项</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">← →</span>
              <span class="text-gray-600">上一题 / 下一题</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Enter</span>
              <span class="text-gray-600">提交答案</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Esc</span>
              <span class="text-gray-600">关闭弹窗</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">Ctrl+?</span>
              <span class="text-gray-600">显示帮助</span>
            </div>
          </div>
          <div class="mt-6 flex justify-end">
            <button @click="showHelp = false" class="btn-primary">知道了</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuestionStore } from './stores/question.js'
import FileUpload from './components/FileUpload.vue'
import QuestionList from './components/QuestionList.vue'
import QuestionDisplay from './components/QuestionDisplay.vue'
import SettingsModal from './components/SettingsModal.vue'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts.js'

// 初始化键盘快捷键
useKeyboardShortcuts()

const questionStore = useQuestionStore()

// 状态
const isSettingsOpen = ref(false)
const showHelp = ref(false)

// 计算属性
const totalQuestions = computed(() => questionStore.totalQuestions)
const answeredQuestions = computed(() => questionStore.answeredQuestions)
const correctAnswers = computed(() => questionStore.correctAnswers)
const correctRate = computed(() => {
  if (answeredQuestions.value === 0) return 0
  return Math.round((correctAnswers.value / answeredQuestions.value) * 100)
})
const trainingMode = computed(() => questionStore.trainingMode)

// 方法
function openSettings() {
  isSettingsOpen.value = true
}

function closeSettings() {
  isSettingsOpen.value = false
}

// 监听键盘事件
function handleKeyboardEvents() {
  // 监听选项选择事件
  const handleOptionSelect = (event) => {
    const optionIndex = event.detail.optionIndex
    // 触发 QuestionDisplay 组件中的选项选择
    const event2 = new CustomEvent('optionSelectFromMain', { 
      detail: { optionIndex } 
    })
    window.dispatchEvent(event2)
  }
  
  // 监听提交答案事件
  const handleSubmitAnswer = () => {
    // 触发 QuestionDisplay 组件中的提交答案
    const event = new CustomEvent('submitAnswerFromMain')
    window.dispatchEvent(event)
  }
  
  window.addEventListener('optionSelect', handleOptionSelect)
  window.addEventListener('submitAnswer', handleSubmitAnswer)
  
  return () => {
    window.removeEventListener('optionSelect', handleOptionSelect)
    window.removeEventListener('submitAnswer', handleSubmitAnswer)
  }
}

onMounted(() => {
  const cleanup = handleKeyboardEvents()
  onUnmounted(cleanup)
})
</script>
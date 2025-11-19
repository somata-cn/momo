<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- 遮罩层 -->
        <div 
          class="absolute inset-0 bg-black bg-opacity-50" 
          @click="closeSettings"
        ></div>
        
        <!-- 设置面板 -->
        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-bounce-in">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">设置</h3>
            <button 
              @click="closeSettings"
              class="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-6">
            <!-- 数据统计 -->
            <div class="bg-gray-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-700 mb-3">数据统计</h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div class="text-gray-500">总题数</div>
                  <div class="text-lg font-semibold text-gray-900">{{ totalQuestions }}</div>
                </div>
                <div>
                  <div class="text-gray-500">已答题</div>
                  <div class="text-lg font-semibold text-blue-600">{{ answeredQuestions }}</div>
                </div>
                <div>
                  <div class="text-gray-500">正确数</div>
                  <div class="text-lg font-semibold text-green-600">{{ correctAnswers }}</div>
                </div>
                <div>
                  <div class="text-gray-500">正确率</div>
                  <div class="text-lg font-semibold text-purple-600">{{ correctRate }}%</div>
                </div>
              </div>
            </div>

            <!-- 操作选项 -->
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-gray-700">操作选项</h4>
              
              <button 
                @click="showResetProgressConfirm = true"
                class="w-full flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <div class="text-left">
                    <div class="text-sm font-medium text-gray-900">重置学习进度</div>
                    <div class="text-xs text-gray-500">清除所有答题记录</div>
                  </div>
                </div>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button 
                @click="showClearDataConfirm = true"
                class="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <div class="flex items-center space-x-3">
                  <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <div class="text-left">
                    <div class="text-sm font-medium text-gray-900">清除所有数据</div>
                    <div class="text-xs text-gray-500">删除题目和答题记录</div>
                  </div>
                </div>
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <!-- 快捷键说明 -->
            <div class="bg-blue-50 rounded-lg p-4">
              <h4 class="text-sm font-medium text-blue-900 mb-3">快捷键</h4>
              <div class="space-y-2 text-xs text-blue-800">
                <div class="flex justify-between">
                  <span>数字键 1-9</span>
                  <span>选择选项</span>
                </div>
                <div class="flex justify-between">
                  <span>← →</span>
                  <span>切换题目</span>
                </div>
                <div class="flex justify-between">
                  <span>Enter</span>
                  <span>提交答案</span>
                </div>
                <div class="flex justify-between">
                  <span>Esc</span>
                  <span>关闭弹窗</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button @click="closeSettings" class="btn-secondary">
              关闭
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 重置进度确认对话框 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showResetProgressConfirm" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">重置学习进度</h3>
            <p class="text-sm text-gray-500 mb-6">
              此操作将清除所有答题记录，但会保留题目数据。是否继续？
            </p>
            <div class="flex space-x-3">
              <button @click="showResetProgressConfirm = false" class="flex-1 btn-secondary">
                取消
              </button>
              <button @click="resetProgress" class="flex-1 btn-primary">
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 清除数据确认对话框 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="showClearDataConfirm" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black bg-opacity-50"></div>
        <div class="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
          <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 mb-2">清除所有数据</h3>
            <p class="text-sm text-gray-500 mb-6">
              此操作将删除所有题目数据和答题记录，且无法恢复。是否继续？
            </p>
            <div class="flex space-x-3">
              <button @click="showClearDataConfirm = false" class="flex-1 btn-secondary">
                取消
              </button>
              <button @click="clearAllData" class="flex-1 btn-danger">
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuestionStore } from '../stores/question.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['close'])

const questionStore = useQuestionStore()

const showResetProgressConfirm = ref(false)
const showClearDataConfirm = ref(false)

const totalQuestions = computed(() => questionStore.totalQuestions)
const answeredQuestions = computed(() => questionStore.answeredQuestions)
const correctAnswers = computed(() => questionStore.correctAnswers)
const correctRate = computed(() => {
  if (answeredQuestions.value === 0) return 0
  return Math.round((correctAnswers.value / answeredQuestions.value) * 100)
})

function closeSettings() {
  emit('close')
}

function resetProgress() {
  questionStore.resetProgress()
  showResetProgressConfirm.value = false
  closeSettings()
}

function clearAllData() {
  questionStore.clearAllData()
  showClearDataConfirm.value = false
  closeSettings()
}
</script>
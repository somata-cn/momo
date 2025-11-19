<template>
  <div class="mb-6">
    <div class="card">
      <h2 class="text-xl font-semibold mb-4 text-gray-800">导入题目</h2>
      
      <!-- 导入选项 -->
      <div class="mb-4">
        <div class="flex items-center space-x-4">
          <label class="flex items-center space-x-2">
            <input 
              type="radio" 
              v-model="importMode" 
              value="replace" 
              class="text-blue-600 focus:ring-blue-500"
            >
            <span class="text-sm text-gray-700">覆盖导入（严格保持JSON文件顺序）</span>
          </label>
          <label class="flex items-center space-x-2">
            <input 
              type="radio" 
              v-model="importMode" 
              value="append" 
              class="text-blue-600 focus:ring-blue-500"
            >
            <span class="text-sm text-gray-700">追加导入（保留现有题目）</span>
          </label>
        </div>
      </div>
      
      <!-- 文件上传区域 -->
      <div 
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200"
        :class="{ 'border-blue-400 bg-blue-50': isDragOver }"
        @drop="handleDrop"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @dragenter.prevent
      >
        <div class="space-y-4">
          <div class="text-gray-600">
            <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>
          <div>
            <p class="text-lg text-gray-700">拖拽JSON文件到此处，或</p>
            <label class="btn-primary inline-block cursor-pointer">
              选择文件
              <input 
                type="file" 
                accept=".json" 
                class="hidden"
                @change="handleFileSelect"
                ref="fileInput"
              >
            </label>
          </div>
          <p class="text-sm text-gray-500">
            支持格式：JSON，文件大小不超过10MB
          </p>
        </div>
      </div>

      <!-- 状态提示 -->
      <div v-if="importStatus.message" class="mt-4">
        <div 
          class="p-4 rounded-lg flex items-center space-x-2"
          :class="{
            'bg-green-50 text-green-800 border border-green-200': importStatus.type === 'success',
            'bg-red-50 text-red-800 border border-red-200': importStatus.type === 'error'
          }"
        >
          <svg v-if="importStatus.type === 'success'" class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-if="importStatus.type === 'error'" class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span>{{ importStatus.message }}</span>
          <button 
            @click="clearImportStatus"
            class="ml-auto text-gray-400 hover:text-gray-600"
          >
            <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 示例格式 -->
      <div class="mt-6">
        <h3 class="text-sm font-medium text-gray-700 mb-2">JSON格式示例：</h3>
        <div class="bg-gray-100 rounded p-3 text-xs text-gray-600 overflow-x-auto">
          <pre>[{
  "section": "总论测试",
  "problem": "【单选题】新时代党的建设中居于首位的是(   )",
  "options": [
    "A、政治建设",
    "B、思想建设", 
    "C、组织建设",
    "D、作风建设"
  ],
  "answer": ["A"]
}]</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuestionStore } from '../stores/question.js'

const questionStore = useQuestionStore()
const fileInput = ref(null)
const isDragOver = ref(false)
const importMode = ref('replace') // 默认使用覆盖导入模式

const importStatus = computed(() => questionStore.importStatus)

const clearImportStatus = () => {
  questionStore.clearImportStatus()
}

const processFile = async (file) => {
  if (!file) return
  
  // 验证文件类型
  if (!file.name.toLowerCase().endsWith('.json')) {
    questionStore.importStatus = { type: 'error', message: '请选择JSON格式的文件' }
    return
  }
  
  // 验证文件大小（10MB限制）
  if (file.size > 10 * 1024 * 1024) {
    questionStore.importStatus = { type: 'error', message: '文件大小不能超过10MB' }
    return
  }
  
  try {
    const text = await file.text()
    const questions = JSON.parse(text)
    
    const success = questionStore.importQuestions(questions, importMode.value)
    if (success && fileInput.value) {
      fileInput.value.value = '' // 清空文件输入
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      questionStore.importStatus = { type: 'error', message: 'JSON格式错误，请检查文件内容' }
    } else {
      questionStore.importStatus = { type: 'error', message: error.message }
    }
  }
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  processFile(file)
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = event.dataTransfer.files
  if (files.length > 0) {
    processFile(files[0])
  }
}
</script>
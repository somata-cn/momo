import { onMounted, onUnmounted } from 'vue'
import { useQuestionStore } from '../stores/question.js'

export function useKeyboardShortcuts() {
  const questionStore = useQuestionStore()
  
  const handleKeyDown = (event) => {
    // 如果在输入框中，不处理快捷键
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return
    }
    
    // 数字键 1-9 选择选项
    if (event.key >= '1' && event.key <= '9') {
      event.preventDefault()
      const optionIndex = parseInt(event.key) - 1
      const currentQuestion = questionStore.currentQuestion
      
      if (currentQuestion && optionIndex < currentQuestion.options.length) {
        // 触发选项选择事件
        const event = new CustomEvent('optionSelect', { 
          detail: { optionIndex } 
        })
        window.dispatchEvent(event)
      }
    }
    
    // 左右方向键切换题目
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (questionStore.currentQuestionIndex > 0) {
        questionStore.setCurrentQuestion(questionStore.currentQuestionIndex - 1)
      }
    }
    
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      if (questionStore.currentQuestionIndex < questionStore.totalQuestions - 1) {
        questionStore.setCurrentQuestion(questionStore.currentQuestionIndex + 1)
      }
    }
    
    // Enter 键提交答案
    if (event.key === 'Enter') {
      event.preventDefault()
      console.log('Enter键被按下，触发submitAnswer事件')
      // 触发提交答案事件
      const submitEvent = new CustomEvent('submitAnswer')
      window.dispatchEvent(submitEvent)
    }
    
    // Esc 键关闭弹窗
    if (event.key === 'Escape') {
      event.preventDefault()
      if (questionStore.isSettingsOpen) {
        questionStore.isSettingsOpen = false
      }
    }
    
    // 快捷键帮助
    if (event.key === '?' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      // 触发显示帮助事件
      const helpEvent = new CustomEvent('showHelp')
      window.dispatchEvent(helpEvent)
    }
  }
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
  
  return {
    // 可以返回一些方法供组件使用
  }
}
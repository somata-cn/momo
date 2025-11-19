import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useQuestionStore = defineStore('question', () => {
  // 状态
  const questions = ref([])
  const currentQuestionIndex = ref(0)
  const userAnswers = ref({})
  const questionResults = ref({})
  const isSettingsOpen = ref(false)
  const importStatus = ref({ type: '', message: '' })
  
  // 新增状态
  const trainingMode = ref('normal') // normal, wrong_only, memorize

  // 计算属性
  const currentQuestion = computed(() => {
    const actualIndex = getActualQuestionIndex(currentQuestionIndex.value)
    return questions.value[actualIndex] || null
  })
  
  // 获取实际题目索引
  function getActualQuestionIndex(displayIndex) {
    return displayIndex
  }
  
  const sections = computed(() => {
    const sectionMap = {}
    questions.value.forEach((question, index) => {
      if (!sectionMap[question.section]) {
        sectionMap[question.section] = []
      }
      sectionMap[question.section].push({
        ...question,
        index,
        status: getQuestionStatus(index)
      })
    })
    return sectionMap
  })

  const totalQuestions = computed(() => questions.value.length)
  const answeredQuestions = computed(() => Object.keys(userAnswers.value).length)
  const correctAnswers = computed(() => {
    return Object.values(questionResults.value).filter(result => result.isCorrect).length
  })
  
  const availableQuestions = computed(() => {
    return Array.from({ length: questions.value.length }, (_, i) => i)
  })
  
  const availableQuestionCount = computed(() => availableQuestions.value.length)

  // 题目类型判断
  const currentQuestionType = computed(() => {
    if (!currentQuestion.value || !currentQuestion.value.answer) return 'single'
    return currentQuestion.value.answer.length > 1 ? 'multiple' : 'single'
  })

  // 方法
  function getQuestionStatus(index) {
    if (!userAnswers.value[index]) return 'unanswered'
    return questionResults.value[index]?.isCorrect ? 'correct' : 'incorrect'
  }

  function loadQuestionsFromStorage() {
    try {
      const stored = localStorage.getItem('studyQuestions')
      const storedAnswers = localStorage.getItem('userAnswers')
      const storedResults = localStorage.getItem('questionResults')
      const storedTrainingMode = localStorage.getItem('trainingMode')
      const dataVersion = localStorage.getItem('dataVersion')
      
      // 数据版本控制
      if (dataVersion && dataVersion !== '1.0') {
        console.warn('数据版本不匹配，可能需要迁移')
      }
      
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          questions.value = parsed
        } else {
          console.warn('题目数据格式无效')
        }
      }
      if (storedAnswers) {
        const parsed = JSON.parse(storedAnswers)
        if (typeof parsed === 'object' && parsed !== null) {
          userAnswers.value = parsed
        } else {
          console.warn('答题数据格式无效')
        }
      }
      if (storedResults) {
        const parsed = JSON.parse(storedResults)
        if (typeof parsed === 'object' && parsed !== null) {
          questionResults.value = parsed
        } else {
          console.warn('结果数据格式无效')
        }
      }
      if (storedTrainingMode) {
        if (['normal', 'memorize'].includes(storedTrainingMode)) {
          trainingMode.value = storedTrainingMode
        } else {
          console.warn('训练模式数据无效，重置为normal')
          trainingMode.value = 'normal'
        }
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      importStatus.value = { type: 'error', message: '加载本地数据失败，数据可能已损坏' }
      // 尝试清理损坏的数据
      try {
        localStorage.removeItem('studyQuestions')
        localStorage.removeItem('userAnswers')
        localStorage.removeItem('questionResults')
        localStorage.removeItem('trainingMode')
      } catch (cleanupError) {
        console.error('清理损坏数据失败:', cleanupError)
      }
    }
  }

  function saveQuestionsToStorage() {
    try {
      // 添加数据版本控制
      localStorage.setItem('dataVersion', '1.0')
      localStorage.setItem('studyQuestions', JSON.stringify(questions.value))
      localStorage.setItem('userAnswers', JSON.stringify(userAnswers.value))
      localStorage.setItem('questionResults', JSON.stringify(questionResults.value))
      localStorage.setItem('trainingMode', trainingMode.value)
    } catch (error) {
      console.error('保存数据失败:', error)
      if (error.name === 'QuotaExceededError') {
        importStatus.value = { type: 'error', message: '存储空间不足，请清理部分数据' }
      } else {
        importStatus.value = { type: 'error', message: '保存数据失败' }
      }
    }
  }

  function importQuestions(newQuestions, mode = 'replace') {
    try {
      // 验证题目格式
      if (!Array.isArray(newQuestions)) {
        throw new Error('题目数据必须是数组格式')
      }
      
      // 性能监控：大量数据导入警告
      if (newQuestions.length > 1000) {
        console.warn(`导入大量题目 (${newQuestions.length} 题)，可能影响性能`)
      }

      // 验证每个题目的结构
      newQuestions.forEach((question, index) => {
        if (!question.section || !question.problem || !question.options || !question.answer) {
          throw new Error(`第 ${index + 1} 题缺少必要字段`)
        }
        if (!Array.isArray(question.options) || !Array.isArray(question.answer)) {
          throw new Error(`第 ${index + 1} 题选项或答案格式错误`)
        }
      })

      if (mode === 'replace') {
        // 覆盖导入：严格保持JSON文件中的原始顺序，直接替换现有题目
        questions.value = newQuestions
        importStatus.value = { 
          type: 'success', 
          message: `成功导入 ${newQuestions.length} 道题目，严格按照原始顺序导入` 
        }
      } else if (mode === 'append') {
        // 追加导入：在现有题目基础上追加新题目
        const existingQuestions = questions.value
        const mergedQuestions = [...existingQuestions]
        
        newQuestions.forEach(newQuestion => {
          const exists = existingQuestions.some(q => 
            q.problem === newQuestion.problem && q.section === newQuestion.section
          )
          if (!exists) {
            mergedQuestions.push(newQuestion)
          }
        })

        questions.value = mergedQuestions
        const addedCount = mergedQuestions.length - existingQuestions.length
        importStatus.value = { 
          type: 'success', 
          message: `成功追加 ${addedCount} 道新题目，总计 ${mergedQuestions.length} 道题` 
        }
      }

      saveQuestionsToStorage()
      return true
    } catch (error) {
      importStatus.value = { type: 'error', message: error.message }
      return false
    }
  }

  function setCurrentQuestion(index) {
    const available = availableQuestions.value
    if (index >= 0 && index < available.length) {
      currentQuestionIndex.value = index
    }
  }

  function submitAnswer(answer) {
    if (!currentQuestion.value) return false
    
    const question = currentQuestion.value
    const userAnswer = Array.isArray(answer) ? answer : [answer]
    
    // 保存用户答案
    userAnswers.value[currentQuestionIndex.value] = userAnswer
    
    // 判断答案是否正确
    const correctAnswer = question.answer
    const isCorrect = userAnswer.length === correctAnswer.length && 
                     userAnswer.every(ans => correctAnswer.includes(ans))
    
    // 保存结果
    questionResults.value[currentQuestionIndex.value] = {
      userAnswer,
      correctAnswer,
      isCorrect,
      submittedAt: new Date().toISOString()
    }
    
    saveQuestionsToStorage()
    return isCorrect
  }

  function clearAllData() {
    questions.value = []
    currentQuestionIndex.value = 0
    userAnswers.value = {}
    questionResults.value = {}
    localStorage.removeItem('studyQuestions')
    localStorage.removeItem('userAnswers')
    localStorage.removeItem('questionResults')
  }

  function resetProgress() {
    userAnswers.value = {}
    questionResults.value = {}
    currentQuestionIndex.value = 0
    saveQuestionsToStorage()
  }

  function clearImportStatus() {
    importStatus.value = { type: '', message: '' }
  }
  
  // 重新打乱题目
  function shuffleQuestions() {
    const indices = Array.from({ length: questions.value.length }, (_, i) => i)
    
    // Fisher-Yates 洗牌算法
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    
    // 根据打乱后的顺序重新排列题目
    const shuffledQuestions = indices.map(index => questions.value[index]).filter(Boolean)
    questions.value = shuffledQuestions
    currentQuestionIndex.value = 0
    saveQuestionsToStorage()
  }
  
  // 设置训练模式
  function setTrainingMode(mode) {
    trainingMode.value = mode
    currentQuestionIndex.value = 0
    // 确保模式切换时清理相关状态
    importStatus.value = { type: '', message: '' }
    saveQuestionsToStorage()
  }
  
  // 获取错题统计
  function getWrongQuestionStats() {
    const wrongQuestions = Object.entries(questionResults.value)
      .filter(([index, result]) => !result.isCorrect)
      .map(([index, result]) => {
        const question = questions.value[parseInt(index)]
        return {
          index: parseInt(index),
          section: question?.section || '未知分类',
          problem: question?.problem || '未知题目',
          userAnswer: result.userAnswer,
          correctAnswer: result.correctAnswer,
          submittedAt: result.submittedAt
        }
      })
    
    // 按分类统计
    const sectionStats = {}
    wrongQuestions.forEach(q => {
      if (!sectionStats[q.section]) {
        sectionStats[q.section] = 0
      }
      sectionStats[q.section]++
    })
    
    return {
      total: wrongQuestions.length,
      questions: wrongQuestions,
      sectionStats
    }
  }

  // 初始化时加载数据
  loadQuestionsFromStorage()

  return {
    // 状态
    questions,
    currentQuestionIndex,
    currentQuestion,
    userAnswers,
    questionResults,
    isSettingsOpen,
    importStatus,
    trainingMode,
    
    // 计算属性
    sections,
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    availableQuestions,
    availableQuestionCount,
    currentQuestionType,
    
    // 方法
    importQuestions,
    setCurrentQuestion,
    submitAnswer,
    clearAllData,
    resetProgress,
    clearImportStatus,
    getQuestionStatus,
    shuffleQuestions,
    setTrainingMode,
    getWrongQuestionStats,
    getActualQuestionIndex
  }
})
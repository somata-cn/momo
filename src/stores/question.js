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
  
  // 错题模式专用状态
  const wrongUserAnswers = ref({})
  const wrongQuestionResults = ref({})

  // 计算属性
  const currentQuestion = computed(() => {
    if (trainingMode.value === 'wrong_only') {
      // 错题模式下，检查是否有可用题目
      if (availableQuestions.value.length === 0) {
        return null
      }
    }
    const actualIndex = getActualQuestionIndex(currentQuestionIndex.value)
    return questions.value[actualIndex] || null
  })
  
  // 获取实际题目索引
  function getActualQuestionIndex(displayIndex) {
    if (trainingMode.value === 'wrong_only') {
      // 错题模式下，使用availableQuestions中的索引
      return availableQuestions.value[displayIndex] ?? 0
    }
    return displayIndex
  }
  
  const sections = computed(() => {
    const sectionMap = {}
    // 访问所有相关的状态变量，确保它们成为计算属性的依赖项
    const currentMode = trainingMode.value
    const userAnswersValue = userAnswers.value
    const questionResultsValue = questionResults.value
    const wrongUserAnswersValue = wrongUserAnswers.value
    const wrongQuestionResultsValue = wrongQuestionResults.value
    
    questions.value.forEach((question, index) => {
      if (!sectionMap[question.section]) {
        sectionMap[question.section] = []
      }
      
      // 直接在计算属性中计算状态，确保所有依赖项都被正确跟踪
      let status = 'unanswered'
      if (currentMode === 'wrong_only') {
        if (wrongUserAnswersValue[index]) {
          status = wrongQuestionResultsValue[index]?.isCorrect ? 'correct' : 'incorrect'
        }
      } else {
        if (userAnswersValue[index]) {
          status = questionResultsValue[index]?.isCorrect ? 'correct' : 'incorrect'
        }
      }
      
      sectionMap[question.section].push({
        ...question,
        index,
        status
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
    // 明确访问trainingMode，确保它成为计算属性的依赖项
    const currentMode = trainingMode.value
    if (currentMode === 'wrong_only') {
      // 只返回错题索引
      return questions.value
        .map((_, index) => index)
        .filter(index => {
          // 使用questionResults来获取原始错题，而不是wrongQuestionResults
          const result = questionResults.value[index]
          return result && !result.isCorrect
        })
    }
    // 正常模式和背题模式返回所有题目索引
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
    if (trainingMode.value === 'wrong_only') {
      // 错题模式下，使用错题专用状态
      if (!wrongUserAnswers.value[index]) return 'unanswered'
      return wrongQuestionResults.value[index]?.isCorrect ? 'correct' : 'incorrect'
    } else {
      // 正常模式下，使用普通状态
      if (!userAnswers.value[index]) return 'unanswered'
      return questionResults.value[index]?.isCorrect ? 'correct' : 'incorrect'
    }
  }

  function loadQuestionsFromStorage() {
    try {
      const stored = localStorage.getItem('studyQuestions')
      const storedAnswers = localStorage.getItem('userAnswers')
      const storedResults = localStorage.getItem('questionResults')
      const storedTrainingMode = localStorage.getItem('trainingMode')
      const dataVersion = localStorage.getItem('dataVersion')
      
      // 错题模式数据
      const storedWrongAnswers = localStorage.getItem('wrongUserAnswers')
      const storedWrongResults = localStorage.getItem('wrongQuestionResults')
      
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
        if (['normal', 'memorize', 'wrong_only'].includes(storedTrainingMode)) {
          trainingMode.value = storedTrainingMode
        } else {
          console.warn('训练模式数据无效，重置为normal')
          trainingMode.value = 'normal'
        }
      }
      
      // 加载错题模式数据
      if (storedWrongAnswers) {
        const parsed = JSON.parse(storedWrongAnswers)
        if (typeof parsed === 'object' && parsed !== null) {
          wrongUserAnswers.value = parsed
        } else {
          console.warn('错题模式答题数据格式无效')
        }
      }
      if (storedWrongResults) {
        const parsed = JSON.parse(storedWrongResults)
        if (typeof parsed === 'object' && parsed !== null) {
          wrongQuestionResults.value = parsed
        } else {
          console.warn('错题模式结果数据格式无效')
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
        localStorage.removeItem('wrongUserAnswers')
        localStorage.removeItem('wrongQuestionResults')
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
    const actualIndex = getActualQuestionIndex(currentQuestionIndex.value)
    
    // 判断答案是否正确
    const correctAnswer = question.answer
    const isCorrect = userAnswer.length === correctAnswer.length && 
                     userAnswer.every(ans => correctAnswer.includes(ans))
    
    // 保存结果
    if (trainingMode.value === 'wrong_only') {
      // 错题模式下，使用错题专用状态
      wrongUserAnswers.value[actualIndex] = userAnswer
      
      wrongQuestionResults.value[actualIndex] = {
        userAnswer,
        correctAnswer,
        isCorrect,
        submittedAt: new Date().toISOString()
      }
    } else {
      // 正常模式下，使用普通状态
      userAnswers.value[actualIndex] = userAnswer
      
      questionResults.value[actualIndex] = {
        userAnswer,
        correctAnswer,
        isCorrect,
        submittedAt: new Date().toISOString()
      }
    }
    
    saveQuestionsToStorage()
    return isCorrect
  }

  function clearAllData() {
    questions.value = []
    currentQuestionIndex.value = 0
    userAnswers.value = {}
    questionResults.value = {}
    wrongUserAnswers.value = {}
    wrongQuestionResults.value = {}
    localStorage.removeItem('studyQuestions')
    localStorage.removeItem('userAnswers')
    localStorage.removeItem('questionResults')
    localStorage.removeItem('wrongUserAnswers')
    localStorage.removeItem('wrongQuestionResults')
  }

  function resetProgress() {
    userAnswers.value = {}
    questionResults.value = {}
    currentQuestionIndex.value = 0
    saveQuestionsToStorage()
  }
  
  // 合并错题答题情况到正常模式
  function mergeWrongAnswers() {
    // 将错题模式的答题情况合并到正常模式
    Object.assign(userAnswers.value, wrongUserAnswers.value)
    Object.assign(questionResults.value, wrongQuestionResults.value)
    
    // 清空错题模式的答题情况
    wrongUserAnswers.value = {}
    wrongQuestionResults.value = {}
    
    saveQuestionsToStorage()
    return true
  }

  function clearImportStatus() {
    importStatus.value = { type: '', message: '' }
  }
  
  // 重新打乱题目
  function shuffleQuestions() {
    // 保存原始数据
    const originalQuestions = [...questions.value]
    const originalUserAnswers = { ...userAnswers.value }
    const originalQuestionResults = { ...questionResults.value }
    const originalWrongUserAnswers = { ...wrongUserAnswers.value }
    const originalWrongQuestionResults = { ...wrongQuestionResults.value }
    
    const indices = Array.from({ length: questions.value.length }, (_, i) => i)
    
    // Fisher-Yates 洗牌算法
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    
    // 根据打乱后的顺序重新排列题目
    const shuffledQuestions = indices.map(index => questions.value[index]).filter(Boolean)
    questions.value = shuffledQuestions
    
    // 重新索引答题记录
    const newUserAnswers = {}
    const newQuestionResults = {}
    const newWrongUserAnswers = {}
    const newWrongQuestionResults = {}
    
    indices.forEach((originalIndex, newIndex) => {
      // 更新正常模式的答题记录
      if (originalUserAnswers[originalIndex]) {
        newUserAnswers[newIndex] = originalUserAnswers[originalIndex]
      }
      if (originalQuestionResults[originalIndex]) {
        newQuestionResults[newIndex] = originalQuestionResults[originalIndex]
      }
      
      // 更新错题模式的答题记录
      if (originalWrongUserAnswers[originalIndex]) {
        newWrongUserAnswers[newIndex] = originalWrongUserAnswers[originalIndex]
      }
      if (originalWrongQuestionResults[originalIndex]) {
        newWrongQuestionResults[newIndex] = originalWrongQuestionResults[originalIndex]
      }
    })
    
    // 更新状态
    userAnswers.value = newUserAnswers
    questionResults.value = newQuestionResults
    wrongUserAnswers.value = newWrongUserAnswers
    wrongQuestionResults.value = newWrongQuestionResults
    
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
    
    // 错题模式专用状态
    wrongUserAnswers,
    wrongQuestionResults,
    
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
    getActualQuestionIndex,
    mergeWrongAnswers
  }
})
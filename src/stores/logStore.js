import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useTagStore } from './tagStore'
import { useUserStore } from './userStore'
import { saveData } from '@/services/api'

function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export const useLogStore = defineStore('log', () => {
  const attendanceLogs = ref({})
  const currentPage = ref(1)
  const itemsPerPage = ref(10)
  const hasUnsavedChanges = ref(false) // ✨ 미저장 변경 사항 추적

  // ✨ 실시간 근무 기록 관련 상태
  const isTracking = ref(false)
  const trackingStartTime = ref(null)
  const isResting = ref(false)
  const restStartTime = ref(null)
  const accumulatedRestMinutes = ref(0)
  const liveLogId = ref(null) // 현재 실시간 추적 중인 로그의 ID
  const liveTagId = ref(null) // 현재 실시간 추적 중인 로그의 tagId

  // ✨ 로컬 스토리지에 상태 저장
  const saveStateToLocalStorage = () => {
    const state = {
      isTracking: isTracking.value,
      trackingStartTime: trackingStartTime.value ? trackingStartTime.value.toISOString() : null,
      isResting: isResting.value,
      restStartTime: restStartTime.value ? restStartTime.value.toISOString() : null,
      accumulatedRestMinutes: accumulatedRestMinutes.value,
      liveLogId: liveLogId.value,
      liveTagId: liveTagId.value,
    }
    localStorage.setItem('logStoreLiveTrackingState', JSON.stringify(state))
  }

  // ✨ 로컬 스토리지에서 상태 불러오기
  const loadStateFromLocalStorage = () => {
    const savedState = localStorage.getItem('logStoreLiveTrackingState')
    if (savedState) {
      const state = JSON.parse(savedState)
      isTracking.value = state.isTracking
      trackingStartTime.value = state.trackingStartTime ? new Date(state.trackingStartTime) : null
      isResting.value = state.isResting
      restStartTime.value = state.restStartTime ? new Date(state.restStartTime) : null
      accumulatedRestMinutes.value = state.accumulatedRestMinutes
      liveLogId.value = state.liveLogId || null
      liveTagId.value = state.liveTagId || null
    }
  }

  // 초기 로드 시 상태 불러오기
  loadStateFromLocalStorage()

  // 상태 변경 감지 및 저장
  const debouncedSaveState = debounce(saveStateToLocalStorage, 200)
  watch([isTracking, trackingStartTime, isResting, restStartTime, accumulatedRestMinutes], () => {
    debouncedSaveState()
  }, { deep: true })

  const goToPage = (pageNumber) => {
    currentPage.value = pageNumber
  }

  // ✨ 실시간 근무 기록 액션
  const startTracking = (tagId) => {
    if (isTracking.value) return
    isTracking.value = true
    trackingStartTime.value = new Date()
    isResting.value = false
    restStartTime.value = null
    accumulatedRestMinutes.value = 0
    // 현재 날짜의 로그에 추가할 임시 로그 데이터 (저장 시 업데이트)
    const today = new Date().toISOString().slice(0, 10)
    if (!attendanceLogs.value[today]) {
      attendanceLogs.value[today] = []
    }
    const newLogId = Date.now()
    attendanceLogs.value[today].push({
      id: newLogId,
      date: today,
      start: trackingStartTime.value.toTimeString().slice(0, 5),
      end: '',
      tagId: tagId,
      restMinutes: 0,
      expenses: 0,
      workedHours: 0,
      dailyWage: 0,
      modifiedAt: new Date().toISOString(),
      isLive: true, // 실시간 기록임을 표시
    })
    liveLogId.value = newLogId
    liveTagId.value = tagId
  }

  const startRest = () => {
    if (!isTracking.value || isResting.value) return
    isResting.value = true
    restStartTime.value = new Date()
  }

  const endRest = () => {
    if (!isTracking.value || !isResting.value) return
    isResting.value = false
    if (restStartTime.value) {
      const restDuration = (new Date().getTime() - restStartTime.value.getTime()) / (1000 * 60)
      accumulatedRestMinutes.value += restDuration
      restStartTime.value = null
    }
  }

  const endTracking = async () => {
    if (!isTracking.value) return { success: false, message: 'Tracking not started.' }

    // 휴식 중이었다면 휴식 종료 처리
    if (isResting.value) {
      endRest()
    }

    const endTime = new Date()
    const today = endTime.toISOString().slice(0, 10)

    // 실시간 기록 중인 로그를 찾아서 업데이트
    const liveLogIndex = attendanceLogs.value[today]?.findIndex(log => log.isLive)

    if (liveLogIndex > -1) {
      const liveLog = attendanceLogs.value[today][liveLogIndex]
      liveLog.end = endTime.toTimeString().slice(0, 5)
      liveLog.restMinutes = Math.round(accumulatedRestMinutes.value)
      liveLog.isLive = false

      // 근무 시간 및 일급 재계산
      const tagStore = useTagStore()
      const { totalWage, totalHours } = await tagStore.calculateWage(
        liveLog.date,
        liveLog.start,
        liveLog.end,
        liveLog.tagId,
        liveLog.restMinutes,
      )
      liveLog.workedHours = totalHours
      liveLog.dailyWage = totalWage
      liveLog.modifiedAt = new Date().toISOString()
    }

    isTracking.value = false
    trackingStartTime.value = null
    isResting.value = false
    restStartTime.value = null
    accumulatedRestMinutes.value = 0
    liveLogId.value = null
    liveTagId.value = null

    return await saveDataToServer()
  }

  const deleteLog = (logId, date) => {
    if (!date || !attendanceLogs.value[date]) return

    attendanceLogs.value[date] = attendanceLogs.value[date].filter((log) => log.id !== logId)

    if (attendanceLogs.value[date].length === 0) {
      delete attendanceLogs.value[date]
    }
  }

  const saveLog = async (logData) => {
    const tagStore = useTagStore()
    const { totalWage, totalHours } = await tagStore.calculateWage(
      logData.date,
      logData.start,
      logData.end,
      logData.tagId,
      logData.restMinutes,
    )
    const newLogData = {
      ...logData,
      workedHours: totalHours,
      dailyWage: totalWage,
      modifiedAt: new Date().toISOString(),
    }

    const oldLog = logData.id ? allLogsSorted.value.find((log) => log.id === logData.id) : null

    if (oldLog && oldLog.date !== newLogData.date) {
      const oldDateLogs = attendanceLogs.value[oldLog.date]
      if (oldDateLogs) {
        attendanceLogs.value[oldLog.date] = oldDateLogs.filter((log) => log.id !== oldLog.id)
        if (attendanceLogs.value[oldLog.date].length === 0) {
          delete attendanceLogs.value[oldLog.date]
        }
      }
    }

    const targetDate = newLogData.date
    if (!attendanceLogs.value[targetDate]) {
      attendanceLogs.value[targetDate] = []
    }

    const targetDateLogs = attendanceLogs.value[targetDate]
    const existingLogIndexInNewDate = targetDateLogs.findIndex((log) => log.id === newLogData.id)

    if (existingLogIndexInNewDate > -1) {
      targetDateLogs[existingLogIndexInNewDate] = newLogData
    } else {
      if (!newLogData.id) {
        newLogData.id = Date.now()
      }
      targetDateLogs.push(newLogData)
    }
    hasUnsavedChanges.value = true // ✨ 변경 사항 발생 시 true로 설정
  }

  const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return allLogsSorted.value.slice(start, end)
  })

  const totalPages = computed(() => {
    return Math.ceil(allLogsSorted.value.length / itemsPerPage.value)
  })

  const allLogsSorted = computed(() => {
    const flatLogs = Object.values(attendanceLogs.value).flat()
    return flatLogs.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
  })

  const weeklyExpenses = computed(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today.setDate(today.getDate() - dayOfWeek))
    const datesOfWeek = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      datesOfWeek.push(date.toISOString().slice(0, 10))
    }
    return allLogsSorted.value
      .filter((log) => datesOfWeek.includes(log.date))
      .reduce((total, log) => total + (log.expenses || 0), 0)
  })

  const monthlyExpenses = computed(() => {
    const now = new Date()
    const targetMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return allLogsSorted.value
      .filter((log) => log.date.startsWith(targetMonthStr))
      .reduce((total, log) => total + (log.expenses || 0), 0)
  })

  const netWeeklyWage = computed(() => weeklyWage.value - weeklyExpenses.value)
  const netMonthlyWage = computed(() => monthlyWage.value - monthlyExpenses.value)

  const getLogsByDate = computed(() => (dateStr) => attendanceLogs.value[dateStr] || [])

  const monthlyWage = computed(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const targetMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    return allLogsSorted.value
      .filter((log) => log.date.startsWith(targetMonthStr))
      .reduce((total, log) => total + log.dailyWage, 0)
  })

  const weeklyWage = computed(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today.setDate(today.getDate() - dayOfWeek))
    const datesOfWeek = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      datesOfWeek.push(date.toISOString().slice(0, 10))
    }
    return allLogsSorted.value
      .filter((log) => datesOfWeek.includes(log.date))
      .reduce((total, log) => total + log.dailyWage, 0)
  })

  const saveDataToServer = async () => {
    const userStore = useUserStore()
    const tagStore = useTagStore()
    if (!userStore.currentUser) {
      console.error('No user logged in, cannot save data.')
      return { success: false, message: '로그인된 사용자가 없습니다.' }
    }

    const dataToSave = {
      logs: attendanceLogs.value,
      tags: tagStore.tags,
    }

    try {
      await saveData(userStore.currentUser, dataToSave)
      hasUnsavedChanges.value = false // ✨ 성공적으로 저장되면 false로 설정
      return { success: true, message: '데이터가 성공적으로 저장되었습니다.' }
    } catch (error) {
      console.error('Failed to save data to server:', error)
      return { success: false, message: `데이터 저장 실패: ${error.message}` }
    }
  }

  const normalizeLogData = (logsArray) => {
    return logsArray.reduce((acc, log) => {
      const date = log.date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(log)
      return acc
    }, {})
  }

  // watch(
  //   () => attendanceLogs.value,
  //   () => {
  //     debouncedSave()
  //   },
  //   { deep: true },
  // )

  return {
    attendanceLogs,
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedLogs,
    goToPage,
    deleteLog,
    saveLog,
    getLogsByDate,
    monthlyWage,
    weeklyWage,
    weeklyExpenses,
    monthlyExpenses,
    netWeeklyWage,
    netMonthlyWage,
    allLogsSorted,
    normalizeLogData,
    saveDataToServer,

    // ✨ 실시간 근무 기록 관련 내보내기
    isTracking,
    trackingStartTime,
    isResting,
    restStartTime,
    accumulatedRestMinutes,
    liveLogId,
    liveTagId,
    startTracking,
    startRest,
    endRest,
    endTracking,
    hasUnsavedChanges, // ✨ 내보내기
  }
})

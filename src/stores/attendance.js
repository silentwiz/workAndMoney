import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export const useAttendanceStore = defineStore('attendance', () => {
  // --- State ---
  const currentUser = ref(null)
  const attendanceLogs = ref([])
  const tags = ref([])
  const viewedDate = ref(new Date())

  // --- Actions ---

  const deleteLog = (logId) => {
    const index = attendanceLogs.value.findIndex((log) => log.id === logId)
    if (index > -1) {
      attendanceLogs.value.splice(index, 1)
    }
  }

  const importUserData = (jsonData) => {
    if (!currentUser.value) {
      alert('먼저 사용자를 선택해주세요.')
      return false
    }
    try {
      const userData = JSON.parse(jsonData)
      if (userData.username && userData.username !== currentUser.value) {
        if (
          !confirm(
            `JSON 파일의 사용자는 '${userData.username}'입니다. 현재 사용자 '${currentUser.value}'의 데이터를 덮어쓰시겠습니까?`,
          )
        ) {
          return false
        }
      }
      // 불러온 데이터로 교체 (rate, settings는 tags에 포함되어 있음)
      attendanceLogs.value = userData.logs || []
      tags.value = userData.tags || []
      alert('데이터를 성공적으로 불러왔습니다.')
      return true
    } catch (error) {
      alert('유효하지 않은 JSON 파일입니다.')
      console.error('JSON 파싱 에러:', error)
      return false
    }
  }

  const exportUserData = () => {
    if (!currentUser.value) {
      alert('사용자가 선택되지 않았습니다.')
      return
    }
    // rate, settings 정보가 포함된 tags 배열을 내보냄
    const userData = {
      username: currentUser.value,
      logs: attendanceLogs.value,
      tags: tags.value,
    }
    const jsonString = JSON.stringify(userData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentUser.value}_attendance_data.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const setViewedDate = (date) => {
    viewedDate.value = date
  }

  const loadUser = (username) => {
    currentUser.value = username
    // rate, settings는 tags에 포함되어 있으므로 관련 로직 삭제
    attendanceLogs.value = JSON.parse(localStorage.getItem(`${username}_logs`)) || []
    tags.value = JSON.parse(localStorage.getItem(`${username}_tags`)) || []
  }

  const logout = () => {
    currentUser.value = null
    attendanceLogs.value = []
    tags.value = []
  }

  const addTag = (tagData) => {
    const newTag = {
      id: Date.now(),
      name: tagData.name,
      color: tagData.color,
      baseRate: Number(tagData.baseRate) || 0,
      nightRate: Number(tagData.nightRate) || 0,
      weekendRate: Number(tagData.weekendRate) || 0,
    }
    tags.value.push(newTag)
  }

  const updateTag = (updatedTag) => {
    const index = tags.value.findIndex((tag) => tag.id === updatedTag.id)
    if (index > -1) {
      tags.value[index] = { ...tags.value[index], ...updatedTag }
    }
  }

  const calculateWage = (start, end, tagId) => {
    const tag = tags.value.find((t) => t.id === tagId)
    if (!tag) return { totalWage: 0, totalHours: 0 }

    const startDate = new Date(start)
    const endDate = new Date(end)
    let totalMinutes = (endDate - startDate) / (1000 * 60)
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60 // 다음날 퇴근 처리
    }

    const totalHours = totalMinutes / 60
    let totalWage = 0
    let currentMinute = new Date(startDate)

    // 1분 단위로 순회하며 급여 계산
    for (let i = 0; i < totalMinutes; i++) {
      const dayOfWeek = currentMinute.getDay() // 현재 분의 요일 (0:일, 6:토)
      const hour = currentMinute.getHours() // 현재 분의 시간 (0-23)

      let applicableRate = tag.baseRate // 기본 시급으로 시작

      // 1. 주말 할증 확인 (최우선 적용)
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        applicableRate = tag.weekendRate
      }
      // 2. 야간 할증 확인 (주말이 아닐 경우 적용)
      else if (hour >= 22 || hour < 6) {
        applicableRate = tag.nightRate
      }

      // 분당 급여를 계산하여 총 급여에 더함
      totalWage += applicableRate / 60

      // 다음 1분으로 시간 이동
      currentMinute.setMinutes(currentMinute.getMinutes() + 1)
    }

    return { totalWage, totalHours }
  }
  const saveLog = (logData) => {
    const existingLogIndex = logData.id
      ? attendanceLogs.value.findIndex((log) => log.id === logData.id)
      : -1
    const date = logData.date
    const fullStartTime = `${date}T${logData.start}`
    const fullEndTime = `${date}T${logData.end}`
    const { totalWage, totalHours } = calculateWage(fullStartTime, fullEndTime, logData.tagId)
    const newLogData = { ...logData, workedHours: totalHours, dailyWage: totalWage }

    if (existingLogIndex > -1) {
      attendanceLogs.value[existingLogIndex] = newLogData
    } else {
      newLogData.id = Date.now()
      attendanceLogs.value.unshift(newLogData)
    }
  }

  // --- Getters / Computed ---
  const getLogsByDate = computed(
    () => (dateStr) => attendanceLogs.value.filter((log) => log.date === dateStr),
  )
  const getTagById = computed(() => (tagId) => tags.value.find((t) => t.id === tagId))
  const monthlyWage = computed(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const targetMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    return attendanceLogs.value
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
    return attendanceLogs.value
      .filter((log) => datesOfWeek.includes(log.date))
      .reduce((total, log) => total + log.dailyWage, 0)
  })
  const viewedMonthWage = computed(() => {
    const year = viewedDate.value.getFullYear()
    const month = viewedDate.value.getMonth() + 1
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`
    return attendanceLogs.value
      .filter((log) => log.date.startsWith(targetMonthStr))
      .reduce((total, log) => total + log.dailyWage, 0)
  })

  // --- Watch ---
  watch(
    () => ({
      logs: attendanceLogs.value,
      tags: tags.value, // rate, settings 삭제
    }),
    (state) => {
      if (currentUser.value) {
        localStorage.setItem(`${currentUser.value}_logs`, JSON.stringify(state.logs))
        localStorage.setItem(`${currentUser.value}_tags`, JSON.stringify(state.tags)) // rate, settings 저장 로직 삭제
      }
    },
    { deep: true },
  )

  // --- Return ---
  return {
    currentUser,
    loadUser,
    logout,
    attendanceLogs,
    tags,
    viewedDate,
    addTag,
    updateTag,
    saveLog,
    deleteLog,
    setViewedDate,
    calculateWage,
    getTagById,
    getLogsByDate,
    monthlyWage,
    weeklyWage,
    viewedMonthWage,
    exportUserData,
    importUserData,
  }
})

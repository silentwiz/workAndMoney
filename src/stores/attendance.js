import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export const useAttendanceStore = defineStore('attendance', () => {
  // --- State ---
  const currentUser = ref(null)
  const attendanceLogs = ref([])
  const hourlyRate = ref(1000)
  const tags = ref([])
  const bonusSettings = ref({
    isWeekendEnabled: true,
    weekendRate: 1.5,
    isNightEnabled: true,
    nightRate: 1.5,
    nightStart: 22,
    nightEnd: 6,
  })
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

      // 사용자가 일치하는지 확인 (선택사항이지만, 안전성을 높여줌)
      if (userData.username && userData.username !== currentUser.value) {
        if (
          !confirm(
            `JSON 파일의 사용자는 '${userData.username}'입니다. 현재 사용자 '${currentUser.value}'의 데이터를 덮어쓰시겠습니까?`,
          )
        ) {
          return false
        }
      }

      // 스토어 상태를 불러온 데이터로 교체
      attendanceLogs.value = userData.logs || []
      hourlyRate.value = userData.rate || 10000
      tags.value = userData.tags || []
      bonusSettings.value =
        userData.settings ||
        {
          /* 기본 설정값 */
        }

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

    // 1. 현재 사용자의 모든 데이터를 하나의 객체로 모읍니다.
    const userData = {
      username: currentUser.value,
      logs: attendanceLogs.value,
      rate: hourlyRate.value,
      tags: tags.value,
      settings: bonusSettings.value,
    }

    // 2. 객체를 예쁘게 포맷된 JSON 문자열로 변환합니다.
    const jsonString = JSON.stringify(userData, null, 2)

    // 3. JSON 문자열을 파일 형태로 만듭니다. (Blob)
    const blob = new Blob([jsonString], { type: 'application/json' })

    // 4. 파일을 다운로드할 수 있는 임시 URL을 생성합니다.
    const url = URL.createObjectURL(blob)

    // 5. 보이지 않는 a 태그를 만들어 다운로드를 실행시킵니다.
    const link = document.createElement('a')
    link.href = url
    link.download = `${currentUser.value}_attendance_data.json` // 파일 이름 설정
    document.body.appendChild(link)
    link.click()

    // 6. 뒷정리
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const setViewedDate = (date) => {
    viewedDate.value = date
  }

  const loadUser = (username) => {
    currentUser.value = username
    attendanceLogs.value = JSON.parse(localStorage.getItem(`${username}_logs`)) || []
    hourlyRate.value = JSON.parse(localStorage.getItem(`${username}_rate`)) || 1000
    tags.value = JSON.parse(localStorage.getItem(`${username}_tags`)) || []
    bonusSettings.value = JSON.parse(localStorage.getItem(`${username}_settings`)) || {
      isWeekendEnabled: true,
      weekendRate: 1.5,
      isNightEnabled: true,
      nightRate: 1.5,
      nightStart: 22,
      nightEnd: 6,
    }
  }

  const logout = () => {
    currentUser.value = null
    attendanceLogs.value = []
    hourlyRate.value = 1000
    tags.value = []
  }

  const updateHourlyRate = (newRate) => {
    hourlyRate.value = newRate
  }

  const addTag = (tag) => {
    tags.value.push({ id: Date.now(), ...tag })
  }

  const updateBonusSettings = (newSettings) => {
    bonusSettings.value = { ...bonusSettings.value, ...newSettings }
  }

  const calculateWage = (start, end, rate) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    let totalHours = (endDate - startDate) / (1000 * 60 * 60)
    if (totalHours < 0) totalHours += 24
    let regularPay = 0
    let nightPay = 0
    if (bonusSettings.value.isNightEnabled) {
      let nightHours = 0
      let currentHour = new Date(startDate)
      while (currentHour < endDate) {
        const h = currentHour.getHours()
        if (h >= bonusSettings.value.nightStart || h < bonusSettings.value.nightEnd) {
          nightHours += 1 / 60
        }
        currentHour.setMinutes(currentHour.getMinutes() + 1)
      }
      const regularHours = totalHours - nightHours
      regularPay = regularHours * rate
      nightPay = nightHours * rate * bonusSettings.value.nightRate
    } else {
      regularPay = totalHours * rate
    }
    let totalWage = regularPay + nightPay
    const dayOfWeek = startDate.getDay()
    if (bonusSettings.value.isWeekendEnabled && (dayOfWeek === 0 || dayOfWeek === 6)) {
      totalWage *= bonusSettings.value.weekendRate
    }
    return { totalWage, totalHours }
  }

  const saveLog = (logData) => {
    // logData에 id가 있는지 확인하여 기존 기록의 인덱스를 찾습니다.
    const existingLogIndex = logData.id
      ? attendanceLogs.value.findIndex((log) => log.id === logData.id)
      : -1

    const date = logData.date
    const fullStartTime = `${date}T${logData.start}`
    const fullEndTime = `${date}T${logData.end}`

    const { totalWage, totalHours } = calculateWage(fullStartTime, fullEndTime, hourlyRate.value)

    // 전달받은 데이터를 기반으로 완전한 로그 객체를 만듭니다.
    const newLogData = {
      ...logData, // id, date, start, end, tagId 포함
      workedHours: totalHours,
      dailyWage: totalWage,
    }

    if (existingLogIndex > -1) {
      // ID가 있으면, 찾은 인덱스의 기존 기록을 새 데이터로 교체합니다. (수정)
      attendanceLogs.value[existingLogIndex] = newLogData
    } else {
      // ID가 없으면, 새 ID를 부여하고 배열의 맨 앞에 추가합니다. (새로 만들기)
      newLogData.id = Date.now()
      attendanceLogs.value.unshift(newLogData)
    }
  }

  // --- Getters / Computed ---

  const getLogsByDate = computed(() => {
    return (dateStr) => attendanceLogs.value.filter((log) => log.date === dateStr)
  })

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
      rate: hourlyRate.value,
      tags: tags.value,
      settings: bonusSettings.value,
    }),
    (state) => {
      if (currentUser.value) {
        localStorage.setItem(`${currentUser.value}_logs`, JSON.stringify(state.logs))
        localStorage.setItem(`${currentUser.value}_rate`, JSON.stringify(state.rate))
        localStorage.setItem(`${currentUser.value}_tags`, JSON.stringify(state.tags))
        localStorage.setItem(`${currentUser.value}_settings`, JSON.stringify(state.settings))
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
    hourlyRate,
    tags,
    bonusSettings,
    viewedDate,
    saveLog,
    addTag,
    updateHourlyRate,
    updateBonusSettings,
    setViewedDate,
    calculateWage,
    getTagById,
    monthlyWage,
    weeklyWage,
    viewedMonthWage,
    exportUserData,
    importUserData,
    getLogsByDate,
    deleteLog,
  }
})

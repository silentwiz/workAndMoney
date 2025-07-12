import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

export const useAttendanceStore = defineStore('attendance', () => {
  // --- State ---
  const currentUser = ref(null)
  const attendanceLogs = ref([])
  const tags = ref([])
  const viewedDate = ref(new Date())

  // --- Actions ---
  const saveDataToServer = async () => {
    if (!currentUser.value) return

    // 서버로 보낼 현재 데이터
    const dataToSave = {
      logs: attendanceLogs.value,
      tags: tags.value,
    }

    try {
      await fetch(`/api/data?user=${currentUser.value}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      })
    } catch (error) {
      console.error('Failed to save data to server:', error)
    }
  }

  const deleteLog = (logId) => {
    const index = attendanceLogs.value.findIndex((log) => log.id === logId)
    if (index > -1) {
      attendanceLogs.value.splice(index, 1)
    }
  }

  const importUserData = (jsonData) => {
    if (!currentUser.value) {
      alert('利用者を選択してください。')
      return false
    }
    try {
      const userData = JSON.parse(jsonData)
      if (userData.username && userData.username !== currentUser.value) {
        if (
          !confirm(
            `読み込んだデータの利用者は'${userData.username}'です。今設定された'${currentUser.value}'のデータに上書きしますか？`,
          )
        ) {
          return false
        }
      }
      // 불러온 데이터로 교체 (rate, settings는 tags에 포함되어 있음)
      attendanceLogs.value = userData.logs || []
      tags.value = userData.tags || []
      alert('データを読み込みました。')
      return true
    } catch (error) {
      alert('間違ったデータです。')
      console.error('データ読み込みエラー:', error)
      return false
    }
  }

  const exportUserData = () => {
    if (!currentUser.value) {
      alert('利用者が選択されていません。')
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
    // 기존의 a 태그를 만들어 클릭하는 방식 대신, 새 탭에서 URL을 엽니다.
    // 이 방식은 모든 브라우저와 모바일 기기에서 안정적으로 동작합니다.
    window.open(url, '_blank')

    // URL을 즉시 해제하면 새 탭이 로드되기 전에 연결이 끊길 수 있으므로,
    // 약간의 시간차를 두고 해제합니다.
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }

  const setViewedDate = (date) => {
    viewedDate.value = date
  }

  const loadUser = async (username) => {
    currentUser.value = username

    try {
      // 1. 우리 백엔드 API에 데이터를 요청합니다.
      const response = await fetch(`/api/data?user=${username}`)
      if (!response.ok) {
        throw new Error('Server response was not ok')
      }
      const data = await response.json()

      // 2. 서버에서 받은 데이터로 상태를 업데이트합니다.
      attendanceLogs.value = data.logs || []
      tags.value = data.tags || []
    } catch (error) {
      console.error('Failed to load user data:', error)
      // 에러 발생 시 상태를 비워줌
      attendanceLogs.value = []
      tags.value = []
    }
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
    newLogData.modifiedAt = new Date()
    if (existingLogIndex > -1) {
      attendanceLogs.value[existingLogIndex] = newLogData
    } else {
      newLogData.id = Date.now()
      attendanceLogs.value.unshift(newLogData)
    }
  }

  // --- Getters / Computed ---

  const viewedMonthWageByTag = computed(() => {
    if (!viewedDate.value) return []

    const year = viewedDate.value.getFullYear()
    const month = viewedDate.value.getMonth() + 1
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`

    const monthLogs = attendanceLogs.value.filter((log) => log.date.startsWith(targetMonthStr))

    const wageByTag = {}
    for (const log of monthLogs) {
      if (!wageByTag[log.tagId]) {
        wageByTag[log.tagId] = 0
      }
      wageByTag[log.tagId] += log.dailyWage
    }

    return Object.entries(wageByTag)
      .map(([tagId, totalWage]) => {
        const tag = getTagById.value(parseInt(tagId))
        return {
          tagId: tagId,
          tagName: tag ? tag.name : 'no_tag',
          tagColor: tag ? tag.color : '#888',
          totalWage: totalWage,
        }
      })
      .sort((a, b) => b.totalWage - a.totalWage)
  })

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
    // ✨ 안전장치 추가: viewedDate가 없으면 0을 반환
    if (!viewedDate.value) return 0

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
      tags: tags.value,
    }),
    () => {
      // 데이터가 변경될 때마다 서버에 저장 함수를 호출
      saveDataToServer()
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
    viewedMonthWageByTag,
    saveDataToServer,
  }
})

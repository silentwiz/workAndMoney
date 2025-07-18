import { defineStore } from 'pinia'
import { ref, watch, computed } from 'vue'

function debounce(fn, delay) {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }
}

export const useAttendanceStore = defineStore('attendance', () => {
  // ------------------------------------ State ------------------------------------
  const currentUser = ref(null)
  const attendanceLogs = ref([])
  const tags = ref([])
  const viewedDate = ref(new Date())
  const isLoading = ref(false)

  // ------------------------------------- Actions ------------------------------------
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
  const debouncedSave = debounce(saveDataToServer, 2000)

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
    isLoading.value = true
    try {
      // 1. 우리 백엔드 API에 데이터를 요청합니다.
      const response = await fetch(`/api/data?user=${username}`)
      if (!response.ok) {
        throw new Error('Server response was not ok')
      }
      const data = await response.json()
      isLoading.value = false

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
      name: tagData.name || '새 직장',
      color: tagData.color || '#42b883',
      // 시급 정보
      baseRate: Number(tagData.baseRate) || 0,
      nightRate: Number(tagData.nightRate) || 0,
      weekendRate: Number(tagData.weekendRate) || 0,
      weekendNightRate: Number(tagData.weekendNightRate) || 0,
      payday: Number(tagData.payday) || 25, // 월급 지급일 (기본값 25일)
      periodStartDay: Number(tagData.periodStartDay) || 1, // 급여 정산 시작일 (기본값 1일)
      nightStartHour: Number(tagData.nightStartHour) || 22, // 야간 근무 시작 시간 (기본값 22시)
      nightEndHour: Number(tagData.nightEndHour) || 6, // 야간 근무 종료 시간 (기본값 6시)
    }
    tags.value.push(newTag)
  }

  const updateTag = (updatedTag) => {
    const index = tags.value.findIndex((tag) => tag.id === updatedTag.id)
    if (index > -1) {
      tags.value[index] = { ...tags.value[index], ...updatedTag }
    }
  }

  const calculateWage = (start, end, tagId, restMinutes = 0) => {
    const tag = tags.value.find((t) => t.id === tagId)
    if (!tag) return { totalWage: 0, totalHours: 0 }

    const startDate = new Date(start)
    const endDate = new Date(end)
    let totalMinutes = (endDate - startDate) / (1000 * 60)
    if (totalMinutes < 0) {
      totalMinutes += 24 * 60
    }

    const totalHours = totalMinutes / 60
    const payableMinutes = Math.max(0, totalMinutes - restMinutes)

    let grossWage = 0
    let currentMinute = new Date(startDate)

    for (let i = 0; i < totalMinutes; i++) {
      const dayOfWeek = currentMinute.getDay()
      const hour = currentMinute.getHours()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

      // ✨ 태그의 설정값을 기준으로 야간 시간 판단
      const isNight = hour >= tag.nightStartHour || hour < tag.nightEndHour

      let applicableRate = tag.baseRate

      if (isWeekend && isNight) {
        applicableRate = tag.weekendNightRate
      } else if (isWeekend) {
        applicableRate = tag.weekendRate
      } else if (isNight) {
        applicableRate = tag.nightRate
      }

      grossWage += applicableRate / 60
      currentMinute.setMinutes(currentMinute.getMinutes() + 1)
    }

    const effectiveWage = totalHours > 0 ? (grossWage / totalHours) * (payableMinutes / 60) : 0

    return { totalWage: effectiveWage, totalHours: totalHours }
  }

  const saveLog = (logData) => {
    const existingLogIndex = logData.id
      ? attendanceLogs.value.findIndex((log) => log.id === logData.id)
      : -1
    const date = logData.date
    const fullStartTime = `${date}T${logData.start}`
    const fullEndTime = `${date}T${logData.end}`
    const { totalWage, totalHours } = calculateWage(
      fullStartTime,
      fullEndTime,
      logData.tagId,
      logData.restMinutes,
      logData.expenses,
    )
    const newLogData = { ...logData, workedHours: totalHours, dailyWage: totalWage }
    newLogData.modifiedAt = new Date()
    if (existingLogIndex > -1) {
      attendanceLogs.value[existingLogIndex] = newLogData
    } else {
      newLogData.id = Date.now()
      attendanceLogs.value.unshift(newLogData)
    }
  }

  // ------------------ Getters / Computed ------------------

  // 이번 주 총 지출
  const weeklyExpenses = computed(() => {
    // weeklyWage 계산 로직과 동일하지만, dailyWage 대신 expenses를 합산
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
      .reduce((total, log) => total + (log.expenses || 0), 0)
  })

  // 이번 달 총 지출
  const monthlyExpenses = computed(() => {
    const now = new Date()
    const targetMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return attendanceLogs.value
      .filter((log) => log.date.startsWith(targetMonthStr))
      .reduce((total, log) => total + (log.expenses || 0), 0)
  })

  // 이번 주 순수입
  const netWeeklyWage = computed(() => weeklyWage.value - weeklyExpenses.value)
  // 이번 달 순수입
  const netMonthlyWage = computed(() => monthlyWage.value - monthlyExpenses.value)
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

  const tagSummaries = computed(() => {
    const today = new Date()

    return tags.value.map((tag) => {
      // --- TagSummary.vue에 있던 로직을 그대로 가져옴 ---
      const closingDay = tag.periodStartDay
      let periodEndDate = new Date(today.getFullYear(), today.getMonth(), closingDay)
      if (today.getDate() > closingDay) {
        periodEndDate.setMonth(periodEndDate.getMonth() + 1)
      }
      let periodStartDate = new Date(periodEndDate)
      periodStartDate.setMonth(periodStartDate.getMonth() - 1)
      periodStartDate.setDate(periodStartDate.getDate() + 1)
      // --- 로직 끝 ---

      const startDateStr = periodStartDate.toISOString().slice(0, 10)
      const endDateStr = periodEndDate.toISOString().slice(0, 10)

      const periodLogs = attendanceLogs.value.filter((log) => {
        return log.tagId === tag.id && log.date >= startDateStr && log.date <= endDateStr
      })

      const totalWage = periodLogs.reduce((sum, log) => sum + log.dailyWage, 0)
      const totalExpenses = periodLogs.reduce((sum, log) => sum + (log.expenses || 0), 0)

      return {
        tagName: tag.name,
        tagColor: tag.color,
        payday: tag.payday,
        period: `${startDateStr.slice(5)} ~ ${endDateStr.slice(5)}`,
        totalWage: totalWage - totalExpenses,
      }
    })
  })

  // --- Watch ---
  watch(
    () => ({
      logs: attendanceLogs.value,
      tags: tags.value,
    }),
    () => {
      // 데이터가 변경될 때마다 서버에 저장 함수를 호출
      debouncedSave()
    },
    { deep: true },
  )

  // --- Return ---
  return {
    currentUser,
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
    weeklyExpenses,
    monthlyExpenses,
    netWeeklyWage,
    netMonthlyWage,
    tagSummaries,
    isLoading,
    loadUser,
  }
})

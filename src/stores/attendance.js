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
  const attendanceLogs = ref({})
  const tags = ref([])
  const viewedDate = ref(new Date())
  const isLoading = ref(false)
  const currentPage = ref(1)
  const itemsPerPage = ref(10)

  // ------------------------------------- Actions ------------------------------------
  const goToPage = (pageNumber) => {
    currentPage.value = pageNumber
  }

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

  // ✨ logId와 date를 함께 받도록 수정
  const deleteLog = (logId, date) => {
    if (!date || !attendanceLogs.value[date]) return

    // 해당 날짜의 배열에서 일치하는 logId를 가진 로그를 제외하고 새로 배열을 만듭니다.
    attendanceLogs.value[date] = attendanceLogs.value[date].filter((log) => log.id !== logId)

    // 만약 해당 날짜에 로그가 하나도 남지 않았다면, 해당 날짜 키를 삭제합니다.
    if (attendanceLogs.value[date].length === 0) {
      delete attendanceLogs.value[date]
    }
  }
  //

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
      let logsToSet = userData.logs || []

      // 1. 불러온 logs 데이터가 배열인지 확인 (옛날 방식인지 체크)
      if (Array.isArray(logsToSet)) {
        // 2. 배열이라면, 새로운 객체 구조로 즉시 변환
        console.log('Importing old data format. Starting migration...')
        logsToSet = normalizeLogData(logsToSet)
      }

      // 3. 변환된 데이터를 상태에 할당
      attendanceLogs.value = logsToSet
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
      logs: allLogsSorted.value,
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
      const response = await fetch(`/api/data?user=${username}`)
      if (!response.ok) throw new Error('Server response was not ok')

      const data = await response.json()

      // --- ✨ 여기가 최종 핵심 수정: 불러온 데이터 정화 로직 --- ✨
      const loadedTags = data.tags || []
      // 불러온 모든 태그를 순회하며 데이터 형식을 검사하고 보정합니다.
      const sanitizedTags = loadedTags.map((tag) => ({
        ...tag,
        baseRate: Number(tag.baseRate) || 0,
        nightRate: Number(tag.nightRate) || 0,
        weekendRate: Number(tag.weekendRate) || 0,
        weekendNightRate: Number(tag.weekendNightRate) || 0,
        payday: Number(tag.payday) || 25,
        periodStartDay: Number(tag.periodStartDay) || 1, // 빈 문자열이나 null이면 1로 보정
        nightStartHour: Number(tag.nightStartHour) || 22,
        nightEndHour: Number(tag.nightEndHour) || 6,
      }))

      tags.value = sanitizedTags
      // --- 데이터 정화 끝 ---

      let logsToSet = data.logs || []
      if (Array.isArray(logsToSet)) {
        logsToSet = normalizeLogData(logsToSet)
      }
      attendanceLogs.value = logsToSet
    } catch (error) {
      console.error('Failed to load user data:', error)
      attendanceLogs.value = {}
      tags.value = []
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    currentUser.value = null
    attendanceLogs.value = {}
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
      // ✨ 수정 1: 저장하기 전에 입력값을 숫자로 변환하고, 유효하지 않으면 기본값(1)을 사용
      const sanitizedTag = {
        ...updatedTag,
        // 모든 숫자 입력 필드에 대해 동일한 처리를 해주는 것이 더 안전합니다.
        baseRate: Number(updatedTag.baseRate) || 0,
        nightRate: Number(updatedTag.nightRate) || 0,
        weekendRate: Number(updatedTag.weekendRate) || 0,
        weekendNightRate: Number(updatedTag.weekendNightRate) || 0,
        payday: Number(updatedTag.payday) || 25,
        periodStartDay: Number(updatedTag.periodStartDay) || 1,
        nightStartHour: Number(updatedTag.nightStartHour) || 22,
        nightEndHour: Number(updatedTag.nightEndHour) || 6,
      }
      tags.value[index] = { ...tags.value[index], ...sanitizedTag }
    }
  }

  const calculateWage = (date, start, end, tagId, restMinutes = 0) => {
    const tag = tags.value.find((t) => t.id === tagId)
    if (!tag) return { totalWage: 0, totalHours: 0 }

    // ✨ 수정 2: 날짜와 시간을 조합하여 유효한 Date 객체 생성
    const startDate = new Date(`${date}T${start}`)
    const endDate = new Date(`${date}T${end}`)

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
    const { totalWage, totalHours } = calculateWage(
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

    // --- ✨ 여기가 핵심 로직 ---
    // 1. 기존 로그가 있는지 확인
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

    // 3. 새로운 날짜의 로그 배열을 가져오거나 새로 만듭니다.
    const targetDate = newLogData.date
    if (!attendanceLogs.value[targetDate]) {
      attendanceLogs.value[targetDate] = []
    }

    // 4. 새 로그를 추가하거나 기존 로그를 업데이트합니다.
    const targetDateLogs = attendanceLogs.value[targetDate]
    const existingLogIndexInNewDate = targetDateLogs.findIndex((log) => log.id === newLogData.id)

    if (existingLogIndexInNewDate > -1) {
      // 해당 날짜 배열에 이미 로그가 있으면 (날짜 변경 없는 수정)
      targetDateLogs[existingLogIndexInNewDate] = newLogData
    } else {
      // 새로운 로그이거나 날짜가 변경된 로그이면
      if (!newLogData.id) {
        newLogData.id = Date.now()
      }
      targetDateLogs.push(newLogData)
    }
  }

  // ------------------ Getters / Computed ------------------
  // 현재 페이지에 해당하는 로그만 잘라서 반환하는 핵심 getter 추가
  const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value
    const end = start + itemsPerPage.value
    return allLogsSorted.value.slice(start, end)
  })
  // 전체 페이지 수를 계산하는 getter 추가
  const totalPages = computed(() => {
    return Math.ceil(allLogsSorted.value.length / itemsPerPage.value)
  })
  const allLogsSorted = computed(() => {
    // Object.values()로 모든 날짜의 로그 배열들을 가져온 후 .flat()으로 1차원 배열로 만듭니다.
    const flatLogs = Object.values(attendanceLogs.value).flat()
    // 최신 날짜, 최신 수정 순으로 정렬합니다.
    return flatLogs.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
  })

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
    return allLogsSorted.value
      .filter((log) => datesOfWeek.includes(log.date))
      .reduce((total, log) => total + (log.expenses || 0), 0)
  })

  // 이번 달 총 지출
  const monthlyExpenses = computed(() => {
    const now = new Date()
    const targetMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return allLogsSorted.value
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

    const monthLogs = allLogsSorted.value.filter((log) => log.date.startsWith(targetMonthStr))

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
    () =>
      // ✨ .filter() 대신 직접 접근. 해당 날짜에 로그가 없으면 빈 배열 반환
      (dateStr) =>
        attendanceLogs.value[dateStr] || [],
  )
  const getTagById = computed(() => (tagId) => tags.value.find((t) => t.id === tagId))
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
  const viewedMonthWage = computed(() => {
    // ✨ 안전장치 추가: viewedDate가 없으면 0을 반환
    if (!viewedDate.value) return 0

    const year = viewedDate.value.getFullYear()
    const month = viewedDate.value.getMonth() + 1
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`

    return allLogsSorted.value
      .filter((log) => log.date.startsWith(targetMonthStr))
      .reduce((total, log) => total + log.dailyWage, 0)
  })

  const tagSummaries = computed(() => {
    const today = new Date()

    return tags.value
      .map((tag) => {
        const closingDay = Number(tag.periodStartDay)
        if (!closingDay || closingDay < 1 || closingDay > 31) {
          return null
        }

        // ✨ 여기가 최종 수정된 날짜 계산 로직입니다.
        let endYear = today.getFullYear()
        let endMonth = today.getMonth()

        if (today.getDate() > closingDay) {
          endMonth += 1
        }

        const periodEndDate = new Date(endYear, endMonth, closingDay)

        // ✨ 시작일 계산 순서를 변경하여 오류를 해결합니다.
        let periodStartDate = new Date(periodEndDate)
        periodStartDate.setDate(periodStartDate.getDate() + 1) // 종료일 다음 날로 먼저 설정
        periodStartDate.setMonth(periodStartDate.getMonth() - 1) // 그 상태에서 한 달을 뺌

        // --- 로직 수정 끝 ---

        if (isNaN(periodStartDate.getTime()) || isNaN(periodEndDate.getTime())) {
          return null
        }

        const startDateStr = periodStartDate.toISOString().slice(0, 10)
        const endDateStr = periodEndDate.toISOString().slice(0, 10)

        const periodLogs = allLogsSorted.value.filter((log) => {
          return log.tagId === tag.id && log.date >= startDateStr && log.date <= endDateStr
        })

        const totalWage = periodLogs.reduce((sum, log) => sum + log.dailyWage, 0)
        const totalExpenses = periodLogs.reduce((sum, log) => sum + (log.expenses || 0), 0)

        return {
          tagName: tag.name,
          tagColor: tag.color,
          payday: tag.payday,
          wageForLog: totalWage,
          period: `${startDateStr.slice(5)} ~ ${endDateStr.slice(5)}`,
          totalWage: totalWage - totalExpenses,
        }
      })
      .filter(Boolean)
  })

  const normalizeLogData = (logsArray) => {
    // .reduce를 사용하면 효율적으로 구조를 변경할 수 있습니다.
    return logsArray.reduce((acc, log) => {
      const date = log.date
      if (!acc[date]) {
        acc[date] = [] // 해당 날짜의 키가 없으면 빈 배열 생성
      }
      acc[date].push(log) // 해당 날짜의 배열에 로그 추가
      return acc
    }, {}) // 초기값은 빈 객체
  }

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
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedLogs,
    goToPage,
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
    normalizeLogData,
    allLogsSorted,
  }
})

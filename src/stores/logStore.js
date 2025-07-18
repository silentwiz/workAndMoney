import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useTagStore } from './tagStore'
import { useUserStore } from './userStore'

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
  const itemsPerPage = ref(5)

  const goToPage = (pageNumber) => {
    currentPage.value = pageNumber
  }

  const deleteLog = (logId, date) => {
    if (!date || !attendanceLogs.value[date]) return

    attendanceLogs.value[date] = attendanceLogs.value[date].filter((log) => log.id !== logId)

    if (attendanceLogs.value[date].length === 0) {
      delete attendanceLogs.value[date]
    }
  }

  const saveLog = (logData) => {
    const tagStore = useTagStore()
    const { totalWage, totalHours } = tagStore.calculateWage(
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
    // saveDataToServer,
  }
})

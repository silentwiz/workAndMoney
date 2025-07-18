import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLogStore } from './logStore'

export const useTagStore = defineStore('tag', () => {
  const tags = ref([])

  const addTag = (tagData) => {
    const newTag = {
      id: Date.now(),
      name: tagData.name || '새 직장',
      color: tagData.color || '#42b883',
      baseRate: Number(tagData.baseRate) || 0,
      nightRate: Number(tagData.nightRate) || 0,
      weekendRate: Number(tagData.weekendRate) || 0,
      weekendNightRate: Number(tagData.weekendNightRate) || 0,
      payday: Number(tagData.payday) || 25,
      periodStartDay: Number(tagData.periodStartDay) || 1,
      nightStartHour: Number(tagData.nightStartHour) || 22,
      nightEndHour: Number(tagData.nightEndHour) || 6,
    }
    tags.value.push(newTag)
  }

  const updateTag = (updatedTag) => {
    const index = tags.value.findIndex((tag) => tag.id === updatedTag.id)
    if (index > -1) {
      const sanitizedTag = {
        ...updatedTag,
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

  const getTagById = computed(() => (tagId) => tags.value.find((t) => t.id === tagId))

  const calculateWage = (date, start, end, tagId, restMinutes = 0) => {
    const tag = tags.value.find((t) => t.id === tagId)
    if (!tag) return { totalWage: 0, totalHours: 0 }

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

  const tagSummaries = computed(() => {
    const logStore = useLogStore()
    const today = new Date()

    return tags.value
      .map((tag) => {
        const closingDay = Number(tag.periodStartDay)
        if (!closingDay || closingDay < 1 || closingDay > 31) {
          return null
        }

        let endYear = today.getFullYear()
        let endMonth = today.getMonth()

        if (today.getDate() > closingDay) {
          endMonth += 1
        }

        const periodEndDate = new Date(endYear, endMonth, closingDay)
        let periodStartDate = new Date(periodEndDate)
        periodStartDate.setDate(periodStartDate.getDate() + 1)
        periodStartDate.setMonth(periodStartDate.getMonth() - 1)

        if (isNaN(periodStartDate.getTime()) || isNaN(periodEndDate.getTime())) {
          return null
        }

        const startDateStr = periodStartDate.toISOString().slice(0, 10)
        const endDateStr = periodEndDate.toISOString().slice(0, 10)

        const periodLogs = logStore.allLogsSorted.filter((log) => {
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

  return {
    tags,
    addTag,
    updateTag,
    getTagById,
    calculateWage,
    tagSummaries,
  }
})

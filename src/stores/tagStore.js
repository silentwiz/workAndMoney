import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLogStore } from './logStore'
import { useHolidayService } from '../services/holidayService'
import { useSettingsStore } from './settingsStore'

export const useTagStore = defineStore('tag', () => {
  const tags = ref([])
  const { isHoliday, fetchHolidays } = useHolidayService()
  fetchHolidays()

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

  const calculateWage = async (dateStr, start, end, tagId, restMinutes = 0) => {
    const tag = tags.value.find((t) => t.id === tagId)
    if (!tag) return { totalWage: 0, totalHours: 0 }

    let totalGrossWage = 0

    let startDate = new Date(`${dateStr}T${start}`)
    let endDate = new Date(`${dateStr}T${end}`)

    if (endDate < startDate) {
      endDate.setDate(endDate.getDate() + 1)
    }

    const getRate = (currentDate) => {
      const dayOfWeek = currentDate.getDay()
      const hour = currentDate.getHours()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0: 일요일, 6: 토요일
      const isHolidayDay = isHoliday(currentDate)
      const isSpecialDay = isWeekend || isHolidayDay

      const isNight =
        tag.nightStartHour < tag.nightEndHour
          ? hour >= tag.nightStartHour && hour < tag.nightEndHour
          : hour >= tag.nightStartHour || hour < tag.nightEndHour

      if (isSpecialDay && isNight) {
        return tag.weekendNightRate
      } else if (isSpecialDay) {
        return tag.weekendRate
      } else if (isNight) {
        return tag.nightRate
      } else {
        return tag.baseRate
      }
    }

    const eventPoints = new Set()
    eventPoints.add(startDate.getTime())
    eventPoints.add(endDate.getTime())

    let tempDate = new Date(startDate)
    while (tempDate < endDate) {
      const nextDay = new Date(tempDate)
      nextDay.setDate(nextDay.getDate() + 1)
      nextDay.setHours(0, 0, 0, 0)

      const nightStartToday = new Date(tempDate)
      nightStartToday.setHours(tag.nightStartHour, 0, 0, 0)
      if (nightStartToday >= startDate && nightStartToday < endDate) {
        eventPoints.add(nightStartToday.getTime())
      }

      const nightEndToday = new Date(tempDate)
      nightEndToday.setHours(tag.nightEndHour, 0, 0, 0)
      if (nightEndToday >= startDate && nightEndToday < endDate) {
        eventPoints.add(nightEndToday.getTime())
      }

      const nightStartNextDay = new Date(tempDate)
      nightStartNextDay.setDate(
        nightStartNextDay.getDate() + (tag.nightStartHour < tag.nightEndHour ? 0 : 1),
      )
      nightStartNextDay.setHours(tag.nightStartHour, 0, 0, 0)
      if (nightStartNextDay >= startDate && nightStartNextDay < endDate) {
        eventPoints.add(nightStartNextDay.getTime())
      }

      const nightEndNextDay = new Date(tempDate)
      nightEndNextDay.setDate(
        nightEndNextDay.getDate() + (tag.nightStartHour < tag.nightEndHour ? 0 : 1),
      )
      nightEndNextDay.setHours(tag.nightEndHour, 0, 0, 0)
      if (nightEndNextDay >= startDate && nightEndNextDay < endDate) {
        eventPoints.add(nightEndNextDay.getTime())
      }

      const midnight = new Date(tempDate)
      midnight.setDate(midnight.getDate() + 1)
      midnight.setHours(0, 0, 0, 0)
      if (midnight > startDate && midnight < endDate) {
        eventPoints.add(midnight.getTime())
      }

      tempDate = nextDay
    }

    const sortedEventPoints = Array.from(eventPoints).sort((a, b) => a - b)

    for (let i = 0; i < sortedEventPoints.length - 1; i++) {
      const segmentStart = new Date(sortedEventPoints[i])
      const segmentEnd = new Date(sortedEventPoints[i + 1])

      if (segmentStart >= endDate || segmentEnd <= startDate) {
        continue
      }

      const midPoint = new Date((segmentStart.getTime() + segmentEnd.getTime()) / 2)
      const applicableRate = getRate(midPoint)

      const segmentDurationMinutes = (segmentEnd - segmentStart) / (1000 * 60)
      totalGrossWage += (applicableRate / 60) * segmentDurationMinutes
    }

    const actualWorkedMinutes = (endDate - startDate) / (1000 * 60)
    const payableMinutes = Math.max(0, actualWorkedMinutes - restMinutes)

    const effectiveWage =
      actualWorkedMinutes > 0 ? (totalGrossWage / actualWorkedMinutes) * payableMinutes : 0

    return { totalWage: effectiveWage, totalHours: payableMinutes / 60 }
  }

  const tagSummaries = computed(() => {
    const logStore = useLogStore()
    const settingsStore = useSettingsStore()
    const today = new Date()
    const targetDate = settingsStore.summaryDate

    return tags.value
      .map((tag) => {
        const closingDay = Number(tag.periodStartDay)
        if (!closingDay || closingDay < 1 || closingDay > 31) {
          return null
        }

        let endYear = targetDate.getFullYear()
        let endMonth = targetDate.getMonth()

        if (targetDate.getDate() > closingDay) {
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
          period: `${startDateStr.slice(5)} ~ ${endDateStr.slice(5)}`,
          expectedIncome: totalWage,
          expectedExpense: totalExpenses,
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

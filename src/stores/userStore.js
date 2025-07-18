import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useLogStore } from './logStore'
import { useTagStore } from './tagStore'
import { fetchData } from '@/services/api'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const isLoading = ref(false)

  const logout = () => {
    const logStore = useLogStore()
    const tagStore = useTagStore()

    currentUser.value = null
    logStore.attendanceLogs = {}
    tagStore.tags = []
  }

  const loadUser = async (username) => {
    const logStore = useLogStore()
    const tagStore = useTagStore()

    currentUser.value = username
    isLoading.value = true
    try {
      const data = await fetchData(username)

      const loadedTags = data.tags || []
      const sanitizedTags = loadedTags.map((tag) => ({
        ...tag,
        baseRate: Number(tag.baseRate) || 0,
        nightRate: Number(tag.nightRate) || 0,
        weekendRate: Number(tag.weekendRate) || 0,
        weekendNightRate: Number(tag.weekendNightRate) || 0,
        payday: Number(tag.payday) || 25,
        periodStartDay: Number(tag.periodStartDay) || 1,
        nightStartHour: Number(tag.nightStartHour) || 22,
        nightEndHour: Number(tag.nightEndHour) || 6,
      }))

      tagStore.tags = sanitizedTags

      let logsToSet = data.logs || []
      if (Array.isArray(logsToSet)) {
        logsToSet = logStore.normalizeLogData(logsToSet)
      }
      logStore.attendanceLogs = logsToSet
    } catch (error) {
      console.error('Failed to load user data:', error)
      logStore.attendanceLogs = {}
      tagStore.tags = []
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentUser,
    isLoading,
    logout,
    loadUser,
  }
})

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useLogStore } from './logStore'
import { useUserStore } from './userStore'
import { useTagStore } from './tagStore'

export const useSettingsStore = defineStore('settings', () => {
  const viewedDate = ref(new Date())
  const summaryDate = ref(new Date())

  const setViewedDate = (date) => {
    viewedDate.value = date
  }

  const setSummaryDate = (year, month) => {
    // month는 1-12 기반으로 받음
    summaryDate.value = new Date(year, month - 1, 1)
  }

  const importUserData = (jsonData) => {
    const userStore = useUserStore()
    const logStore = useLogStore()
    const tagStore = useTagStore()

    if (!userStore.currentUser) {
      alert('利用者を選択してください。')
      return false
    }
    try {
      const userData = JSON.parse(jsonData)
      if (userData.username && userData.username !== userStore.currentUser) {
        if (
          !confirm(
            `読み込んだデータの利用者は'${userData.username}'です。今設定された'${userStore.currentUser}'のデータに上書きしますか？`,
          )
        ) {
          return false
        }
      }
      let logsToSet = userData.logs || []

      if (Array.isArray(logsToSet)) {
        logsToSet = logStore.normalizeLogData(logsToSet)
      }

      logStore.attendanceLogs = logsToSet
      tagStore.tags = userData.tags || []

      alert('データを読み込みました。')
      return true
    } catch (error) {
      alert('間違ったデータです。')
      console.error('データ読み込みエラー:', error)
      return false
    }
  }

  const exportUserData = () => {
    const userStore = useUserStore()
    const logStore = useLogStore()
    const tagStore = useTagStore()

    if (!userStore.currentUser) {
      alert('利用者が選択されていません。')
      return
    }
    const userData = {
      username: userStore.currentUser,
      logs: logStore.allLogsSorted,
      tags: tagStore.tags,
    }
    const jsonString = JSON.stringify(userData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')

    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
  }

  return {
    viewedDate,
    setViewedDate,
    importUserData,
    exportUserData,
    summaryDate,
    setSummaryDate,
  }
})

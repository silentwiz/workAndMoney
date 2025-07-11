<script setup>
import { ref, watch } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'

const store = useAttendanceStore()

// 이 컴포넌트에서만 사용할 로컬 변수
const summaryData = ref([])

// 이제 스토어의 계산 결과를 감시하는 대신, 계산에 필요한 "원본 재료"들의 변경을 직접 감시합니다.
watch(
  // 1. 감시할 대상: [현재 보는 날짜, 전체 근무 기록]
  [() => store.viewedDate, () => store.attendanceLogs],

  // 2. 위 대상 중 하나라도 바뀌면, 이 함수 안에서 직접 계산을 다시 수행합니다.
  ([newDate, newLogs]) => {
    if (!newDate) return []

    const year = newDate.getFullYear()
    const month = newDate.getMonth() + 1
    const targetMonthStr = `${year}-${String(month).padStart(2, '0')}`

    const monthLogs = newLogs.filter((log) => log.date.startsWith(targetMonthStr))

    const wageByTag = {}
    for (const log of monthLogs) {
      if (!wageByTag[log.tagId]) {
        wageByTag[log.tagId] = 0
      }
      wageByTag[log.tagId] += log.dailyWage
    }

    const result = Object.entries(wageByTag)
      .map(([tagId, totalWage]) => {
        const tag = store.getTagById(parseInt(tagId))
        return {
          tagId: tagId,
          tagName: tag ? tag.name : '태그 없음',
          tagColor: tag ? tag.color : '#888',
          totalWage: totalWage,
        }
      })
      .sort((a, b) => b.totalWage - a.totalWage)

    // 3. 스스로 계산한 최종 결과를 로컬 변수에 할당합니다.
    summaryData.value = result
  },
  {
    immediate: true, // 처음 한번 즉시 실행
    deep: true, // 배열 내부까지 감지
  },
)

// 통화 포맷 함수
const formatCurrency = (value) => {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'JPY',
  }).format(value)
}
</script>

<template>
  <div v-if="summaryData.length > 0" class="tag-summary-container">
    <h4>職場別の収入</h4>
    <ul>
      <li v-for="item in summaryData" :key="item.tagId">
        <span class="tag-indicator" :style="{ backgroundColor: item.tagColor }"></span>
        <span>{{ item.tagName }}:</span>
        <strong>{{ formatCurrency(item.totalWage) }}</strong>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tag-summary-container {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
}
h4 {
  margin: 0 0 10px 0;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 15px;
}
.tag-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}
strong {
  font-weight: 600;
}
</style>

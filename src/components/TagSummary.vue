<script setup>
import { ref, computed } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'

const store = useAttendanceStore()

// UI 제어용 변수
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const summaryData = ref([])
const showSummary = ref(false)

// 연도 선택 옵션 (현재 연도 +/- 5년)
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 5; i <= currentYear + 5; i++) {
    years.push(i)
  }
  return years
})

// 요약 계산 함수
const calculateSummary = () => {
  const logs = store.attendanceLogs

  // 1. 연간 수입 계산
  const yearLogs = logs.filter((log) => log.date.startsWith(String(selectedYear.value)))
  const yearlyWageByTag = {}
  for (const log of yearLogs) {
    if (!yearlyWageByTag[log.tagId]) yearlyWageByTag[log.tagId] = 0
    yearlyWageByTag[log.tagId] += log.dailyWage
  }

  // 2. 월간 수입 계산
  const targetMonthStr = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`
  const monthLogs = yearLogs.filter((log) => log.date.startsWith(targetMonthStr))
  const monthlyWageByTag = {}
  for (const log of monthLogs) {
    if (!monthlyWageByTag[log.tagId]) monthlyWageByTag[log.tagId] = 0
    monthlyWageByTag[log.tagId] += log.dailyWage
  }

  // 3. 최종 데이터 조합
  summaryData.value = store.tags
    .map((tag) => ({
      tagId: tag.id,
      tagName: tag.name,
      tagColor: tag.color,
      yearlyTotal: yearlyWageByTag[tag.id] || 0,
      monthlyTotal: monthlyWageByTag[tag.id] || 0,
    }))
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal)

  showSummary.value = true // 계산 후 요약 표시
}

// 통화 포맷 함수
const formatCurrency = (value) => {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(value)
}
</script>

<template>
  <div class="summary-container">
    <div class="controls">
      <select v-model="selectedYear">
        <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}年</option>
      </select>
      <select v-model="selectedMonth">
        <option v-for="month in 12" :key="month" :value="month">{{ month }}月</option>
      </select>
      <button @click="calculateSummary">収入要約</button>
    </div>

    <div v-if="showSummary" class="results-table">
      <div class="result-row header">
        <span class="col-tag">職場</span>
        <span class="col-month">{{ selectedMonth }}月の収入</span>
        <span class="col-year">{{ selectedYear }}年の収入</span>
      </div>
      <div v-for="item in summaryData" :key="item.tagId" class="result-row">
        <span class="col-tag">
          <span class="tag-indicator" :style="{ backgroundColor: item.tagColor }"></span>
          {{ item.tagName }}
        </span>
        <span class="col-month">{{ formatCurrency(item.monthlyTotal) }}</span>
        <span class="col-year">{{ formatCurrency(item.yearlyTotal) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.summary-container {
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}
.controls {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
}
select,
button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  background-color: #42b883;
  color: white;
  border: none;
  cursor: pointer;
}
.results-table {
  border-top: 1px solid #eee;
}
.result-row {
  display: flex;
  align-items: center;
  padding: 10px 5px;
  border-bottom: 1px solid #eee;
}
.result-row.header {
  font-weight: bold;
  background-color: #f0f0f0;
}
.col-tag {
  flex: 2;
  display: flex;
  align-items: center;
}
.col-month {
  flex: 1.5;
  text-align: right;
}
.col-year {
  flex: 1.5;
  text-align: right;
}
.tag-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}
</style>

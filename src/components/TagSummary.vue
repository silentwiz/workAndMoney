<script setup>
import { ref, computed } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'

const store = useAttendanceStore()

const summaryData = ref([])
const showSummary = ref(false)

// 요약 계산 함수
const calculateSummary = () => {
  const today = new Date() // 계산의 기준이 되는 오늘 날짜

  summaryData.value = store.tags.map((tag) => {
    // --- ✨ 새로운 급여 기간 계산 로직 ---
    const closingDay = tag.periodStartDay // 마감일 (예: 3일)

    // 1. 이번 급여 기간이 언제 끝나는지 계산
    let periodEndDate = new Date(today.getFullYear(), today.getMonth(), closingDay)
    // 만약 오늘 날짜가 이번 달 마감일을 이미 지났다면, 급여 기간은 다음 달에 끝남
    if (today.getDate() > closingDay) {
      periodEndDate.setMonth(periodEndDate.getMonth() + 1)
    }

    // 2. 이번 급여 기간이 언제 시작하는지 계산 (종료일 기준 한 달 전 + 1일)
    let periodStartDate = new Date(periodEndDate)
    periodStartDate.setMonth(periodStartDate.getMonth() - 1)
    periodStartDate.setDate(periodStartDate.getDate() + 1)
    // --- ✨ 계산 로직 끝 ---

    // YYYY-MM-DD 형식으로 변환
    const startDateStr = periodStartDate.toISOString().slice(0, 10)
    const endDateStr = periodEndDate.toISOString().slice(0, 10)

    // 해당 기간과 태그에 맞는 로그만 필터링
    const periodLogs = store.attendanceLogs.filter((log) => {
      return log.tagId === tag.id && log.date >= startDateStr && log.date <= endDateStr
    })

    // 필터링된 로그의 수입 합산
    const totalWage = periodLogs.reduce((sum, log) => sum + log.dailyWage, 0)
    const totalExpenses = periodLogs.reduce((sum, log) => sum + (log.expenses || 0), 0)

    return {
      tagName: tag.name,
      tagColor: tag.color,
      payday: tag.payday,
      period: `${startDateStr.slice(5)} ~ ${endDateStr.slice(5)}`,
      totalWage: totalWage - totalExpenses, // ✨ 총급여 - 총지출
    }
  })

  showSummary.value = true
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
      <button @click="calculateSummary">現在の給料期間の収入要約</button>
    </div>

    <div v-if="showSummary" class="results-table">
      <div class="result-row header">
        <span class="col-tag">職場</span>
        <span class="col-period">対象期間</span>
        <span class="col-payday">給料日</span>
        <span class="col-wage">予想収入</span>
      </div>
      <div v-for="item in summaryData" :key="item.tagName" class="result-row">
        <span class="col-tag">
          <span class="tag-indicator" :style="{ backgroundColor: item.tagColor }"></span>
          {{ item.tagName }}
        </span>
        <span class="col-period">{{ item.period }}</span>
        <span class="col-payday">毎月 {{ item.payday }}日</span>
        <span class="col-wage">{{ formatCurrency(item.totalWage) }}</span>
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
  justify-content: flex-end;
  margin-bottom: 15px;
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
  padding: 12px 5px;
  border-bottom: 1px solid #eee;
}
.result-row.header {
  font-weight: bold;
  background-color: #f0f0f0;
}
.col-tag {
  flex: 1.5;
  display: flex;
  align-items: center;
}
.col-period {
  flex: 1;
  text-align: center;
  font-size: 14px;
}
.col-payday {
  flex: 1;
  text-align: center;
  font-size: 14px;
}
.col-wage {
  flex: 1.5;
  text-align: right;
  font-weight: bold;
}
.result-row.header .col-wage {
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

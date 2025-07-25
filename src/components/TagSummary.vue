<script setup>
import { ref, computed } from 'vue'
import { useTagStore } from '@/stores/tagStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { formatCurrency } from '@/utils/formatters'

const tagStore = useTagStore()
const settingsStore = useSettingsStore()

// ✨ 년/월 선택을 위한 상태 변수
const selectedYear = ref(settingsStore.summaryDate.getFullYear())
const selectedMonth = ref(settingsStore.summaryDate.getMonth() + 1)

// ✨ 선택 가능한 년도 목록 (예: 5년 전부터 현재 년도까지)
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i)
  }
  return years
})

// ✨ 선택 가능한 월 목록
const monthOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

// ✨ 날짜 선택 시 store의 상태를 업데이트하는 함수
const onDateChange = () => {
  settingsStore.setSummaryDate(selectedYear.value, selectedMonth.value)
}
</script>

<template>
  <div class="summary-container">
    <div class="date-controls">
      <select v-model="selectedYear" @change="onDateChange">
        <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}年</option>
      </select>
      <select v-model="selectedMonth" @change="onDateChange">
        <option v-for="month in monthOptions" :key="month" :value="month">{{ month }}月</option>
      </select>
      <span>の給料＆支出</span>
    </div>
    <div v-if="tagStore.tagSummaries.length > 0" class="results-table"></div>
    <div v-else class="no-data-message"></div>

    <div v-if="tagStore.tagSummaries.length > 0" class="results-table">
      <div class="result-row header">
        <span class="col-tag">職場</span>
        <span class="col-period">対象期間</span>
        <span class="col-payday">給料日</span>
        <span class="col-income">予想給料</span>
        <span class="col-expense">予想支出</span>
      </div>
      <div v-for="item in tagStore.tagSummaries" :key="item.tagName" class="result-row">
        <span class="col-tag" data-label="職場">
          <span class="tag-indicator" :style="{ backgroundColor: item.tagColor }"></span>
          {{ item.tagName }}
        </span>
        <span class="col-period" data-label="対象期間">{{ item.period }}</span>
        <span class="col-payday" data-label="給料日">毎月 {{ item.payday }}日</span>
        <span class="col-income" data-label="予想給料">{{
          formatCurrency(item.expectedIncome)
        }}</span>
        <span class="col-expense" data-label="予想支出">{{
          formatCurrency(item.expectedExpense)
        }}</span>
      </div>
    </div>
    <div v-else class="no-data-message">
      <p>収入要約を表示するデータがありません。</p>
      <p>まず、勤務記録と職場設定を追加してください。</p>
    </div>
  </div>
</template>

<style scoped>
/* 기존 스타일은 그대로 유지합니다. */
.summary-container {
  margin-top: 15px; /* ✨ 수정: 마진 줄임 */
  padding: 15px; /* ✨ 수정: 패딩 줄임 */
  background-color: #f9f9f9;
  border-radius: 8px;
}
.results-table {
  border-top: 1px solid #eee;
}
.summary-container {
  margin-top: 15px; /* ✨ 수정: 마진 줄임 */
  padding: 15px; /* ✨ 수정: 패딩 줄임 */
  background-color: #f9f9f9;
  border-radius: 8px;
}
.controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px; /* ✨ 수정: 마진 줄임 */
}
select,
button {
  padding: 6px 10px; /* ✨ 수정: 패딩 줄임 */
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
  padding: 10px 5px; /* ✨ 수정: 패딩 줄임 */
  border-bottom: 1px solid #eee;
}
.result-row.header {
  font-weight: bold;
  background-color: #f0f0f0;
}
.col-tag {
  flex: 1.2;
  display: flex;
  align-items: center;
  font-size: 0.9em; /* ✨ 추가: 폰트 크기 조정 */
}
.col-period {
  flex: 1;
  text-align: center;
  font-size: 0.9em; /* ✨ 수정: 폰트 크기 조정 */
}
.col-payday {
  flex: 1;
  text-align: center;
  font-size: 0.9em; /* ✨ 수정: 폰트 크기 조정 */
}
.col-income {
  flex: 1.2;
  text-align: right;
  font-weight: bold;
  font-size: 1em; /* ✨ 수정: 폰트 크기 조정 */
}
.col-expense {
  flex: 1.2;
  text-align: right;
  font-weight: bold;
  font-size: 1em; /* ✨ 수정: 폰트 크기 조정 */
}
.result-row.header .col-income,
.result-row.header .col-expense {
  text-align: right;
}
.tag-indicator {
  display: inline-block;
  width: 10px; /* ✨ 수정: 크기 줄임 */
  height: 10px; /* ✨ 수정: 크기 줄임 */
  border-radius: 50%;
  margin-right: 6px; /* ✨ 수정: 마진 줄임 */
}
.no-data-message {
  text-align: center;
  color: #777;
  padding: 15px 0; /* ✨ 수정: 패딩 줄임 */
}
/* --- 모바일 반응형 스타일 --- */
@media (max-width: 768px) {
  .result-row.header {
    display: none;
  }
  .result-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 8px;
    border: 1px solid #eee;
    margin-bottom: 8px;
    border-radius: 6px;
  }
  .result-row > span {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 0.9em;
    text-align: right;
  }
  .result-row > span::before {
    content: attr(data-label);
    font-weight: bold;
    text-align: left;
    margin-right: 8px;
    font-size: 0.9em;
  }
  .col-tag::before {
    content: '職場';
  }
  .col-period::before {
    content: '対象期間';
  }
  .col-payday::before {
    content: '給料日';
  }
  .col-income::before {
    content: '予想給料';
  }
  .col-expense::before {
    content: '予想支出';
  }
  .col-expense::before {
    content: '予想支出';
  }
}
</style>

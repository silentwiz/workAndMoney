<script setup>
import { useLogStore } from '@/stores/logStore'

const logStore = useLogStore()

import { formatCurrency } from '@/utils/formatters'
</script>

<template>
  <div class="dashboard">
    <div class="summary-card">
      <h4>今週の予想純収入</h4>
      <p>{{ formatCurrency(logStore.netWeeklyWage) }}</p>
      <div class="details">
        <span class="income">+ {{ formatCurrency(logStore.weeklyWage) }}</span>
        <span class="expense">- {{ formatCurrency(logStore.weeklyExpenses) }}</span>
      </div>
    </div>
    <div class="summary-card">
      <h4>今月の予想純収入</h4>
      <p>{{ formatCurrency(logStore.netMonthlyWage) }}</p>
      <div class="details">
        <span class="income">+ {{ formatCurrency(logStore.monthlyWage) }}</span>
        <span class="expense">- {{ formatCurrency(logStore.monthlyExpenses) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.summary-card {
  background-color: #ffffff;
  padding: 15px; /* ✨ 수정: 패딩 줄임 */
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.summary-card h4 {
  margin: 0 0 8px 0; /* ✨ 수정: 마진 줄임 */
  color: #555;
  font-size: 15px; /* ✨ 수정: 폰트 크기 조정 */
}
.summary-card p {
  margin: 0;
  color: #2c3e50;
  font-size: 22px; /* ✨ 수정: 폰트 크기 조정 */
  font-weight: bold;
}
.details {
  margin-top: 8px; /* ✨ 수정: 마진 줄임 */
  font-size: 13px; /* ✨ 수정: 폰트 크기 조정 */
  display: flex;
  justify-content: space-between; /* ✨ 수정: space-around -> space-between */
}
.income {
  color: #42b883;
}
.expense {
  color: #e53935;
}

/* --- 모바일 반응형 스타일 --- */
@media (max-width: 768px) {
  .dashboard {
    grid-template-columns: 1fr;
  }
  .summary-card p {
    font-size: 18px; /* ✨ 수정: 폰트 크기 조정 */
  }
}
</style>

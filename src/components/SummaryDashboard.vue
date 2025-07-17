<script setup>
import { useAttendanceStore } from '@/stores/attendance'

const store = useAttendanceStore()

// LogList에서 사용했던 숫자 포맷 함수
const formatCurrency = (value) => {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'JPY',
  }).format(value)
}
</script>

<template>
  <div class="dashboard">
    <div class="summary-card">
      <h4>今週の予想純収入</h4>
      <p>{{ formatCurrency(store.netWeeklyWage) }}</p>
      <div class="details">
        <span class="income">+ {{ formatCurrency(store.weeklyWage) }}</span>
        <span class="expense">- {{ formatCurrency(store.weeklyExpenses) }}</span>
      </div>
    </div>
    <div class="summary-card">
      <h4>今月の予想純収入</h4>
      <p>{{ formatCurrency(store.netMonthlyWage) }}</p>
      <div class="details">
        <span class="income">+ {{ formatCurrency(store.monthlyWage) }}</span>
        <span class="expense">- {{ formatCurrency(store.monthlyExpenses) }}</span>
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
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.summary-card h4 {
  margin: 0 0 10px 0;
  color: #555;
  font-size: 16px;
}
.summary-card p {
  margin: 0;
  color: #2c3e50; /* 순수입은 진한 색으로 */
  font-size: 24px;
  font-weight: bold;
}
/* ✨ 추가된 스타일 */
.details {
  margin-top: 10px;
  font-size: 14px;
  display: flex;
  justify-content: space-around;
}
.income {
  color: #42b883; /* 초록색 */
}
.expense {
  color: #e53935; /* 빨간색 */
}

/* --- 모바일 반응형 스타일 --- */
@media (max-width: 768px) {
  .dashboard {
    /* 2열 그리드 -> 1열 그리드로 변경 */
    grid-template-columns: 1fr;
  }
  .summary-card p {
    font-size: 20px; /* 모바일에서 글자 크기 살짝 줄임 */
  }
}
</style>

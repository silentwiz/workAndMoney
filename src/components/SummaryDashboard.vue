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
      <h4>이번 주 예상 수입</h4>
      <p>{{ formatCurrency(store.weeklyWage) }}</p>
    </div>
    <div class="summary-card">
      <h4>이번 달 예상 수입</h4>
      <p>{{ formatCurrency(store.monthlyWage) }}</p>
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
  color: #42b883;
  font-size: 24px;
  font-weight: bold;
}
</style>

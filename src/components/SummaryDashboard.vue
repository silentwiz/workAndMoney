<script setup>
import { ref } from 'vue'
import { useLogStore } from '@/stores/logStore'
import { formatCurrency } from '@/utils/formatters'
const logStore = useLogStore()
const showYearlySummary = ref(false)
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
  <div class="secret-button-container">
    <button @click="showYearlySummary = !showYearlySummary">秘密</button>
  </div>
  <div v-if="showYearlySummary" class="dashboard yearly-summary">
    <div class="summary-card">
      <h4>今年の総収入</h4>
      <p class="yearly-total income">{{ formatCurrency(logStore.yearlyWage) }}</p>
    </div>
    <div class="summary-card">
      <h4>今年の総支出</h4>
      <p class="yearly-total expense">{{ formatCurrency(logStore.yearlyExpenses) }}</p>
    </div>
    <div class="summary-card">
      <h4>今年の総純収入</h4>
      <p class="yearly-total">{{ formatCurrency(logStore.netYearlyWage) }}</p>
    </div>
  </div>
</template>

<style scoped>
.secret-button-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 5px;
}
.secret-button-container button {
  padding: 5px;
  border-radius: 15px;
  border: 1px solid #ccc;
  background-color: #f0f0f0;
  cursor: pointer;
  font-size: 9px;
}
.yearly-summary {
  margin-top: 20px;
  border-top: 2px dashed #e0e0e0;
  padding-top: 20px;
}
.yearly-total {
  font-size: 24px !important;
}

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
.summary-card .income {
  color: #42b883;
}
.summary-card .expense {
  color: #e53935;
}
.income {
  color: #42b883;
}
.expense {
  color: #e53935;
}
.yearly-summary {
  margin-top: 20px;
  border-top: 2px dashed #e0e0e0;
  padding-top: 20px;
  /* 💡 데스크탑에서 3단으로 보이도록 그리드 템플릿 수정 */
  grid-template-columns: 1fr 1fr 1fr;
}
.yearly-total {
  font-size: 24px !important;
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

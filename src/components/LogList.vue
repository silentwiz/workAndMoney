<script setup>
import { useAttendanceStore } from '@/stores/attendance'
const store = useAttendanceStore()

// 급여 표시를 위한 formatCurrency 함수
const formatCurrency = (value) => {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'JPY',
  }).format(value)
}
</script>

<template>
  <div class="log-list-container">
    <h2>근무 기록</h2>
    <ul>
      <li v-for="log in store.attendanceLogs" :key="log.id">
        <div class="log-details">
          <span>{{ log.date }}</span>
          <span class="tag-badge" :style="{ backgroundColor: store.getTagById(log.tagId)?.color }">
            {{ store.getTagById(log.tagId)?.name || '태그 없음' }}
          </span>
          <span>{{ log.start }} ~ {{ log.end }} ({{ log.workedHours.toFixed(2) }}시간)</span>
        </div>
        <div class="log-wage">
          <strong>{{ formatCurrency(log.dailyWage) }}</strong>
        </div>
      </li>
    </ul>
    <p v-if="store.attendanceLogs.length === 0">기록이 없습니다.</p>
  </div>
</template>

<style scoped>
/* 원래 스타일로 복원합니다 */
.log-list-container {
  padding: 20px;
}
h2 {
  margin-bottom: 16px;
}
ul {
  list-style: none;
  padding: 0;
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid #eee;
}
.log-details {
  display: flex;
  align-items: center;
  gap: 15px;
}
.tag-badge {
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}
.log-wage {
  font-size: 1.1em;
}
</style>

<script setup>
import { ref, watch } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'

const store = useAttendanceStore()

// 1. 컴포넌트 내부에서 사용할 로컬 변수
const summaryData = ref([])

// 2. 스토어의 원본 데이터 변경을 직접 감시(watch)
watch(
  // 감시할 대상: [현재 보는 날짜, 전체 근무 기록]
  [() => store.viewedDate, () => store.attendanceLogs],

  // 위 대상 중 하나라도 바뀌면, 이 함수 안에서 직접 계산을 다시 수행
  () => {
    // 스토어에 있는 계산 로직을 여기서 직접 호출하거나, 다시 계산
    // 지금은 스토어의 computed를 신뢰하고 그 결과를 받아오는 것으로 충분
    summaryData.value = store.viewedMonthWageByTag
  },
  {
    immediate: true, // 컴포넌트 로드 시 즉시 실행
    deep: true, // 배열 내부까지 감지
  },
)

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
  <div v-if="summaryData.length > 0" class="tag-summary-container">
    <h4>태그별 수입</h4>
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

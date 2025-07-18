<script setup>
import { useAttendanceStore } from '@/stores/attendance'

// ✨ 스토어를 가져오는 이 한 줄이면 모든 준비가 끝납니다.
const store = useAttendanceStore()

// 통화 포맷 함수는 그대로 둡니다.
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
    <div v-if="store.tagSummaries.length > 0" class="results-table">
      <div class="result-row header">
        <span class="col-tag">職場</span>
        <span class="col-period">対象期間</span>
        <span class="col-payday">給料日</span>
        <span class="col-wage">予想給料</span>
      </div>
      <div v-for="item in store.tagSummaries" :key="item.tagName" class="result-row">
        <span class="col-tag" data-label="職場">
          <span class="tag-indicator" :style="{ backgroundColor: item.tagColor }"></span>
          {{ item.tagName }}
        </span>
        <span class="col-period" data-label="対象期間">{{ item.period }}</span>
        <span class="col-payday" data-label="給料日">毎月 {{ item.payday }}日</span>
        <span class="col-wage" data-label="予想収入">{{ formatCurrency(item.totalWage) }}</span>
      </div>
    </div>
    <div v-else class="no-data-message">
      <p>収入要約を表示するデータがありません。</p>
      <p>まず、勤務記録と職場(タグ)設定を追加してください。</p>
    </div>
  </div>
</template>

<style scoped>
/* 기존 스타일은 그대로 유지합니다. */
.summary-container {
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
}
.results-table {
  border-top: 1px solid #eee;
}
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
.no-data-message {
  text-align: center;
  color: #777;
  padding: 20px 0;
}
/* --- 모바일 반응형 스타일 --- */
@media (max-width: 768px) {
  .result-row.header {
    display: none; /* 모바일에선 제목 행 숨김 */
  }
  .result-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px;
    border: 1px solid #eee;
    margin-bottom: 10px;
    border-radius: 6px;
  }
  .result-row > span {
    width: 100%;
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    text-align: right;
  }
  /* 각 데이터 앞에 제목을 붙여줌 */
  .result-row > span::before {
    content: attr(data-label); /* data-label 속성값을 가져옴 */
    font-weight: bold;
    text-align: left;
    margin-right: 10px;
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
  .col-wage::before {
    content: '予想収入';
  }
}
</style>

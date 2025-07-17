<script setup>
import { ref } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'
const store = useAttendanceStore()

const fileInput = ref(null)

// 급여 표시를 위한 formatCurrency 함수
const formatCurrency = (value) => {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(value)
}

// 데이터 내보내기/가져오기 핸들러
const handleExport = () => {
  store.exportUserData()
}

const handleImport = () => {
  const file = fileInput.value.files[0]
  if (!file) {
    alert('파일을 선택해주세요.')
    return
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    store.importUserData(event.target.result)
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="log-list-container">
    <h2>記録</h2>

    <div class="log-table">
      <div class="log-row header">
        <span class="col-modified">修正時間</span>
        <span class="col-date">勤務日</span>
        <span class="col-tag">職場</span>
        <span class="col-time">勤務時間</span>
        <span class="col-expense">支出</span>
        <span class="col-wage">純収入</span>
      </div>

      <div v-for="log in store.attendanceLogs" :key="log.id" class="log-row">
        <span class="col-modified">
          <span v-if="log.modifiedAt">{{ new Date(log.modifiedAt).toLocaleString('ja-JP') }}</span>
        </span>
        <span class="col-date">{{ log.date }}</span>
        <span class="col-tag">
          <span class="tag-badge" :style="{ backgroundColor: store.getTagById(log.tagId)?.color }">
            {{ store.getTagById(log.tagId)?.name || 'N/A' }}
          </span>
        </span>
        <span class="col-time"
          >{{ log.start }} ~ {{ log.end }} ({{ log.workedHours.toFixed(2) }}時間)</span
        >
        <span class="col-expense">{{ formatCurrency(log.expenses || 0) }}</span>
        <span class="col-wage">
          <strong>{{ formatCurrency(log.dailyWage - (log.expenses || 0)) }}</strong>
        </span>
      </div>
    </div>

    <p v-if="store.attendanceLogs.length === 0" class="no-logs">まだ記録がありません。</p>
  </div>
  <div class="section">
    <h3>💾データ管理</h3>
    <div class="input-group">
      <button @click="handleExport">データ保存</button>
    </div>
    <p class="description">現在のデータを保存します。</p>
    <br />
    <div class="input-group import-group">
      <input type="file" ref="fileInput" accept=".json" />
      <button @click="handleImport">データ読み込み</button>
    </div>
    <p class="description">データを読み込みます。 ⚠️注意：データが上書きされます。</p>
  </div>
</template>

<style scoped>
/* PC (기본) 스타일 */
.log-list-container {
  padding: 20px;
}
h2 {
  margin-bottom: 16px;
}
.log-table {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #eee;
}
.log-row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
}
.log-row.header {
  font-weight: bold;
  color: #555;
  background-color: #f9f9f9;
  text-align: center;
}
.cell {
  padding: 12px 8px;
}
.col-modified {
  flex: 2;
  text-align: left;
  font-size: 0.9em;
  color: #666;
}
.col-date {
  flex: 1.2;
  font-size: 0.9em;
  text-align: center;
}
.col-tag {
  flex: 1;
  text-align: center;
}
.col-time {
  flex: 2;
  font-size: 0.8em;
  text-align: center;
}
.col-wage {
  flex: 1.2;
  text-align: right;
  font-weight: bold;
  font-size: 1em;
}
.tag-badge {
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75em;
  font-weight: bold;
  display: inline-block;
}
.no-logs {
  padding: 20px;
  text-align: center;
  color: #777;
}
/* 모바일에서는 각 데이터의 제목(data-label)을 숨김 */
.cell::before {
  content: '';
  display: none;
}

/* ✨ --- 스마트폰 (모바일) 반응형 스타일 --- ✨ */
/* 화면 너비가 768px 이하일 때 적용됩니다. */
@media (max-width: 768px) {
  /* PC용 제목 행을 숨깁니다. */
  .log-row.header {
    display: none;
  }
  /* 각 기록을 세로로 쌓습니다. */
  .log-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 15px;
    margin-bottom: 10px;
    border: 1px solid #eee;
    border-radius: 8px;
  }
  /* 각 데이터 항목이 한 줄을 모두 차지하도록 합니다. */
  .cell {
    width: 100%;
    padding: 6px 0;
    display: flex;
    justify-content: space-between;
  }
  /* 각 데이터 앞에 제목을 붙여줍니다. (예: "職場: a") */
  .cell::before {
    content: attr(data-label);
    font-weight: bold;
    margin-right: 10px;
    display: inline-block;
  }
  .col-tag,
  .col-wage {
    justify-content: flex-end; /* 태그와 수입은 오른쪽 정렬 */
  }
  .col-wage strong {
    font-size: 0.75em;
  }
}
.col-expense {
  flex: 1;
  text-align: right;
} /* ✨ 추가 */
</style>

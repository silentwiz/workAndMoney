<script setup>
import { ref } from 'vue'
import { useLogStore } from '@/stores/logStore'
import { useTagStore } from '@/stores/tagStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useHolidayService } from '@/services/holidayService'

const logStore = useLogStore()
const tagStore = useTagStore()
const settingsStore = useSettingsStore()
const { isHoliday } = useHolidayService()

const fileInput = ref(null)

import { formatCurrency } from '@/utils/formatters'

const getRateDescription = (log) => {
  const tag = tagStore.getTagById(log.tagId)
  if (!tag) return ''

  const date = new Date(log.date)
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const isHolidayDay = isHoliday(date)
  const isSpecialDay = isWeekend || isHolidayDay

  // 근무 시간의 대부분이 야간인지 주간인지 판단 (단순화)
  const startHour = parseInt(log.start.split(':')[0])
  const isNight =
    tag.nightStartHour < tag.nightEndHour
      ? startHour >= tag.nightStartHour && startHour < tag.nightEndHour
      : startHour >= tag.nightStartHour || startHour < tag.nightEndHour

  if (isSpecialDay) {
    return isNight ? '週末・祝日夜間' : '週末・祝日昼間'
  } else {
    return isNight ? '平日夜間' : '平日昼間'
  }
}

// 데이터 내보내기/가져오기 핸들러
const handleExport = () => {
  settingsStore.exportUserData()
}

const handleImport = () => {
  const file = fileInput.value.files[0]
  if (!file) {
    alert('파일을 선택해주세요.')
    return
  }
  const reader = new FileReader()
  reader.onload = (event) => {
    settingsStore.importUserData(event.target.result)
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
        <span class="col-rate">時給</span>
        <span class="col-expense">支出</span>
        <span class="col-wage">純収入</span>
      </div>

      <div v-for="log in logStore.paginatedLogs" :key="log.id" class="log-row">
        <span class="col-modified">
          <span v-if="log.modifiedAt">{{ new Date(log.modifiedAt).toLocaleString('ja-JP') }}</span>
        </span>
        <span class="col-date">{{ log.date }}</span>
        <span class="col-tag">
          <span
            class="tag-badge"
            :style="{ backgroundColor: tagStore.getTagById(log.tagId)?.color }"
          >
            {{ tagStore.getTagById(log.tagId)?.name || 'N/A' }}
          </span>
        </span>
        <span class="col-time">
          {{ log.start }} ~ {{ log.end }}
          <span v-if="typeof log.workedHours === 'number'"
            >({{ log.workedHours.toFixed(2) }}時間)</span
          >
        </span>
        <span class="col-rate">{{ getRateDescription(log) }}</span>
        <span class="col-expense">{{ formatCurrency(log.expenses || 0) }}</span>
        <span class="col-wage">
          <strong>{{ formatCurrency(log.dailyWage - (log.expenses || 0)) }}</strong>
        </span>
      </div>
    </div>

    <div class="pagination-controls" v-if="logStore.totalPages > 1">
      <button @click="logStore.goToPage(1)" :disabled="logStore.currentPage === 1">&lt;&lt;</button>
      <button
        @click="logStore.goToPage(logStore.currentPage - 1)"
        :disabled="logStore.currentPage === 1"
      >
        &lt;
      </button>
      <span> Page {{ logStore.currentPage }} of {{ logStore.totalPages }} </span>
      <button
        @click="logStore.goToPage(logStore.currentPage + 1)"
        :disabled="logStore.currentPage === logStore.totalPages"
      >
        &gt;
      </button>
      <button
        @click="logStore.goToPage(logStore.totalPages)"
        :disabled="logStore.currentPage === logStore.totalPages"
      >
        &gt;&gt;
      </button>
    </div>

    <p v-if="logStore.allLogsSorted.length === 0" class="no-logs">まだ記録がありません。</p>
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
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}
.pagination-controls button {
  padding: 8px 12px;
  border: 1px solid #ccc;
  background-color: white;
  cursor: pointer;
}
.pagination-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.pagination-controls span {
  font-size: 14px;
  color: #333;
}
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
.col-rate {
  flex: 1;
  text-align: center;
  font-size: 0.8em;
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
.col-expense {
  flex: 1;
  text-align: right;
  font-size: 0.8em;
} /* ✨ 수정: 폰트 크기 조정 */

/* ✨ --- 스마트폰 (모바일) 반응형 스타일 --- ✨ */
/* 화면 너비가 1023px 이하일 때 적용됩니다. */
@media (max-width: 768px) {
  /* PC용 제목 행을 숨깁니다. */
  .log-row.header {
    display: none;
  }
  /* 각 기록을 세로로 쌓습니다. */
  .log-row {
    flex-direction: column;
    align-items: flex-start;
    padding: 10px; /* ✨ 수정: 패딩 줄임 */
    margin-bottom: 8px; /* ✨ 수정: 마진 줄임 */
    border: 1px solid #eee;
    border-radius: 8px;
  }
  /* 각 데이터 항목이 한 줄을 모두 차지하도록 합니다. */
  .cell {
    width: 100%;
    padding: 5px 0; /* ✨ 수정: 패딩 줄임 */
    display: flex;
    justify-content: space-between;
  }
  /* 각 데이터 앞에 제목을 붙여줍니다. (예: "職場: a") */
  .cell::before {
    content: attr(data-label);
    font-weight: bold;
    margin-right: 10px;
    display: inline-block;
    font-size: 0.9em; /* ✨ 추가: 라벨 폰트 크기 조정 */
  }
  .col-modified {
    font-size: 0.8em; /* ✨ 수정: 폰트 크기 조정 */
  }
  .col-date {
    font-size: 0.9em;
  }
  .col-tag {
    font-size: 0.9em; /* ✨ 추가: 폰트 크기 조정 */
  }
  .col-time {
    font-size: 0.9em;
  }
  .col-rate {
    font-size: 0.9em;
  }
  .col-wage {
    font-size: 1.1em;
  }
  .col-tag,
  .col-wage {
    font-weight: bold;
    justify-content: flex-end; /* 태그와 수입은 오른쪽 정렬 */
  }
  .col-wage strong {
    font-weight: bold;
    font-size: 1em;
  }

  /* 데이터 관리 섹션 버튼 및 입력 필드 조정 */
  .section .input-group button {
    width: 100%;
    padding: 10px;
    font-size: 1em;
  }
  .section .input-group input[type='file'] {
    width: 100%;
    margin-bottom: 10px;
  }
  .section .import-group {
    flex-direction: column;
    align-items: flex-start;
  }
}
.col-expense {
  flex: 1;
  text-align: right;
  font-size: 0.8em;
} /* ✨ 수정: 폰트 크기 조정 */
</style>

<script setup>
import { ref, computed } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'
import BaseModal from './BaseModal.vue'
import LogEditor from './LogEditor.vue'
import DailyLogViewer from './DailyLogViewer.vue'

const store = useAttendanceStore()

const isModalOpen = ref(false)
const selectedDate = ref(null)

// --- ✨ 2. 모달의 상태를 제어할 변수들 추가 ---
const modalMode = ref('viewer') // 'viewer' 또는 'editor'
const dailyLogs = ref([]) // 일일 요약에 보여줄 로그들
const editingLog = ref(null) // 편집할 특정 로그
// --- ✨ 1. 새로운 UI 제어용 상태 변수 추가 ---
const indicatorStyle = ref('dot') // 'dot' 또는 'bar'
const weekStartDay = ref(2) // 1: 일요일, 2: 월요일

const calendarLocale = computed(() => ({
  id: 'ja', // 일본어 로케일 사용
  firstDayOfWeek: weekStartDay.value,
  masks: {
    weekdays: 'W', // 요일을 한 글자로 (日, 月...)
  },
}))

const attributes = computed(() => {
  const logAttributes = store.attendanceLogs.map((log) => {
    const tag = store.getTagById(log.tagId)
    const [year, month, day] = log.date.split('-').map(Number)

    // ✨ indicatorStyle 값에 따라 다른 속성 객체를 생성
    if (indicatorStyle.value === 'dot') {
      return {
        key: `log-${log.id}`,
        dot: {
          style: {
            backgroundColor: tag ? tag.color : 'gray',
          },
        },
        dates: new Date(year, month - 1, day),
        order: 10,
      }
    }
    // bar 스타일일 경우
    else {
      return {
        key: `log-${log.id}`,
        bar: {
          style: {
            backgroundColor: tag ? tag.color : 'gray',
          },
        },
        dates: new Date(year, month - 1, day),
        order: 10,
      }
    }
  })

  const paydayAttributes = []
  if (store.viewedDate && store.tags.length > 0) {
    const year = store.viewedDate.getFullYear()
    const month = store.viewedDate.getMonth()
    store.tags.forEach((tag) => {
      if (tag.payday && Number.isInteger(tag.payday)) {
        const thisMonthPayday = new Date(year, month, tag.payday)
        if (thisMonthPayday.getMonth() === month) {
          paydayAttributes.push({
            key: `payday-${tag.id}-${month}`,
            highlight: { color: tag.color, fillMode: 'light' },
            dates: thisMonthPayday,
            order: 0,
          })
        }
      }
    })
  }

  return [
    {
      key: 'today',
      highlight: { fillMode: 'outline', color: '#42b883' },
      dates: new Date(),
      order: 5,
    },
    ...logAttributes,
    ...paydayAttributes,
  ]
})
const calendarViewDate = computed(() => store.viewedDate)

const onDeleteLog = (logId) => {
  if (confirm('この記録を削除しますか？')) {
    store.deleteLog(logId)
    // 목록이 변경되었으므로 모달을 닫음
    isModalOpen.value = false
  }
}

// 1. 달력이 바뀌면 스토어의 setViewedDate 액션을 직접 호출합니다.
const handlePageUpdate = (pages) => {
  if (pages && pages.length > 0) {
    store.setViewedDate(pages[0].viewDate)
  }
}

// 숫자 포맷 함수
const formatCurrency = (value) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'JPY',
  }).format(value)
}

const handleDayClick = (day) => {
  // .toISOString() 대신, 로컬 시간대 기준으로 문자열 생성
  const date = day.date
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${dayOfMonth}`
  const logsForDay = store.getLogsByDate(dateStr)

  selectedDate.value = day.date

  if (logsForDay.length > 0) {
    // 기록이 있으면, 뷰어 모드로 설정하고 로그 목록을 저장
    dailyLogs.value = logsForDay
    modalMode.value = 'viewer'
  } else {
    // 기록이 없으면, 에디터 모드로 설정하고 새 기록을 준비
    editingLog.value = null
    modalMode.value = 'editor'
  }
  isModalOpen.value = true
}

// --- ✨ 4. 뷰어에서 발생하는 이벤트를 처리할 함수들 ---
const onAddNew = () => {
  editingLog.value = null // 새 기록이므로 데이터 없음
  modalMode.value = 'editor'
}
const onEditLog = (log) => {
  editingLog.value = log // 수정할 로그 데이터 전달
  modalMode.value = 'editor'
}
</script>
<template>
  <div class="calendar-container">
    <div class="header-bar">
      <h2>勤務カレンダー</h2>
      <div class="calendar-controls">
        <label>週の開始曜日:</label>
        <button @click="weekStartDay = 1" :class="{ active: weekStartDay === 1 }">日</button>
        <button @click="weekStartDay = 2" :class="{ active: weekStartDay === 2 }">月</button>
        <span class="divider">|</span>
        <label>表示スタイル:</label>
        <button @click="indicatorStyle = 'dot'" :class="{ active: indicatorStyle === 'dot' }">
          点
        </button>
        <button @click="indicatorStyle = 'bar'" :class="{ active: indicatorStyle === 'bar' }">
          棒
        </button>
      </div>
    </div>

    <VCalendar
      :attributes="attributes"
      :locale="calendarLocale"
      @dayclick="handleDayClick"
      @update:pages="handlePageUpdate"
      expanded
    />

    <BaseModal :show="isModalOpen" @close="isModalOpen = false">
      <DailyLogViewer
        v-if="modalMode === 'viewer'"
        :logs="dailyLogs"
        @add-new="onAddNew"
        @edit-log="onEditLog"
        @delete-log="onDeleteLog"
      />
      <LogEditor
        v-if="modalMode === 'editor'"
        :date="selectedDate"
        :log-data="editingLog"
        @close="isModalOpen = false"
      />
    </BaseModal>
  </div>
</template>

<style scoped>
.calendar-container {
  margin-top: 30px;
}
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.calendar-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}
.calendar-controls label {
  font-size: 14px;
  color: #555;
}
.calendar-controls button {
  padding: 4px 10px;
  border: 1px solid #ccc;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;
}
.calendar-controls button.active {
  background-color: #42b883;
  color: white;
  border-color: #42b883;
}
.divider {
  color: #ccc;
}

.viewed-month-wage {
  font-size: 16px;
  background-color: #f0f2f5;
  padding: 8px 12px;
  border-radius: 6px;
}
.viewed-month-wage strong {
  color: #2c3e50;
}

.tag-wage-details {
  background-color: #f0f2f5;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 15px;
}
.tag-wage-details ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}
.tag-wage-details li {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}
.tag-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>

<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useLogStore } from '@/stores/logStore'
import { useTagStore } from '@/stores/tagStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useHolidayService } from '@/services/holidayService'
import BaseModal from './BaseModal.vue'
import LogEditor from './LogEditor.vue'
import DailyLogViewer from './DailyLogViewer.vue'

const logStore = useLogStore()
const tagStore = useTagStore()
const settingsStore = useSettingsStore()
const { holidays, isHoliday } = useHolidayService()

const isModalOpen = ref(false)
const selectedDate = ref(null)

// --- ✨ 2. 모달의 상태를 제어할 변수들 추가 ---
const modalMode = ref('viewer') // 'viewer' 또는 'editor'
const dailyLogs = ref([]) // 일일 요약에 보여줄 로그들
const editingLog = ref(null) // 편집할 특정 로그
// --- ✨ 1. 새로운 UI 제어용 상태 변수 추가 ---
const indicatorStyle = ref('bar') // 'dot' 또는 'bar'
const weekStartDay = ref(2) // 1: 일요일, 2: 월요일

// ✨ 설정 컨트롤 표시 여부 상태 추가
const showCalendarSettings = ref(false)



const calendarLocale = computed(() => ({
  id: 'ja', // 일본어 로케일 사용
  firstDayOfWeek: weekStartDay.value,
  masks: {
    weekdays: 'W', // 요일을 한 글자로 (日, 月...)
  },
}))

const attributes = computed(() => {
  const logAttributes = logStore.allLogsSorted.map((log) => {
    const tag = tagStore.getTagById(log.tagId)
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
  if (settingsStore.viewedDate && tagStore.tags.length > 0) {
    const year = settingsStore.viewedDate.getFullYear()
    const month = settingsStore.viewedDate.getMonth()
    tagStore.tags.forEach((tag) => {
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

  const holidayAttributes = holidays.value ? Object.entries(holidays.value).map(([date, name]) => ({
    key: `holiday-${date}`,
    highlight: { color: 'red', fillMode: 'light' },
    dates: new Date(date),
    popover: { label: name },
    order: 1,
  })) : [];

  const saturdayAttributes = {
    key: 'saturdays',
    highlight: { color: 'blue', fillMode: 'light' },
    dates: { repeat: { weekdays: 7 } }, // 토요일
    order: 0,
  };

  const sundayAttributes = {
    key: 'sundays',
    highlight: { color: 'red', fillMode: 'light' },
    dates: { repeat: { weekdays: 1 } }, // 일요일
    order: 0,
  };

  return [
    {
      key: 'today',
      highlight: { fillMode: 'outline', color: '#42b883' },
      dates: new Date(),
      order: 5,
    },
    ...logAttributes,
    ...paydayAttributes,
    ...holidayAttributes,
    saturdayAttributes,
    sundayAttributes,
  ]
})
const calendarViewDate = computed(() => settingsStore.viewedDate)

// 1. 달력이 바뀌면 스토어의 setViewedDate 액션을 직접 호출합니다.
const handlePageUpdate = (pages) => {
  if (pages && pages.length > 0) {
    settingsStore.setViewedDate(pages[0].viewDate)
  }
}

import { formatCurrency } from '@/utils/formatters'

const handleDayClick = (day) => {
  // .toISOString() 대신, 로컬 시간대 기준으로 문자열 생성
  const date = day.date
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${dayOfMonth}`
  const logsForDay = logStore.getLogsByDate(dateStr)

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
const isDeleteConfirmOpen = ref(false)
const logToDelete = ref(null)

const requestDeleteLog = (log) => {
  logToDelete.value = log // ✨ log 객체를 그대로 저장
  isDeleteConfirmOpen.value = true
}
const confirmDelete = () => {
  // ✨ 수정 3: 저장된 log 객체에서 id와 date를 추출하여 올바르게 전달
  if (logToDelete.value) {
    logStore.deleteLog(logToDelete.value.id, logToDelete.value.date)
  }

  isDeleteConfirmOpen.value = false
  isModalOpen.value = false // 원래 모달도 닫기
}
</script>
<template>
  <div class="calendar-container">
    <div class="header-bar">
      <h2>勤務カレンダー</h2>
      <!-- ✨ 설정 토글 버튼 추가 -->
      <button @click="showCalendarSettings = !showCalendarSettings" class="settings-toggle-btn">
        {{ showCalendarSettings ? '設定を隠す' : '設定を表示' }}
      </button>
    </div>

    <!-- ✨ 설정 컨트롤을 v-show로 감싸고, 모바일에서만 보이도록 클래스 추가 -->
    <div v-show="showCalendarSettings" class="calendar-controls">
      <label>週の開始曜日:</label><br />
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

    

    <VCalendar
      :attributes="attributes"
      :locale="calendarLocale"
      @dayclick="handleDayClick"
      @update:pages="handlePageUpdate"
      expanded
    />

    <BaseModal :show="isModalOpen" @close="isModalOpen = false">
      <DailyLogViewer
        @request-delete-log="requestDeleteLog"
        v-if="modalMode === 'viewer'"
        :logs="dailyLogs"
        @add-new="onAddNew"
        @edit-log="onEditLog"
      />
      <LogEditor
        v-if="modalMode === 'editor'"
        :date="selectedDate"
        :log-data="editingLog"
        @close="isModalOpen = false"
      />
    </BaseModal>

    <BaseModal :show="isDeleteConfirmOpen" @close="isDeleteConfirmOpen = false">
      <div class="confirm-dialog">
        <h4>記録を削除</h4>
        <p>この記録を本当に削除しますか？<br />この操作は元に戻せません。</p>
        <div class="confirm-buttons">
          <button class="cancel-btn" @click="isDeleteConfirmOpen = false">キャンセル</button>
          <button class="delete-btn" @click="confirmDelete">削除</button>
        </div>
      </div>
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

/* 설정 토글 버튼 스타일 */
.settings-toggle-btn {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
}

/* 모바일 (기본) 스타일 */
@media (max-width: 768px) {
  .header-bar {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
  }
  .calendar-controls {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    margin-top: 10px;
    padding: 10px;
    border: 1px solid #eee;
    border-radius: 8px;
    background-color: #f9f9f9;
  }
  .calendar-controls label {
    width: 100%;
    text-align: left;
  }
  .calendar-controls button {
    width: 100%;
    padding: 8px;
  }
  .divider {
    display: none;
  }
  .calendar-container {
    margin-top: 15px;
    padding: 10px;
  }
}

/* PC (1024px 이상) 스타일 */
@media (min-width: 1024px) {
  .settings-toggle-btn {
    display: none; /* PC에서는 설정 토글 버튼 숨기기 */
  }
  /* PC에서는 calendar-controls를 항상 보이도록 */
  .calendar-controls {
    display: flex !important; /* PC에서는 항상 보이도록 */
    flex-direction: row;
    align-items: center;
    width: auto;
    margin-top: 0;
    padding: 0;
    border: none;
    background-color: transparent;
  }
  .calendar-controls label {
    width: auto;
    text-align: left;
  }
  .calendar-controls button {
    width: auto;
    padding: 4px 10px;
  }
  .divider {
    display: inline; /* PC에서는 다시 보이도록 */
  }
}


</style>

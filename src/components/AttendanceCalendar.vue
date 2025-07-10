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

const calendarViewDate = computed(() => store.viewedDate)

const onDeleteLog = (logId) => {
  if (confirm('이 기록을 정말 삭제하시겠습니까?')) {
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

// 달력의 dot 표시를 위한 attributes는 그대로 유지해야 합니다.
const attributes = computed(() => {
  // 1. 각 근무 기록(log)을 순회하며 개별 점(dot) 속성을 만듭니다.
  const logAttributes = store.attendanceLogs.map((log) => {
    const tag = store.getTagById(log.tagId)
    const [year, month, day] = log.date.split('-').map(Number)

    return {
      key: log.id, // 각 기록의 고유 ID를 key로 사용
      dot: tag ? tag.color : 'gray', // 점의 색상을 직접 지정
      dates: new Date(year, month - 1, day),
    }
  })

  // 2. '오늘' 표시 속성과 합쳐서 최종 반환합니다.
  return [
    {
      key: 'today',
      highlight: true,
      dates: new Date(),
    },
    ...logAttributes,
  ]
})
</script>

<template>
  <div class="calendar-container">
    <div class="header-bar">
      <h2>근무 달력</h2>
      <div v-if="calendarViewDate" class="viewed-month-wage">
        {{ calendarViewDate.getFullYear() }}년 {{ calendarViewDate.getMonth() + 1 }}월 수입:
        <strong>{{ formatCurrency(store.viewedMonthWage) }}</strong>
      </div>
    </div>

    <VCalendar
      :attributes="attributes"
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
.viewed-month-wage {
  font-size: 16px;
  background-color: #f0f2f5;
  padding: 8px 12px;
  border-radius: 6px;
}
.viewed-month-wage strong {
  color: #2c3e50;
}
</style>

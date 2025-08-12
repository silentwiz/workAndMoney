<script setup>
import { ref, onUnmounted, onMounted, computed } from 'vue' // computed 추가
import SummaryDashboard from '@/components/SummaryDashboard.vue'
import AttendanceCalendar from '@/components/AttendanceCalendar.vue'
import LogList from '@/components/LogList.vue'
import BaseModal from '@/components/BaseModal.vue'
import SettingsEditor from '@/components/SettingsEditor.vue'
import TagSummary from '@/components/TagSummary.vue'
import FloatingSaveButton from '@/components/FloatingSaveButton.vue'
import { useLogStore } from '@/stores/logStore'
import { useTagStore } from '@/stores/tagStore'
import { formatLogsForExport } from '@/utils/formatters' // formatters import

const logStore = useLogStore()
const tagStore = useTagStore()

const isSettingsModalOpen = ref(false)
const isExportModalOpen = ref(false) // 내보내기 모달 상태
const exportedText = ref('') // 내보낼 텍스트
const showLiveControls = ref(false)

// 저장 피드백 관련 상태
const saveStatus = ref('') // '', 'saving', 'success', 'error'
const saveMessage = ref('')

// 실시간 근무 기록 관련 상태 및 함수
const selectedLiveTagId = ref(null)
const liveStatusMessage = ref('待機中')
const liveWorkedTime = ref('00:00:00')
let timerInterval = null

const handleSave = async () => {
  saveStatus.value = 'saving'
  saveMessage.value = '保存中...'
  const result = await logStore.saveDataToServer()
  if (result.success) {
    saveStatus.value = 'success'
    saveMessage.value = '保存しました！'
  } else {
    saveStatus.value = 'error'
    saveMessage.value = `エラー: ${result.message}`
  }
  setTimeout(() => {
    saveStatus.value = ''
    saveMessage.value = ''
  }, 3000)
}

// 내보내기 버튼 핸들러
const handleExport = () => {
  const sortedLogs = logStore.allLogsSorted.sort((a, b) => new Date(a.date + 'T' + a.start) - new Date(b.date + 'T' + b.start));
  exportedText.value = formatLogsForExport(sortedLogs)
  isExportModalOpen.value = true
}

const updateLiveTime = () => {
  if (logStore.trackingStartTime) {
    const now = new Date()
    let elapsedMilliseconds = now.getTime() - logStore.trackingStartTime.getTime()

    if (logStore.restStartTime) {
      elapsedMilliseconds -= now.getTime() - logStore.restStartTime.getTime()
    }

    const totalRestMs = logStore.accumulatedRestMinutes * 60 * 1000
    elapsedMilliseconds -= totalRestMs

    const hours = Math.floor(elapsedMilliseconds / (1000 * 60 * 60))
    const minutes = Math.floor((elapsedMilliseconds % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsedMilliseconds % (1000 * 60)) / 1000)

    liveWorkedTime.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds,
    ).padStart(2, '0')}`
  }
}

const startWork = () => {
  if (!selectedLiveTagId.value) {
    alert('職場を選択してください。')
    return
  }
  logStore.startTracking(selectedLiveTagId.value)
  liveStatusMessage.value = '勤務中'
  timerInterval = setInterval(updateLiveTime, 1000)
}

const startRest = () => {
  logStore.startRest()
  liveStatusMessage.value = '休憩中'
}

const endRest = () => {
  logStore.endRest()
  liveStatusMessage.value = '勤務中'
}

const endWork = async () => {
  saveStatus.value = 'saving'
  saveMessage.value = '保存中...'
  const result = await logStore.endTracking()
  if (result.success) {
    saveStatus.value = 'success'
    saveMessage.value = '勤務記録を保存しました。'
  } else {
    saveStatus.value = 'error'
    saveMessage.value = `エラー: ${result.message}`
  }

  liveStatusMessage.value = '待機中'
  clearInterval(timerInterval)
  liveWorkedTime.value = '00:00:00'
  selectedLiveTagId.value = null

  setTimeout(() => {
    saveStatus.value = ''
    saveMessage.value = ''
  }, 3000)
}

onUnmounted(() => {
  clearInterval(timerInterval)
})

onMounted(() => {
  if (logStore.isTracking) {
    selectedLiveTagId.value = logStore.liveTagId
    liveStatusMessage.value = '勤務中'
    timerInterval = setInterval(updateLiveTime, 1000)
  }
  if (logStore.isResting) {
    liveStatusMessage.value = '休憩中'
  }
})
</script>

<template>
  <main class="home-layout">
    <FloatingSaveButton
      :status="saveStatus"
      :message="saveMessage"
      @save="handleSave"
      :has-unsaved-changes="logStore.hasUnsavedChanges"
      text="保存"
    />
    <div class="main-content">
      <div class="main-header">
        <h1>勤怠管理</h1>
        <div class="header-controls">
          <button class="export-button" @click="handleExport">📤 エクスポート</button>
          <button class="settings-button" @click="isSettingsModalOpen = true">⚙️設定</button>
        </div>
      </div>
      <AttendanceCalendar />
      <SummaryDashboard />
      <TagSummary />
      <!-- ✨ 실시간 근무 기록 컨트롤 -->
      <div class="live-tracking-controls">
        <div class="status-display" @click="showLiveControls = !showLiveControls">
          <span class="status-label">状態:</span>
          <span class="current-status">{{ liveStatusMessage }}</span>
          <span class="worked-time">{{ liveWorkedTime }}</span>
          <span class="toggle-icon">{{ showLiveControls ? '▲' : '▼' }}</span>
        </div>
        <div class="control-buttons" v-show="showLiveControls">
          <select v-model="selectedLiveTagId" :disabled="logStore.isTracking">
            <option :value="null" disabled>職場選択</option>
            <option v-for="tag in tagStore.tags" :key="tag.id" :value="tag.id">
              {{ tag.name }}
            </option>
          </select>
          <button
            @click="logStore.isTracking ? endWork() : startWork()"
            :disabled="logStore.isResting || (!logStore.isTracking && !selectedLiveTagId)"
            :class="{ 'start-btn': !logStore.isTracking, 'end-btn': logStore.isTracking }"
          >
            {{ logStore.isTracking ? '勤務終了' : '勤務開始' }}
          </button>
          <button
            @click="logStore.isResting ? endRest() : startRest()"
            :disabled="!logStore.isTracking"
            :class="{ 'rest-btn': true }"
          >
            {{ logStore.isResting ? '休憩終了' : '休憩開始' }}
          </button>
        </div>
      </div>
      <LogList />
    </div>

    <BaseModal :show="isSettingsModalOpen" @close="isSettingsModalOpen = false">
      <SettingsEditor />
    </BaseModal>

    <!-- 내보내기 모달 -->
    <BaseModal :show="isExportModalOpen" @close="isExportModalOpen = false">
      <div class="export-modal-content">
        <h3>勤務記録のエクスポート</h3>
        <p>以下のテキストをコピーして使用してください。</p>
        <textarea readonly :value="exportedText" rows="15"></textarea>
      </div>
    </BaseModal>
  </main>
</template>

<style scoped>
.home-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.main-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 20px;
}

.header-controls {
  position: absolute;
  right: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

h1 {
  margin: 0;
}

.settings-button,
.export-button {
  padding: 8px 12px;
  font-size: 14px;
  background-color: #f0f2f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}

/* ✨ 실시간 근무 기록 컨트롤 스타일 */
.live-tracking-controls {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1em;
  font-weight: bold;
  cursor: pointer; /* 토글 가능하도록 커서 변경 */
}

.toggle-icon {
  margin-left: auto; /* 아이콘을 오른쪽으로 정렬 */
  font-size: 0.8em;
}

.current-status {
  color: #42b883;
}

.worked-time {
  background-color: #eee;
  padding: 5px 10px;
  border-radius: 4px;
  font-family: 'monospace';
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.control-buttons select {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.control-buttons button {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  font-weight: bold;
}

.control-buttons button.start-btn {
  background-color: #42b883;
}

.control-buttons button.rest-btn {
  background-color: #ffc107; /* 경고색 */
}

.control-buttons button.end-btn {
  background-color: #e53935; /* 에러색 */
}

.control-buttons button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 내보내기 모달 스타일 */
.export-modal-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.export-modal-content h3 {
  margin: 0;
  text-align: center;
}
.export-modal-content textarea {
  width: 100%;
  min-height: 200px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: 'monospace';
  white-space: pre;
  box-sizing: border-box;
}

/* 데스크탑 레이아웃 */
@media (min-width: 768px) {
  .home-layout {
    flex-direction: column; /* 데스크탑에서도 컬럼 방향 유지 */
    align-items: center; /* 중앙 정렬 */
  }

  .main-content {
    width: 100%; /* 메인 콘텐츠가 전체 너비 차지 */
    max-width: 1000px; /* 최대 너비 설정 */
  }

  /* 데스크탑에서는 컨트롤 버튼 항상 표시 */
  .control-buttons {
    display: flex !important; /* v-show를 오버라이드 */
  }

  .status-display {
    cursor: default; /* 데스크탑에서는 클릭 비활성화 */
  }

  .toggle-icon {
    display: none; /* 데스크탑에서는 토글 아이콘 숨김 */
  }
}

/* 모바일 반응형 */
@media (max-width: 767px) {
  .control-buttons {
    flex-direction: column;
  }
  .control-buttons select,
  .control-buttons button {
    width: 100%;
  }
}
</style>

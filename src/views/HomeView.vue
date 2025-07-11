<script setup>
import { ref } from 'vue' // ref를 import 합니다.
import SummaryDashboard from '@/components/SummaryDashboard.vue'
import AttendanceCalendar from '@/components/AttendanceCalendar.vue'
import LogList from '@/components/LogList.vue'
import BaseModal from '@/components/BaseModal.vue' // 모달 컴포넌트 import
import SettingsEditor from '@/components/SettingsEditor.vue' // 이름 바꾼 설정 에디터 import
import TagSummary from '@/components/TagSummary.vue'

// 설정 모달의 열림/닫힘 상태를 관리합니다.
const isSettingsModalOpen = ref(false)
</script>

<template>
  <main>
    <div class="main-header">
      <h1>勤怠管理</h1>
      <button class="settings-button" @click="isSettingsModalOpen = true">⚙️設定</button>
    </div>

    <SummaryDashboard />
    <TagSummary />
    <AttendanceCalendar />
    <LogList />
    <BaseModal :show="isSettingsModalOpen" @close="isSettingsModalOpen = false">
      <SettingsEditor />
    </BaseModal>
  </main>
</template>

<style scoped>
main {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}
/* 새로운 스타일 추가 */
.main-header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  margin-bottom: 20px;
}
h1 {
  margin: 0;
}
.settings-button {
  position: absolute;
  right: 0;
  padding: 8px 12px;
  font-size: 14px;
  background-color: #f0f2f5;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}
</style>

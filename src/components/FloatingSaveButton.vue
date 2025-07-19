<template>
  <div class="floating-save-container">
    <transition name="fade">
      <div v-if="message" :class="['save-message', status]">{{ message }}</div>
    </transition>
    <button @click="handleClick" :class="['fab', status, { 'blink': hasUnsavedChanges && status === '' }]" :disabled="status === 'saving'">
      <transition name="fade" mode="out-in">
        <div v-if="status === 'saving'" class="spinner"></div>
        <span v-else-if="status === 'success'">✓</span>
        <span v-else-if="status === 'error'">✗</span>
        <span v-else>☁️</span>
      </transition>
      <span v-if="text" class="fab-text">{{ text }}</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  status: String, // '', 'saving', 'success', 'error'
  message: String,
  hasUnsavedChanges: Boolean, // ✨ 미저장 변경 사항 여부
  text: String, // ✨ 버튼 텍스트
})

const emit = defineEmits(['save'])

const handleClick = () => {
  emit('save')
}
</script>

<style scoped>
.floating-save-container {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.fab {
  width: 90px;   /* 120px * 0.75 */
  height: 90px;  /* 120px * 0.75 */
  border-radius: 45px; /* 60px * 0.75 */
  background-color: #42b883;
  color: white;
  border: none;
  display: flex;
  flex-direction: column; /* 아이콘과 텍스트를 세로로 정렬 */
  justify-content: center;
  align-items: center;
  font-size: 36px; /* 48px * 0.75 */
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3); /* 0 8px 24px * 0.75 */
  cursor: pointer;
  transition: all 0.3s ease;
}

.fab-text {
  font-size: 14px; /* 18px * 0.75 (약 13.5px, 가독성을 위해 14px로 조정) */
  margin-top: 5px; /* 아이콘과 텍스트 사이 간격 */
}

/* 깜빡임 애니메이션 */
@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.fab.blink {
  animation: blink 1s infinite;
}

.fab:hover {
  background-color: #36a374;
  transform: scale(1.05);
}

.fab.saving {
  background-color: #ffc107;
  cursor: not-allowed;
}

.fab.success {
  background-color: #4caf50;
}

.fab.error {
  background-color: #e53935;
}

.save-message {
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.save-message.saving {
  background-color: #ffc107;
}

.save-message.success {
  background-color: #4caf50;
}

.save-message.error {
  background-color: #e53935;
}

/* Spinner Animation */
.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  width: 28px;
  height: 28px;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

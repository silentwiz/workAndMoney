<template>
  <div class="floating-save-container">
    <transition name="fade">
      <div v-if="message" :class="['save-message', status]">{{ message }}</div>
    </transition>
    <button @click="handleClick" :class="['fab', status]" :disabled="status === 'saving'">
      <transition name="fade" mode="out-in">
        <div v-if="status === 'saving'" class="spinner"></div>
        <span v-else-if="status === 'success'">✓</span>
        <span v-else-if="status === 'error'">✗</span>
        <span v-else>💾</span>
      </transition>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  status: String, // '', 'saving', 'success', 'error'
  message: String,
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
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #42b883;
  color: white;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
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

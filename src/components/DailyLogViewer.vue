<script setup>
defineProps({
  logs: { type: Array, required: true }, // 해당 날짜의 근무 기록 배열
})
const emit = defineEmits(['edit-log', 'add-new', 'delete-log']) // 수정 또는 추가 이벤트를 부모에게 알림
</script>

<template>
  <div class="viewer-container">
    <h3>기록 목록</h3>
    <ul class="log-list">
      <li v-for="log in logs" :key="log.id">
        <span>{{ log.start }} - {{ log.end }}</span>
        <div class="buttons">
          <button @click="emit('edit-log', log)">수정</button>
          <button class="delete-btn" @click="emit('delete-log', log.id)">삭제</button>
        </div>
      </li>
    </ul>
    <button class="add-new-btn" @click="emit('add-new')">이 날짜에 새 기록 추가</button>
  </div>
</template>

<style scoped>
.viewer-container {
  text-align: center;
}
h3 {
  margin-bottom: 15px;
}
.log-list {
  list-style: none;
  padding: 0;
  margin-bottom: 20px;
}
li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #eee;
}
.add-new-btn {
  width: 100%;
  padding: 10px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
}
.buttons {
  display: flex;
  gap: 8px;
}
.delete-btn {
  background-color: #e53935; /* 빨간색 계열 */
}
</style>

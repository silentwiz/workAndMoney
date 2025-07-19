<script setup>
import { computed } from 'vue'
import { useHolidayService } from '@/services/holidayService'

const { isHoliday } = useHolidayService()

const emit = defineEmits(['edit-log', 'add-new', 'request-delete-log']) // 수정 또는 추가 이벤트를 부모에게 알림

const props = defineProps({
  logs: { type: Array, required: true }, // 해당 날짜의 근무 기록 배열
  date: { type: Date, required: true }, // 선택된 날짜
})
const formattedDate = computed(() => {
  const date = props.date;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${dayOfMonth}`;
});

const holidayName = computed(() => {
  const date = props.date
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${dayOfMonth}`
  return isHoliday(dateStr) || null
})
</script>

<template>
  <div class="viewer-container">
    <h3>記録</h3>
    <p>{{ formattedDate }} <span v-if="holidayName" class="holiday-name">{{ holidayName }}</span></p>
    <ul class="log-list">
      <li v-for="log in logs" :key="log.id">
        <span>{{ log.start }} - {{ log.end }}</span>
        <div class="buttons">
          <button @click="emit('edit-log', log)">修正</button>
          <button class="delete-btn" @click="emit('request-delete-log', log)">削除</button>
        </div>
      </li>
    </ul>
    <button class="add-new-btn" @click="emit('add-new')">新しい記録追加</button>
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
.holiday-name {
  color: red;
  font-weight: bold;
  margin-left: 5px;
}
</style>

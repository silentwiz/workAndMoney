<script setup>
import { ref, watchEffect } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'

const props = defineProps({
  date: { type: Date, required: true },
  // 수정할 로그 데이터를 optional prop으로 받음
  logData: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const store = useAttendanceStore()

// 입력 필드 상태
const startTime = ref('')
const endTime = ref('')
const selectedTagId = ref(null)
const logId = ref(null)

watchEffect(() => {
  if (props.logData) {
    // 수정 모드: 기존 데이터로 폼을 채움
    startTime.value = props.logData.start
    endTime.value = props.logData.end
    selectedTagId.value = props.logData.tagId
    logId.value = props.logData.id
  } else {
    // 추가 모드: 폼을 기본값으로 리셋
    startTime.value = '09:00'
    endTime.value = '18:00'
    selectedTagId.value = null
    logId.value = null
  }
})

// YYYY-MM-DD 형식으로 날짜 포맷
//const formattedDate = props.date.toISOString().slice(0, 10)
const date = props.date
const year = date.getFullYear()
const month = String(date.getMonth() + 1).padStart(2, '0')
const dayOfMonth = String(date.getDate()).padStart(2, '0')
const formattedDate = `${year}-${month}-${dayOfMonth}`
const handleSubmit = () => {
  if (startTime.value && endTime.value && selectedTagId.value) {
    // 이제 Pinia 스토어의 addLog 액션에 날짜 정보도 함께 전달해야 합니다.
    // (이후 스토어 코드를 수정할 예정)
    store.saveLog({
      id: logId.value,
      date: formattedDate, // 선택된 날짜
      start: startTime.value,
      end: endTime.value,
      tagId: selectedTagId.value,
    })
    emit('close') // 저장 후 모달 닫기 이벤트 발생
  } else {
    alert('職場と勤務時間を入力してください')
  }
}
</script>

<template>
  <div>
    <h3>{{ formattedDate }}の出勤記録</h3>
    <div class="log-editor-form">
      <select v-model="selectedTagId">
        <option :value="null" disabled>職場選択</option>
        <option v-for="tag in store.tags" :key="tag.id" :value="tag.id">
          {{ tag.name }}
        </option>
      </select>
      <input type="time" v-model="startTime" />
      <span>~</span>
      <input type="time" v-model="endTime" />
      <button @click="handleSubmit">保存</button>
    </div>
  </div>
</template>

<style scoped>
h3 {
  text-align: center;
  margin-bottom: 20px;
}
.log-editor-form {
  display: flex;
  gap: 10px;
  align-items: center;
}
select,
input {
  padding: 8px;
}
button {
  padding: 8px 15px;
  border: none;
  background-color: #42b883;
  color: white;
  border-radius: 4px;
}
</style>

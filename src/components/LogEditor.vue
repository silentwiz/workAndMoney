<script setup>
import { ref, watchEffect } from 'vue'
import { useLogStore } from '@/stores/logStore'
import { useTagStore } from '@/stores/tagStore'

const props = defineProps({
  date: { type: Date, required: true },
  // 수정할 로그 데이터를 optional prop으로 받음
  logData: { type: Object, default: null },
  holidayName: { type: String, default: null }, // 이 부분 추가
})
const emit = defineEmits(['close'])
const logStore = useLogStore()
const tagStore = useTagStore()

// 입력 필드 상태
const startTime = ref('')
const endTime = ref('')
const selectedTagId = ref(null)
const logId = ref(null)
const restMinutes = ref(0)
const expenses = ref(0) // ✨ 지출 상태 변수
const validationError = ref('')

watchEffect(() => {
  if (props.logData) {
    // 수정 모드: 기존 데이터로 폼을 채움
    startTime.value = props.logData.start
    endTime.value = props.logData.end
    selectedTagId.value = props.logData.tagId
    restMinutes.value = props.logData.restMinutes || 0
    expenses.value = props.logData.expenses || 0
    logId.value = props.logData.id
  } else {
    // 추가 모드: 폼을 기본값으로 리셋
    startTime.value = '09:00'
    endTime.value = '18:00'
    selectedTagId.value = null
    restMinutes.value = 0
    expenses.value = 0
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
  if (!selectedTagId.value) {
    validationError.value = '職場を選択してください。' // ✨ 구체적인 에러 메시지 설정
    return
  }
  if (!startTime.value || !endTime.value) {
    validationError.value = '勤務時間を入力してください。'
    return
  }

  validationError.value = '' // ✨ 성공 시 에러 메시지 초기화
  logStore.saveLog({
    id: logId.value,
    date: formattedDate, // 선택된 날짜
    start: startTime.value,
    end: endTime.value,
    tagId: selectedTagId.value,
    restMinutes: Number(restMinutes.value),
    expenses: Number(expenses.value),
  })
  emit('close')
}
</script>

<template>
  <div>
    <h3>{{ formattedDate }}の出勤記録 <span v-if="holidayName" class="holiday-name">{{ holidayName }}</span></h3>
    <div class="log-editor-form">
      <select v-model="selectedTagId">
        <option :value="null" disabled>職場選択</option>
        <option v-for="tag in tagStore.tags" :key="tag.id" :value="tag.id">
          {{ tag.name }}
        </option>
      </select>
      <input type="time" v-model="startTime" />
      <span>~</span>
      <input type="time" v-model="endTime" />
      <div class="rest-input">
        <label for="rest-time">休憩</label>
        <select id="rest-time" v-model="restMinutes">
          <option value="0">0</option>
          <option value="30">30</option>
          <option value="60">60</option>
          <option value="90">90</option>
          <option value="120">120</option>
        </select>
        <span>分</span>
      </div>
      <div class="expense-input">
        <label for="expense">支出</label>
        <input id="expense" type="number" v-model="expenses" min="0" step="100" />
        <span>円</span>
      </div>
      <div v-if="validationError" class="error-message">{{ validationError }}</div>
      <button @click="handleSubmit">保存</button>
    </div>
  </div>
</template>

<style scoped>
.error-message {
  color: #e53935; /* 빨간색 */
  text-align: center;
  margin-top: 10px;
}
.holiday-display {
  text-align: center;
  margin-top: -10px; /* h3과의 간격 조절 */
  margin-bottom: 10px;
  font-size: 0.9em;
  color: #666;
}
.holiday-name {
  color: red;
  font-weight: bold;
}
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
.rest-input {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #ccc;
  padding: 0 8px;
  border-radius: 4px;
}
.rest-input input {
  border: none;
  width: 50px;
  text-align: right;
  padding: 8px 0;
}
.rest-input label {
  font-size: 14px;
  color: #555;
}
/* Chrome/Safari에서 number input의 화살표 제거 */
input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.expense-input {
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #ccc;
  padding: 0 8px;
  border-radius: 4px;
}
.expense-input input {
  border: none;
  width: 70px;
  text-align: right;
  padding: 8px 0;
}
.expense-input label {
  font-size: 14px;
  color: #555;
}

@media (max-width: 768px) {
  .log-editor-form {
    flex-direction: column; /* 세로로 쌓기 */
    align-items: stretch; /* 가로로 꽉 채우기 */
  }
  .log-editor-form > * {
    /* 모든 자식 요소에 적용 */
    width: 100%;
  }
  .rest-input input,
  .rest-input select {
    width: auto;
    flex-grow: 1; /* 남은 공간 모두 차지 */
  }
  .expense-input {
    display: flex;
    align-items: center;
    gap: 5px;
    border: 1px solid #ccc;
    padding: 0 8px;
    border-radius: 4px;
  }
  .expense-input input {
    border: none;
    width: 100%;
    text-align: right;
    padding: 8px 0;
  }
  .expense-input label {
    font-size: 14px;
    color: #555;
  }
}
</style>

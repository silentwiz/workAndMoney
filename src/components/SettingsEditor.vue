<script setup>
import { ref } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'

const store = useAttendanceStore()

// 태그 생성용 상태 변수들
const newTag = ref({
  name: '',
  color: '#42b883',
  baseRate: 1000,
  nightRate: 1500,
  weekendRate: 1500,
})

const handleAddTag = () => {
  if (newTag.value.name) {
    store.addTag({ ...newTag.value })
    // 입력 필드 초기화
    newTag.value.name = ''
  }
}

// 태그의 시급 정보를 업데이트하는 함수
const handleRateUpdate = (tag, field, value) => {
  store.updateTag({
    id: tag.id,
    [field]: Number(value),
  })
}
</script>

<template>
  <div class="container">
    <h3>職場設定</h3>

    <div
      v-for="tag in store.tags"
      :key="tag.id"
      class="tag-editor-item"
      :style="{ borderLeftColor: tag.color }"
    >
      <div class="tag-name">{{ tag.name }}</div>
      <div class="rate-inputs">
        <label
          >基本:
          <input
            type="number"
            :value="tag.baseRate"
            @input="handleRateUpdate(tag, 'baseRate', $event.target.value)"
          />
          円</label
        >
        <label
          >夜間:
          <input
            type="number"
            :value="tag.nightRate"
            @input="handleRateUpdate(tag, 'nightRate', $event.target.value)"
          />
          円</label
        >
        <label
          >週末:
          <input
            type="number"
            :value="tag.weekendRate"
            @input="handleRateUpdate(tag, 'weekendRate', $event.target.value)"
          />
          円</label
        >
      </div>
    </div>

    <div class="section new-tag-section">
      <h4>職場追加</h4>
      <input type="text" v-model="newTag.name" placeholder="職場名" />
      <input type="color" v-model="newTag.color" />
      <div class="rate-inputs">
        <label>基本時給: <input type="number" v-model="newTag.baseRate" /> 円</label>
        <label>夜間時給: <input type="number" v-model="newTag.nightRate" /> 円</label>
        <label>週末時給: <input type="number" v-model="newTag.weekendRate" /> 円</label>
      </div>
      <button @click="handleAddTag">追加</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 10px;
}
h3,
h4 {
  margin-bottom: 15px;
}
.tag-editor-item {
  border-left: 5px solid;
  padding: 10px;
  margin-bottom: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
.tag-name {
  font-weight: bold;
  margin-bottom: 10px;
}
.rate-inputs {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}
.rate-inputs label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}
.rate-inputs input {
  width: 80px;
}
.new-tag-section {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}
.new-tag-section > input[type='text'] {
  margin-right: 10px;
}
.new-tag-section .rate-inputs {
  margin: 10px 0;
}
</style>

<script setup>
import { computed, ref } from 'vue'
import { useAttendanceStore } from '@/stores/attendance'

const store = useAttendanceStore()
const fileInput = ref(null)

// --- 시급 설정을 위한 로직 ---
const hourlyRate = computed({
  get: () => store.hourlyRate,
  set: (value) => store.updateHourlyRate(Number(value)),
})

// --- 할증 설정을 위한 로직 ---
const isWeekendEnabled = computed({
  get: () => store.bonusSettings.isWeekendEnabled,
  set: (value) => store.updateBonusSettings({ isWeekendEnabled: value }),
})
const weekendRate = computed({
  get: () => store.bonusSettings.weekendRate,
  set: (value) => store.updateBonusSettings({ weekendRate: Number(value) }),
})
const isNightEnabled = computed({
  get: () => store.bonusSettings.isNightEnabled,
  set: (value) => store.updateBonusSettings({ isNightEnabled: value }),
})
const nightRate = computed({
  get: () => store.bonusSettings.nightRate,
  set: (value) => store.updateBonusSettings({ nightRate: Number(value) }),
})

// --- 태그 생성을 위한 로직 ---
const newTagName = ref('')
const newTagColor = ref('#42b883')

const handleAddTag = () => {
  if (newTagName.value) {
    store.addTag({ name: newTagName.value, color: newTagColor.value })
    newTagName.value = ''
  }
}

// ✨ 내보내기 버튼을 위한 핸들러 추가
const handleExport = () => {
  store.exportUserData()
}

// ✨ 파일 가져오기를 위한 핸들러 추가
const handleImport = () => {
  const file = fileInput.value.files[0]
  if (!file) {
    alert('파일을 선택해주세요.')
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    store.importUserData(event.target.result)
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="container">
    <div class="section">
      <h3>💾 데이터 관리</h3>
      <div class="input-group">
        <button @click="handleExport">데이터 내보내기 (JSON)</button>
      </div>
      <p class="description">현재 사용자의 모든 기록과 설정을 JSON 파일로 저장합니다.</p>

      <div class="input-group import-group">
        <input type="file" ref="fileInput" accept=".json" />
        <button @click="handleImport">데이터 가져오기</button>
      </div>
      <p class="description">JSON 파일로부터 데이터를 불러옵니다. 현재 데이터는 덮어씌워집니다.</p>
    </div>
  </div>

  <div class="container">
    <div class="section">
      <h3>⚙️ 설정</h3>
      <div class="setting-group">
        <label for="hourly-rate">시급:</label>
        <input id="hourly-rate" type="number" v-model="hourlyRate" /> 원
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" v-model="isWeekendEnabled" />
          주말 할증 (토/일)
        </label>
        <input type="number" v-model="weekendRate" step="0.1" :disabled="!isWeekendEnabled" /> 배
      </div>
      <div class="setting-group">
        <label>
          <input type="checkbox" v-model="isNightEnabled" />
          야간 할증 (22시-06시)
        </label>
        <input type="number" v-model="nightRate" step="0.1" :disabled="!isNightEnabled" /> 배
      </div>
    </div>

    <div class="section">
      <h3># 태그 생성</h3>
      <div class="input-group tag-creator">
        <input type="text" v-model="newTagName" placeholder="태그 이름 (예: 근무지 A)" />
        <input type="color" v-model="newTagColor" />
        <button @click="handleAddTag">태그 추가</button>
      </div>
      <div class="tag-list">
        <span
          v-for="tag in store.tags"
          :key="tag.id"
          class="tag-badge"
          :style="{ backgroundColor: tag.color }"
        >
          {{ tag.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 여기에 필요한 스타일을 추가합니다. */
.container {
  padding: 10px;
}
.section {
  margin-bottom: 25px;
}
h3 {
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
.setting-group,
.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
input[type='number'] {
  width: 70px;
}
input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 8px 15px;
  border: none;
  background-color: #42b883;
  color: white;
  border-radius: 4px;
  cursor: pointer;
}
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 15px;
}
.tag-badge {
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}
.description {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}
.import-group {
  margin-top: 15px;
}
</style>

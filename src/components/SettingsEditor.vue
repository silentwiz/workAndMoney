<script setup>
import { ref } from 'vue'
import { useTagStore } from '@/stores/tagStore'
import BaseModal from './BaseModal.vue' // 모달 컴포넌트 import

const tagStore = useTagStore()

// --- 상태 변수 ---
const isModalOpen = ref(false) // 모달 열림/닫힘 상태
const editingTag = ref(null) // 현재 수정 중인 태그 데이터
const saveMessage = ref('') // ✨ 저장 메시지 상태 추가

// '상세 설정' 버튼을 눌렀을 때 실행될 함수
const openEditModal = (tag) => {
  // 수정할 태그 데이터를 직접 참조하도록 변경
  editingTag.value = tag
  isModalOpen.value = true
}

// 모달 안에서 '저장' 버튼을 눌렀을 때 실행될 함수
const handleUpdateTag = () => {
  if (editingTag.value) {
    tagStore.updateTag(editingTag.value)
    saveMessage.value = '保存されました！' // ✨ 저장 성공 메시지 설정
    setTimeout(() => {
      saveMessage.value = '' // 2초 후 메시지 지우기
      isModalOpen.value = false // 메시지 사라진 후 모달 닫기
    }, 2000)
  } else {
    isModalOpen.value = false // 태그가 없으면 바로 모달 닫기
  }
}


// 새 태그 추가 로직 (기본값 설정)
const newTag = ref({
  name: '',
  color: '#42b883',
  baseRate: 1000,
  nightRate: 1500,
  weekendRate: 1500,
  weekendNightRate: 1800,
  payday: 25,
  periodStartDay: 1,
  nightStartHour: 22,
  nightEndHour: 6,
})

const handleAddTag = () => {
  if (newTag.value.name) {
    tagStore.addTag({ ...newTag.value })
    // 입력 필드 초기화
    newTag.value.name = ''
  }
}
</script>

<template>
  <div class="container">
    <h3># 職場(タグ)別設定</h3>

    <div v-for="tag in tagStore.tags" :key="tag.id" class="tag-item">
      <span class="tag-badge" :style="{ backgroundColor: tag.color }">{{ tag.name }}</span>
      <button @click="openEditModal(tag)">詳細設定</button>
    </div>

    <div class="section new-tag-section">
      <h4>新しい職場(タグ)追加</h4>
      <div class="input-row">
        <input type="text" v-model="newTag.name" placeholder="職場名" />
        <input type="color" v-model="newTag.color" />
      </div>
      <button @click="handleAddTag" class="add-button">追加</button>
    </div>

    <BaseModal :show="isModalOpen" @close="isModalOpen = false">
      <div v-if="editingTag" class="edit-modal-content">
        <h4>「{{ editingTag.name }}」設定</h4>

        <div class="setting-group">
          <h5>時給設定</h5>
          <label>基本: <input type="number" v-model="editingTag.baseRate" /> 円</label>
          <label>夜間: <input type="number" v-model="editingTag.nightRate" /> 円</label>
          <label>週末: <input type="number" v-model="editingTag.weekendRate" /> 円</label>
          <label>週末夜間: <input type="number" v-model="editingTag.weekendNightRate" /> 円</label>
        </div>

        <div class="setting-group">
          <h5>日付/時間設定</h5>
          <label>給料日: 毎月 <input type="number" v-model="editingTag.payday" /> 日</label>
          <label>締め日: 毎月 <input type="number" v-model="editingTag.periodStartDay" /> 日</label>
          <label
            >夜間時間: <input type="number" v-model="editingTag.nightStartHour" /> 時から
            <input type="number" v-model="editingTag.nightEndHour" /> 時まで</label
          >
        </div>

        <button @click="handleUpdateTag" class="save-button">保存</button>
        <p v-if="saveMessage" class="save-message">{{ saveMessage }}</p> <!-- ✨ 메시지 표시 요소 추가 -->
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.container {
  padding: 10px;
}
h3,
h4,
h5 {
  margin-top: 0;
  margin-bottom: 15px;
}
.tag-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin-bottom: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
.tag-badge {
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
}
.new-tag-section {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}
.input-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.input-row input[type='text'] {
  flex-grow: 1;
}
.add-button {
  background-color: #42b883;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
}
/* 모달 내부 스타일 */
.edit-modal-content {
  padding: 10px;
}
.setting-group {
  margin-bottom: 20px;
}
.setting-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
}
.setting-group input {
  width: 70px;
  margin: 0 5px;
}
.save-button {
  width: 100%;
  padding: 10px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
} /* --- 모바일 반응형 스타일 --- */
.save-message {
  text-align: center;
  color: #42b883; /* 초록색 */
  margin-top: 10px;
  font-weight: bold;
}
@media (max-width: 768px) {
  .rate-inputs {
    flex-direction: column; /* 세로로 쌓기 */
    align-items: stretch; /* 가로로 꽉 채우기 */
  }
  .rate-inputs label {
    justify-content: space-between; /* 라벨과 입력 필드 양쪽 정렬 */
  }
  .rate-inputs input {
    width: 120px; /* 입력 필드 너비 조정 */
  }
}
</style>

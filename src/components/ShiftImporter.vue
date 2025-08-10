<script setup>
import { ref } from 'vue'
import { useLogStore } from '@/stores/logStore'
import { useTagStore } from '@/stores/tagStore'
import { useSettingsStore } from '@/stores/settingsStore'

const logStore = useLogStore()
const tagStore = useTagStore()
const settingsStore = useSettingsStore() // 캘린더의 현재 년도를 가져오기 위해 사용

// --- UI와 연결될 상태 변수들 ---
const selectedTagId = ref(null) // 사용자가 선택한 직장(태그)의 ID
const shiftText = ref('') // 사용자가 붙여넣을 텍스트
const statusMessage = ref('') // 처리 결과 메시지

/**
 * '가져오기' 버튼을 눌렀을 때 실행될 메인 함수
 */
const importAndSaveShifts = async () => {
  // 1. 기본 유효성 검사
  if (!selectedTagId.value) {
    statusMessage.value = '職場を選択してください'
    return
  }
  const lines = shiftText.value.trim().split('\n')
  if (lines.length === 0 || shiftText.value.trim() === '') {
    statusMessage.value = '入力されたデータがありません'
    return
  }

  statusMessage.value = '処理中。。。。。。'
  let successCount = 0
  let errorCount = 0

  // 2. 캘린더가 보고 있는 년도를 기준으로 날짜를 생성 (가장 정확함)
  const targetYear = new Date().getFullYear()

  // 3. 각 라인을 순회하며 파싱 및 저장
  for (const line of lines) {
    // 정규식을 사용해 월, 일, 시작시간, 종료시간 추출
    const match = line.match(/(\d{2})\/(\d{2}).*?(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/)

    if (match) {
      try {
        const [, month, day, startTime, endTime] = match
        const dateStr = `${targetYear}-${month}-${day}`

        // 4. logStore의 saveLog가 요구하는 형식에 맞춰 데이터 객체 생성
        const logData = {
          // id는 saveLog에서 자동으로 생성되므로 null로 전달
          id: null,
          date: dateStr,
          start: startTime,
          end: endTime,
          tagId: selectedTagId.value,
          restMinutes: 0, // 기본 휴게시간 0분
          expenses: 0, // 기본 지출 0원
        }

        // 5. saveLog 액션 호출! (급여 계산이 여기서 자동으로 이루어짐)
        await logStore.saveLog(logData)
        successCount++
      } catch (e) {
        console.error(`処理失敗(line: ${line}):`, e)
        errorCount++
      }
    }
  }

  // 6. 최종 결과 메시지 표시
  statusMessage.value = `完了: ${successCount}件成功, ${errorCount}件失敗`
  if (errorCount === 0) {
    shiftText.value = '' // 성공 시 텍스트 초기화
  }
}
</script>

<template>
  <div class="importer-container">
    <h3>勤務記録の一括登録</h3>
    <div class="form-group">
      <label for="workplace-select">① 職場を選択</label>
      <select id="workplace-select" v-model="selectedTagId">
        <option :value="null" disabled>-- 選択してください --</option>
        <option v-for="tag in tagStore.tags" :key="tag.id" :value="tag.id">
          {{ tag.name }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label for="shift-text">② 勤務記録を貼り付け</label>
      <textarea
        id="shift-text"
        v-model="shiftText"
        rows="15"
        placeholder="08/01（金）07:00 - 12:00
08/03（日）07:00 - 15:00
..."
      ></textarea>
    </div>

    <button class="import-button" @click="importAndSaveShifts">上記の内容で記録する</button>

    <p v-if="statusMessage" class="status-message">{{ statusMessage }}</p>
  </div>
</template>

<style scoped>
.importer-container {
  margin-top: 2rem;
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
}
.importer-container h3 {
  margin-top: 0;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 1rem;
}
.form-group {
  margin: 1.5rem 0;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 1rem;
}
select,
textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 1rem;
}
textarea {
  font-family: monospace;
}
.import-button {
  width: 100%;
  padding: 1rem;
  border: none;
  background-color: #4f46e5;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  transition: background-color 0.2s;
}
.import-button:hover {
  background-color: #4338ca;
}
.status-message {
  margin-top: 1rem;
  text-align: center;
  font-weight: bold;
}
</style>

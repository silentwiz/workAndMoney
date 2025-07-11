<script setup>
import { ref } from 'vue'

const emit = defineEmits(['user-selected'])

// 전체 사용자 목록은 'app_users' 라는 키로 따로 관리
const users = ref(JSON.parse(localStorage.getItem('app_users')) || [])
const newUsername = ref('')

const addUser = () => {
  if (newUsername.value && !users.value.includes(newUsername.value)) {
    users.value.push(newUsername.value)
    localStorage.setItem('app_users', JSON.stringify(users.value))
    newUsername.value = ''
  }
}

const selectUser = (username) => {
  emit('user-selected', username)
}
</script>

<template>
  <div class="user-profile-container">
    <div class="card">
      <h2>ログイン</h2>
      <p>利用者を選択または追加してください、</p>

      <div class="user-list">
        <button v-for="user in users" :key="user" @click="selectUser(user)">
          {{ user }}
        </button>
      </div>

      <div class="add-user-form">
        <input type="text" v-model="newUsername" placeholder="お名前" @keyup.enter="addUser" />
        <button @click="addUser">利用者追加</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
}
.card {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}
.user-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
}
.user-list button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
.add-user-form {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.add-user-form input {
  flex-grow: 1;
  padding: 10px;
}
</style>

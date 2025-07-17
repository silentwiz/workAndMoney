<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { useAttendanceStore } from '@/stores/attendance'
import UserProfile from '@/views/UserProfile.vue'

const store = useAttendanceStore()
const currentUser = ref(null)

const handleUserSelected = async (username) => {
  currentUser.value = username
  await store.loadUser(username)
}

const handleLogout = () => {
  store.logout()
  currentUser.value = null
}
</script>

<template>
  <UserProfile v-if="!currentUser" @user-selected="handleUserSelected" />

  <div v-else>
    <header class="app-header">
      <span
        ><strong>{{ currentUser }}</strong
        >さん、お疲れ様です！</span
      >
      <button @click="handleLogout">ログアウト</button>
    </header>
    <RouterView />
    <a href="https://www.flaticon.com/kr/free-icons/-" title="재정적 인 아이콘"
      >재정적 인 아이콘 제작자: juicy_fish - Flaticon</a
    >
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background-color: #333;
  color: white;
}
.app-header button {
  background-color: #555;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
</style>

<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import UserProfile from '@/views/UserProfile.vue'

const userStore = useUserStore()
const currentUser = ref(null)

const handleUserSelected = async (username) => {
  currentUser.value = username
  await userStore.loadUser(username)
}

const handleLogout = () => {
  userStore.logout()
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

    <footer class="app-footer">
      <p>&copy; {{ new Date().getFullYear() }} HyunJuwon. All rights reserved.</p>
      <p class="flaticon-attribution">
        <a href="https://www.flaticon.com/kr/free-icons/-" title="재정적 인 아이콘"
          >재정적 인 아이콘 제작자: juicy_fish - Flaticon</a
        >
      </p>
    </footer>
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

.app-footer {
  text-align: center;
  padding: 15px;
  margin-top: 30px;
  background-color: #f0f0f0;
  color: #555;
  font-size: 0.85em;
  border-top: 1px solid #eee;
}

.flaticon-attribution {
  font-size: 0.75em;
  margin-top: 5px;
}
</style>

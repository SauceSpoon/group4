<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_BASE = 'http://localhost:3000/api'

const friends = ref([])
const searchQuery = ref('')
const searchResults = ref([])

const fetchFriends = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/friends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) friends.value = data
  } catch (err) {
    console.error('获取好友失败:', err)
  }
}

const searchUsers = async () => {
  if (!searchQuery.value.trim()) return
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/friends/search?q=${encodeURIComponent(searchQuery.value)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) searchResults.value = data
  } catch (err) {
    console.error('搜索失败:', err)
  }
}

const addFriend = async (friendId) => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/friends/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ friendId })
    })
    const data = await res.json()
    alert(data.message || '已添加')
    if (res.ok) {
      searchResults.value = []
      searchQuery.value = ''
      fetchFriends()
    }
  } catch (err) {
    alert('添加失败')
  }
}

const goChat = (friendId) => {
  router.push(`/chat?friendId=${friendId}`)
}

onMounted(() => {
  fetchFriends()
})
</script>

<template>
  <div class="friends-page">
    <h2>👥 我的好友</h2>

    <div class="search-box">
      <input v-model="searchQuery" @keyup.enter="searchUsers" placeholder="搜索用户名或邮箱添加好友..." />
      <button @click="searchUsers">搜索</button>
    </div>

    <div v-if="searchResults.length > 0" class="search-results">
      <h4>搜索结果</h4>
      <div v-for="user in searchResults" :key="user._id" class="user-item">
        <span>{{ user.username }}</span>
        <button @click="addFriend(user._id)">+ 加好友</button>
      </div>
    </div>

    <div class="friend-list">
      <div v-if="friends.length === 0" class="empty">还没有好友，去搜索添加吧~</div>
      <div v-for="friend in friends" :key="friend._id" class="friend-card" @click="goChat(friend._id)">
        <div class="avatar">{{ friend.username[0] }}</div>
        <div class="info">
          <div class="name">{{ friend.username }}</div>
          <div class="hint">点击开始聊天</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.friends-page {
  max-width: 800px;
  margin: 30px auto;
  padding: 0 20px;
}

h2 {
  color: #303133;
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-box input {
  flex: 1;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.search-box button {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-results {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.user-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.user-item button {
  background: #67c23a;
  color: white;
  border: none;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.friend-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.friend-card {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.3s;
}

.friend-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.avatar {
  width: 45px;
  height: 45px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
}

.name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.empty {
  text-align: center;
  padding: 50px;
  color: #909399;
}
</style>
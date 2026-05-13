<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../i18n.js'

const router = useRouter()
const API_BASE = 'https://ent-project-d3ge03zdx1e71b66a-1424722488.ap-shanghai.app.tcloudbase.com/api'

const friends = ref([])
const searchQuery = ref('')
const searchResults = ref([])
const unreadMap = ref({})
const totalUnread = ref(0)

let unreadTimer = null

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

const fetchUnread = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/friends/unread`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) {
      unreadMap.value = data.byFriend || {}
      totalUnread.value = data.total || 0
    }
  } catch (err) {
    console.error('获取未读失败:', err)
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
    alert(data.message || t('friends.added'))
    if (res.ok) {
      searchResults.value = []
      searchQuery.value = ''
      fetchFriends()
    }
  } catch (err) {
    alert(t('friends.addFail'))
  }
}

const goChat = (friendId) => {
  router.push(`/chat?friendId=${friendId}`)
}

onMounted(() => {
  fetchFriends()
  fetchUnread()
  unreadTimer = setInterval(fetchUnread, 5000)
})

onUnmounted(() => {
  if (unreadTimer) clearInterval(unreadTimer)
})
</script>

<template>
  <div class="friends-page">
    <!-- 新增：返回主页按钮 -->
    <div class="top-bar">
      <button class="back-btn" @click="router.push('/')"></button>
    </div>

    <h2>
      {{ t('friends.title') }}
      <span v-if="totalUnread > 0" class="total-badge">
        {{ totalUnread > 99 ? '99+' : totalUnread }}
      </span>
    </h2>

    <div class="search-box">
      <input v-model="searchQuery" @keyup.enter="searchUsers" :placeholder="t('friends.search')" />
      <button @click="searchUsers">{{ t('friends.searchBtn') }}</button>
    </div>

    <div v-if="searchResults.length > 0" class="search-results">
      <h4>{{ t('friends.results') }}</h4>
      <div v-for="user in searchResults" :key="user.id" class="user-item">
        <span>{{ user.username }}</span>
        <button @click="addFriend(user.id)">{{ t('friends.add') }}</button>
      </div>
    </div>

    <div class="friend-list">
      <div v-if="friends.length === 0" class="empty">{{ t('friends.empty') }}</div>
      <div 
        v-for="friend in friends" 
        :key="friend._id" 
        class="friend-card" 
        @click="goChat(friend._id)"
      >
        <img v-if="friend.avatar" :src="friend.avatar" class="avatar-img" />
        <div v-else class="avatar-text">{{ friend.username?.[0] || '?' }}</div>
        
        <div class="info">
          <div class="name">{{ friend.username }}</div>
          <div class="hint">{{ t('friends.chatHint') }}</div>
        </div>

        <div v-if="unreadMap[friend._id]" class="unread-badge">
          {{ unreadMap[friend._id] > 99 ? '99+' : unreadMap[friend._id] }}
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

/* 新增：返回栏 */
.top-bar {
  margin-bottom: 15px;
}

.back-btn {
  width: 120px;
  height: 54px;
  background: url('/back-bubble-v2.png') no-repeat center center;
  background-size: contain;
  border: none;
  cursor: pointer;
  transition: transform 0.2s;
  padding: 0;
}

.back-btn:hover {
  transform: scale(1.05);
}

h2 {
  color: #303133;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.total-badge {
  background: #f56c6c;
  color: white;
  font-size: 12px;
  font-weight: bold;
  min-width: 22px;
  height: 22px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
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
  position: relative;
}

.friend-card:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.avatar-img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar-text {
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
  flex-shrink: 0;
}

.info {
  flex: 1;
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

.unread-badge {
  background: #f56c6c;
  color: white;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  flex-shrink: 0;
}

.empty {
  text-align: center;
  padding: 50px;
  color: #909399;
}
</style>
<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { io } from 'socket.io-client'

const route = useRoute()
const API_BASE = 'http://localhost:3000'
const socket = io(API_BASE)

const messages = ref([])
const newMessage = ref('')
const friendId = ref(route.query.friendId || '')

// 当前用户
const currentUser = ref({})
const currentUserId = ref('')

const friendInfo = ref({})

const messagesContainer = ref(null)

const fetchMessages = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/api/friends/messages/${friendId.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) {
      messages.value = data
      scrollToBottom()
    }
  } catch (err) {
    console.error('获取消息失败:', err)
  }
}

const fetchFriendInfo = async () => {
  // 从好友列表里找，或者单独请求
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/api/friends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const friends = await res.json()
    const f = friends.find(f => f._id === friendId.value)
    if (f) friendInfo.value = f
  } catch (err) {}
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return
  
  const messageData = {
    sender: currentUserId.value,
    receiver: friendId.value,
    content: newMessage.value,
    createdAt: new Date().toISOString()
  }

  socket.emit('send_private', messageData)
  newMessage.value = ''
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  // 读取当前用户
  const userStr = localStorage.getItem('user')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
    currentUserId.value = currentUser.value.id
  }

  // 加入自己的房间
  socket.emit('join_private', currentUserId.value)

  // 接收实时消息
  socket.on('receive_private', (data) => {
    // 只显示和当前好友相关的消息
    if (
      (data.sender === friendId.value && data.receiver === currentUserId.value) ||
      (data.sender === currentUserId.value && data.receiver === friendId.value)
    ) {
      messages.value.push(data)
      scrollToBottom()
    }
  })

  fetchFriendInfo()
  fetchMessages()
})

onUnmounted(() => {
  socket.disconnect()
})
</script>

<template>
  <div class="chat-page">
    <div class="chat-header">
      <h3>💬 {{ friendInfo.username || '聊天' }}</h3>
    </div>

    <div class="messages" ref="messagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg._id || msg.createdAt"
        :class="['msg-bubble', msg.sender?._id === currentUserId || msg.sender === currentUserId ? 'me' : 'other']"
      >
        <div class="msg-content">{{ msg.content }}</div>
        <div class="msg-time">{{ new Date(msg.createdAt).toLocaleTimeString() }}</div>
      </div>
    </div>

    <div class="input-area">
      <input 
        v-model="newMessage" 
        @keyup.enter="sendMessage"
        placeholder="输入消息..." 
      />
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<style scoped>
.chat-page {
  max-width: 800px;
  margin: 20px auto;
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

.chat-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background: #409eff;
  color: white;
}

.chat-header h3 {
  margin: 0;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f5f7fa;
}

.msg-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 12px;
  word-break: break-word;
}

.msg-bubble.other {
  align-self: flex-start;
  background: #fff;
  border: 1px solid #e4e7ed;
}

.msg-bubble.me {
  align-self: flex-end;
  background: #409eff;
  color: white;
}

.msg-content {
  font-size: 14px;
  line-height: 1.5;
}

.msg-time {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.6;
}

.input-area {
  padding: 15px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  background: #fff;
}

.input-area input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 20px;
  outline: none;
}

.input-area button {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
</style>
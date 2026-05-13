<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n.js'

const route = useRoute()
const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE || ''

const messages = ref([])
const newMessage = ref('')
const friendId = ref(route.query.friendId || '')

const currentUser = ref({})
const currentUserId = ref('')

const friendInfo = ref({})
const messagesContainer = ref(null)
let pollTimer = null

const chatImages = ref([])
const showImagePreview = ref(false)
const previewImage = ref('')

const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.5) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height)
            height = maxHeight
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const fileToBase64 = (file) => compressImage(file, 400, 400, 0.5)

const fetchMessages = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/friends/messages/${friendId.value}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) {
      messages.value = data
      scrollToBottom()
      markAsRead()
    }
  } catch (err) {
    console.error('获取消息失败:', err)
  }
}

const markAsRead = async () => {
  const token = localStorage.getItem('token')
  try {
    await fetch(`${API_BASE}/friends/messages/read/${friendId.value}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  } catch (err) {}
}

const fetchFriendInfo = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/friends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const friends = await res.json()
    const f = friends.find(f => f._id === friendId.value)
    if (f) friendInfo.value = f
  } catch (err) {}
}

const sendMessage = async () => {
  if (!newMessage.value.trim() && chatImages.value.length === 0) return
  
  const token = localStorage.getItem('token')
  
  let imageList = []
  if (chatImages.value.length > 0) {
    imageList = await Promise.all(
      chatImages.value.map(file => fileToBase64(file))
    )
  }

  const messageData = {
    sender: currentUserId.value,
    receiver: friendId.value,
    content: newMessage.value.trim(),
    images: imageList
  }

  try {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(messageData)
    })
    
    if (res.ok) {
      newMessage.value = ''
      chatImages.value = []
      await fetchMessages()
    } else {
      alert(t('chat.sendFail'))
    }
  } catch (err) {
    alert(t('chat.sendFail'))
  }
}

const handleImageChange = (event) => {
  const files = Array.from(event.target.files)
  if (chatImages.value.length + files.length > 5) {
    alert('最多5张图片')
    return
  }
  chatImages.value.push(...files)
}

const removeImage = (index) => {
  chatImages.value.splice(index, 1)
}

const previewImg = (img) => {
  previewImage.value = img
  showImagePreview.value = true
}

const isMyMessage = (msg) => {
  return msg.sender_id === parseInt(currentUserId.value) || 
         msg.sender === parseInt(currentUserId.value) ||
         msg.sender?._id === currentUserId.value
}

const getSenderName = (msg) => {
  if (isMyMessage(msg)) {
    return msg.sender_username || currentUser.value.username || '我'
  }
  return msg.sender_username || friendInfo.value.username || '?'
}

const getSenderAvatar = (msg) => {
  if (isMyMessage(msg)) {
    return msg.sender_avatar || currentUser.value.avatar
  }
  return msg.sender_avatar || friendInfo.value.avatar
}

const formatTime = (dateStr) => {
  try {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isNaN(date)) return ''
    const localStr = dateStr.replace('Z', '')
    const localDate = new Date(localStr)
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    const hours = String(localDate.getHours()).padStart(2, '0')
    const minutes = String(localDate.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hours}:${minutes}`
  } catch {
    return ''
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

onMounted(() => {
  const userStr = localStorage.getItem('user')
  if (userStr) {
    currentUser.value = JSON.parse(userStr)
    currentUserId.value = currentUser.value.id
  }

  fetchFriendInfo()
  fetchMessages()

  pollTimer = setInterval(() => {
    fetchMessages()
  }, 3000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="chat-page">
    <!-- 新增：返回栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="router.back()"></button>
    </div>

    <div class="chat-header">
      <h3>💬 {{ friendInfo.username || 'Chat' }}</h3>
    </div>

    <div class="messages" ref="messagesContainer">
      <div 
        v-for="msg in messages" 
        :key="msg.id || msg._id || msg.created_at"
        :class="['msg-row', isMyMessage(msg) ? 'my-row' : 'friend-row']"
      >
        <div v-if="!isMyMessage(msg)" class="sender-info">
          <div class="sender-name">{{ getSenderName(msg) }}</div>
          <img v-if="getSenderAvatar(msg)" :src="getSenderAvatar(msg)" class="avatar-img" />
          <div v-else class="avatar-text friend-avatar-bg">
            {{ getSenderName(msg)?.[0] || '?' }}
          </div>
        </div>
        
        <div class="msg-content-wrapper">
          <div :class="['msg-bubble', isMyMessage(msg) ? 'my-bubble' : 'friend-bubble']">
            <div v-if="msg.content" class="msg-text">{{ msg.content }}</div>
            <div v-if="msg.images && msg.images.length > 0" class="msg-images">
              <img 
                v-for="(img, idx) in msg.images" 
                :key="idx"
                :src="img" 
                @click="previewImg(img)"
                class="chat-img"
              />
            </div>
          </div>
          <div class="msg-time">{{ formatTime(msg.created_at) }}</div>
        </div>

        <div v-if="isMyMessage(msg)" class="sender-info">
          <div class="sender-name">{{ getSenderName(msg) }}</div>
          <img v-if="getSenderAvatar(msg)" :src="getSenderAvatar(msg)" class="avatar-img" />
          <div v-else class="avatar-text my-avatar-bg">
            {{ getSenderName(msg)?.[0] || '我' }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="showImagePreview" class="image-preview-overlay" @click="showImagePreview = false">
      <img :src="previewImage" class="preview-img" />
    </div>

    <div class="input-area">
      <div v-if="chatImages.length > 0" class="selected-images">
        <div v-for="(file, idx) in chatImages" :key="idx" class="selected-img-item">
          <span>{{ file.name }}</span>
          <button @click="removeImage(idx)" class="remove-btn">✕</button>
        </div>
      </div>
      
      <div class="input-row">
        <input 
          v-model="newMessage" 
          @keyup.enter="sendMessage"
          :placeholder="t('chat.placeholder')" 
          class="message-input"
        />
        
        <label class="img-btn">
          📷
          <input 
            type="file" 
            multiple 
            accept="image/*" 
            @change="handleImageChange"
            style="display: none"
          />
        </label>
        
        <button @click="sendMessage" class="send-btn">{{ t('chat.send') }}</button>
      </div>
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

/* 新增：返回栏 */
.top-bar {
  padding: 10px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #eee;
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

.back-btn:active {
  transform: scale(0.95);
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
  gap: 15px;
  background: #f5f7fa;
}

.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 80%;
  margin-bottom: 5px;
}

.friend-row {
  align-self: flex-start;
}

.my-row {
  align-self: flex-end;
}

.sender-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 50px;
  flex-shrink: 0;
}

.sender-name {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
  max-width: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-text {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.friend-avatar-bg {
  background: #67c23a;
}

.my-avatar-bg {
  background: #409eff;
}

.msg-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg-bubble {
  padding: 10px 14px;
  border-radius: 12px;
  max-width: 100%;
  word-break: break-word;
}

.my-bubble {
  background: #95ec69;
  color: #333;
  border-bottom-right-radius: 4px;
}

.friend-bubble {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-bottom-left-radius: 4px;
}

.msg-text {
  font-size: 14px;
  line-height: 1.5;
}

.msg-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.chat-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.msg-time {
  font-size: 11px;
  color: #909399;
  text-align: right;
}

.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.preview-img {
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
}

.input-area {
  padding: 15px;
  border-top: 1px solid #eee;
  background: #fff;
}

.selected-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.selected-img-item {
  background: #f0f2f5;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.remove-btn {
  background: #f56c6c;
  color: white;
  border: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.input-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.message-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 20px;
  outline: none;
}

.img-btn {
  padding: 10px;
  background: #f0f2f5;
  border-radius: 50%;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.send-btn {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}
</style>
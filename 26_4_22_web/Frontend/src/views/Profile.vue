<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../i18n.js'

const router = useRouter()
const API_BASE = 'https://ent-project-d3ge03zdx1e71b66a-1424722488.ap-shanghai.app.tcloudbase.com/api'

const user = ref({})
const loading = ref(false)
const editing = ref(false)

const editForm = ref({
  username: '',
  avatar: ''
})

const previewAvatar = ref('')

const fetchUser = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/')
    return
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) {
      user.value = data
      editForm.value = {
        username: data.username,
        avatar: data.avatar || ''
      }
      previewAvatar.value = data.avatar || ''
    }
  } catch (err) {
    console.error('获取用户信息失败:', err)
  }
}

// ==================== 图片压缩相关 ====================

// 压缩图片：限制最大尺寸，降低质量
const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.5) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        
        // 等比例缩放
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
        
        // 压缩为 JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 将文件转为压缩后的 Base64
const fileToBase64 = (file) => {
  return compressImage(file, 400, 400, 0.5)
}

const handleAvatarChange = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const base64 = await fileToBase64(file)
  editForm.value.avatar = base64
  previewAvatar.value = base64
}

const handleUpdate = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        username: editForm.value.username,
        avatar: editForm.value.avatar
      })
    })
    
    const data = await res.json()
    if (res.ok) {
      // 更新本地存储
      localStorage.setItem('user', JSON.stringify(data))
      user.value = data
      editing.value = false
      alert('修改成功')
      // 刷新页面更新导航栏
      window.location.reload()
    } else {
      alert(data.message || '修改失败')
    }
  } catch (err) {
    alert('修改失败')
  }
}

onMounted(() => {
  fetchUser()
})
</script>

<template>
  <div class="profile-page">
    <div class="top-bar">
      <button class="back-btn" @click="router.back()"></button>
      <h2>👤 个人资料</h2>
    </div>

    <div v-if="!editing" class="profile-card">
      <div class="avatar-section">
        <img v-if="user.avatar" :src="user.avatar" class="profile-avatar" />
        <div v-else class="profile-avatar-text">{{ user.username?.[0] || '?' }}</div>
      </div>
      
      <div class="info-section">
        <div class="info-item">
          <label>用户名</label>
          <span>{{ user.username }}</span>
        </div>
        <div class="info-item">
          <label>邮箱</label>
          <span>{{ user.email }}</span>
        </div>
      </div>
      
      <button class="btn-edit" @click="editing = true">编辑资料</button>
    </div>

    <div v-else class="edit-card">
      <div class="avatar-edit">
        <img v-if="previewAvatar" :src="previewAvatar" class="preview-avatar" />
        <div v-else class="preview-avatar-text">{{ editForm.username?.[0] || '?' }}</div>
        
        <!-- 修复：加了 for 和 id/name -->
        <label for="avatar-input" class="upload-btn">
          📷 更换头像
          <input 
            id="avatar-input" 
            name="avatar" 
            type="file" 
            accept="image/*" 
            @change="handleAvatarChange" 
            style="display: none" 
          />
        </label>
      </div>
      
      <div class="form-group">
        <label>用户名</label>
        <input v-model="editForm.username" placeholder="输入用户名" />
      </div>
      
      <div class="actions">
        <button class="btn-save" @click="handleUpdate">保存</button>
        <button class="btn-cancel" @click="editing = false">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 30px auto;
  padding: 0 20px;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
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

.top-bar h2 {
  margin: 0;
  color: #303133;
}

.profile-card, .edit-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.avatar-section {
  text-align: center;
  margin-bottom: 30px;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-avatar-text {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  margin: 0 auto;
}

.info-section {
  margin-bottom: 30px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.info-item label {
  color: #909399;
  font-weight: bold;
}

.btn-edit {
  width: 100%;
  padding: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

/* 编辑模式 */
.avatar-edit {
  text-align: center;
  margin-bottom: 30px;
}

.preview-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
}

.preview-avatar-text {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  margin: 0 auto 15px;
}

.upload-btn {
  display: inline-block;
  padding: 8px 16px;
  background: #f0f2f5;
  border-radius: 20px;
  cursor: pointer;
  color: #606266;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #606266;
  font-weight: bold;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.btn-save {
  flex: 1;
  padding: 12px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.btn-cancel {
  flex: 1;
  padding: 12px;
  background: #f4f4f5;
  color: #606266;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}
</style>
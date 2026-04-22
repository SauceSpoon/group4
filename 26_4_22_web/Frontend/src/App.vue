<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = 'http://localhost:3000/api'

// ✅【已有】图片文件数组
const publishImages = ref([])
// ✅【已有】文件选择回调
const handleFileChange = (event) => {
  publishImages.value = Array.from(event.target.files)
}

// 登录注册相关
const showLogin = ref(false)
const showRegister = ref(false)
const isLoggedIn = ref(false)
const currentUser = ref(null)

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ username: '', email: '', password: '' })
const searchKeyword = ref('')

// 发布闲置相关
const showPublish = ref(false)
const publishForm = ref({
  title: '',
  price: '',
  tag: '数码',
  description: ''
})

const handleLogin = async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm.value)
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      isLoggedIn.value = true
      currentUser.value = data.user
      showLogin.value = false
      loginForm.value = { email: '', password: '' }
      alert('登录成功')
    } else {
      alert(data.message || '登录失败')
    }
  } catch (err) {
    alert('登录失败')
  }
}

const handleRegister = async () => {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerForm.value)
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      isLoggedIn.value = true
      currentUser.value = data.user
      showRegister.value = false
      registerForm.value = { username: '', email: '', password: '' }
      alert('注册成功')
    } else {
      alert(data.message || '注册失败')
    }
  } catch (err) {
    alert('注册失败')
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  isLoggedIn.value = false
  currentUser.value = null
  alert('已退出登录')
}

const handlePublish = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert('请先登录')
    showLogin.value = true
    return
  }

  try {
    const formData = new FormData()
    formData.append('title', publishForm.value.title)
    formData.append('price', publishForm.value.price)
    formData.append('tag', publishForm.value.tag)
    formData.append('description', publishForm.value.description)
    
    publishImages.value.forEach(file => {
      formData.append('images', file)
    })

    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    const data = await res.json()
    if (res.ok) {
      alert('发布成功')
      showPublish.value = false
      publishForm.value = { title: '', price: '', tag: '数码', description: '' }
      publishImages.value = []
      window.location.reload()
    } else {
      alert(data.message || '发布失败')
    }
  } catch (err) {
    alert('发布失败，请检查网络')
  }
}

const switchToRegister = () => {
  showLogin.value = false
  showRegister.value = true
}

const switchToLogin = () => {
  showRegister.value = false
  showLogin.value = true
}

const goSearch = () => {
  if (searchKeyword.value.trim()) {
    window.location.href = `/search?q=${encodeURIComponent(searchKeyword.value)}`
  }
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    isLoggedIn.value = true
  }
})
</script>

<template>
  <div class="page-container">
    <!-- 顶部导航栏（所有页面共享） -->
    <header class="navbar">
      <div class="logo" @click="$router.push('/')">🏫 校内二手街</div>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchKeyword"
          @keyup.enter="goSearch"
          placeholder="搜索闲置好物..." 
        />
        <button class="search-btn" @click="goSearch">搜索</button>
      </div>
      <div class="user-actions">
        <template v-if="!isLoggedIn">
          <button class="btn-login" @click="showLogin = true">登录</button>
          <button class="btn-register" @click="showRegister = true">注册</button>
        </template>
        <template v-else>
          <span class="user-name">{{ currentUser?.username || '用户' }}</span>
          <button class="btn-my" @click="$router.push('/my-products')">我的发布</button>
          <button class="btn-friends" @click="$router.push('/friends')">👥 好友</button>
          <button class="btn-publish" @click="showPublish = true">+ 发布闲置</button>
          <button class="btn-logout" @click="handleLogout">退出</button>
        </template>
      </div>
    </header>

    <!-- 路由出口：这里显示 Home / Detail / Search -->
    <router-view></router-view>

    <!-- ✅【修改】登录弹窗：v-if改成showLogin，加关闭按钮，遮罩层不响应点击 -->
    <div v-if="showLogin" class="modal-overlay">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>登录</h3>
          <button class="btn-close" @click="showLogin = false">✕</button>
        </div>
        <input v-model="loginForm.email" type="email" placeholder="邮箱" />
        <input v-model="loginForm.password" type="password" placeholder="密码" />
        <button class="btn-primary" @click="handleLogin">登录</button>
        <p class="switch-text">
          还没有账号？<a @click="switchToRegister">立即注册</a>
        </p>
      </div>
    </div>

    <!-- ✅【已有】注册弹窗：带关闭按钮，遮罩层无点击事件 -->
    <div v-if="showRegister" class="modal-overlay">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>注册</h3>
          <button class="btn-close" @click="showRegister = false">✕</button>
        </div>
        <input v-model="registerForm.username" placeholder="用户名" />
        <input v-model="registerForm.email" type="email" placeholder="邮箱" />
        <input v-model="registerForm.password" type="password" placeholder="密码" />
        <button class="btn-primary" @click="handleRegister">注册</button>
        <p class="switch-text">
          已有账号？<a @click="switchToLogin">立即登录</a>
        </p>
      </div>
    </div>

    <!-- ✅【已有】发布闲置弹窗 -->
    <div v-if="showPublish" class="modal-overlay" @click="showPublish = false">
      <div class="modal-box" @click.stop>
        <h3>发布闲置</h3>
        <input v-model="publishForm.title" placeholder="商品标题" />
        <input v-model="publishForm.price" type="number" placeholder="价格（元）" />
        <select v-model="publishForm.tag">
          <option value="数码">数码</option>
          <option value="书籍">书籍</option>
          <option value="出行">出行</option>
          <option value="生活">生活</option>
          <option value="乐器">乐器</option>
          <option value="服饰">服饰</option>
          <option value="美妆">美妆</option>
          <option value="其他">其他</option>
        </select>
        <div class="file-upload">
          <label for="file-input" class="file-label">📷 选择图片（最多5张）</label>
          <input 
            id="file-input" 
            type="file" 
            multiple 
            accept="image/*" 
            @change="handleFileChange"
          />
          <div v-if="publishImages.length > 0" class="file-list">
            <span v-for="(file, index) in publishImages" :key="index">{{ file.name }}</span>
          </div>
        </div>
        <textarea v-model="publishForm.description" placeholder="商品描述（可选）"></textarea>
        <button class="btn-primary" @click="handlePublish">立即发布</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 导航栏样式 */
.navbar {
  background-color: #fff;
  padding: 15px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.btn-my {
  background: #e6a23c;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-right: 40px;
  cursor: pointer;
}

.search-bar {
  flex: 1;
  display: flex;
  max-width: 500px;
}

.search-bar input {
  flex: 1;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-right: none;
  border-radius: 4px 0 0 4px;
  outline: none;
}

.search-btn {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
}

.user-actions {
  margin-left: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-login {
  background: transparent;
  border: 1px solid #dcdfe6;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-register {
  background: transparent;
  border: 1px solid #409eff;
  color: #409eff;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-publish {
  background: #67c23a;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-logout {
  background: #f56c6c;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.user-name {
  color: #409eff;
  font-weight: bold;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: #fff;
  padding: 30px;
  border-radius: 8px;
  width: 320px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modal-box h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #303133;
}

.modal-box input,
.modal-box select,
.modal-box textarea {
  width: 100%;
  margin: 10px 0;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 14px;
}

.modal-box textarea {
  height: 80px;
  resize: vertical;
  font-family: inherit;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}

.switch-text {
  text-align: center;
  margin-top: 15px;
  color: #909399;
  font-size: 14px;
}

.switch-text a {
  color: #409eff;
  cursor: pointer;
}

/* 图片上传样式 */
.file-upload {
  margin: 10px 0;
}

.file-label {
  display: block;
  padding: 10px;
  background: #f0f2f5;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s;
}

.file-label:hover {
  border-color: #409eff;
  color: #409eff;
}

.file-upload input[type="file"] {
  display: none;
}

.file-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.file-list span {
  background: #e6f7ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.btn-friends {
  background: #e6a23c;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

/* ✅【已有】弹窗头部和关闭按钮样式 */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  flex: 1;
  text-align: center;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f0f2f5;
  color: #303133;
}
</style>
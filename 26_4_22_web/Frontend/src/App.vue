<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { currentLang, toggleLang, t } from './i18n.js'

const router = useRouter()
const route = useRoute()
const API_BASE = 'https://ent-project-d3ge03zdx1e71b66a-1424722488.ap-shanghai.app.tcloudbase.com/api'

const showFab = computed(() => {
  return isLoggedIn.value && (route.path === '/' || route.path === '/my-products')
})

const publishImages = ref([])
const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 3) {
    alert('最多只能上传3张图片')
    publishImages.value = files.slice(0, 3)
  } else {
    publishImages.value = files
  }
}

const showLogin = ref(false)
const showRegister = ref(false)
const isLoggedIn = ref(false)
const currentUser = ref(null)
const showUserMenu = ref(false)

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ username: '', email: '', password: '', code: '' })
const searchKeyword = ref('')
const codeTimer = ref(0)

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
      alert(t('login.success') || '登录成功')
    } else {
      alert(data.message || t('login.fail'))
    }
  } catch (err) {
    alert(t('login.fail'))
  }
}

// 西浦邮箱验证
const isXJTLUEmail = (email) => {
  return email && (email.endsWith('@student.xjtlu.edu.cn') || email.endsWith('@xjtlu.edu.cn'))
}

// 发送验证码
const sendCode = async () => {
  if (!isXJTLUEmail(registerForm.value.email)) {
    alert('请输入西交利物浦大学邮箱 (@student.xjtlu.edu.cn 或 @xjtlu.edu.cn)')
    return
  }
  
  try {
    const res = await fetch(`${API_BASE}/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: registerForm.value.email })
    })
    const data = await res.json()
    
    if (res.ok) {
      alert(data.message)
      codeTimer.value = 60
      const timer = setInterval(() => {
        codeTimer.value--
        if (codeTimer.value <= 0) clearInterval(timer)
      }, 1000)
    } else {
      alert(data.message || '发送失败')
    }
  } catch (err) {
    alert('网络错误')
  }
}

const handleRegister = async () => {
  if (!registerForm.value.code || registerForm.value.code.length !== 6) {
    alert('请输入6位验证码')
    return
  }
  
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
      registerForm.value = { username: '', email: '', password: '', code: '' }
      alert(t('register.success') || '注册成功')
    } else {
      alert(data.message || t('register.fail'))
    }
  } catch (err) {
    alert(t('register.fail'))
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  isLoggedIn.value = false
  currentUser.value = null
  showUserMenu.value = false
  alert(t('nav.logoutSuccess') || '已退出登录')
}

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

const fileToBase64 = (file) => {
  return compressImage(file, 400, 400, 0.5)
}

const handlePublish = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert(t('login.please') || '请先登录')
    showLogin.value = true
    return
  }

  try {
    const base64Images = await Promise.all(
      publishImages.value.map(file => fileToBase64(file))
    )

    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: publishForm.value.title,
        price: publishForm.value.price,
        tag: publishForm.value.tag,
        description: publishForm.value.description,
        images: base64Images
      })
    })
    
    const data = await res.json()
    if (res.ok) {
      alert(t('publish.success'))
      showPublish.value = false
      publishForm.value = { title: '', price: '', tag: '数码', description: '' }
      publishImages.value = []
      window.location.reload()
    } else {
      alert(data.message || t('publish.fail'))
    }
  } catch (err) {
    alert(t('publish.fail'))
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
    router.push(`/search?q=${encodeURIComponent(searchKeyword.value)}`)
  }
}

const goMyProducts = () => {
  showUserMenu.value = false
  router.push('/my-products')
}

const goFriends = () => {
  showUserMenu.value = false
  router.push('/friends')
}

const goProfile = () => {
  showUserMenu.value = false
  router.push('/profile')
}

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (token) {
    isLoggedIn.value = true
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) {
        currentUser.value = data
        localStorage.setItem('user', JSON.stringify(data))
      } else {
        const userStr = localStorage.getItem('user')
        if (userStr) currentUser.value = JSON.parse(userStr)
      }
    } catch (err) {
      const userStr = localStorage.getItem('user')
      if (userStr) currentUser.value = JSON.parse(userStr)
    }
  }
})
</script>

<template>
  <div class="page-container">
    <!-- 顶部导航栏 -->
    <header class="navbar">
      <div class="nav-left">
        <div class="logo" @click="$router.push('/')">
          <img src="/logo-icon.png" class="logo-icon" />
          {{ t('nav.title') }}
        </div>
        <div class="search-bar">
          <input 
            type="text" 
            v-model="searchKeyword"
            @keyup.enter="goSearch"
            :placeholder="t('nav.search')" 
          />
          <button class="search-btn" @click="goSearch">{{ t('nav.searchBtn') }}</button>
        </div>
      </div>
      
      <div class="nav-right">
        <button class="btn-lang" @click="toggleLang">{{ t('nav.lang') }}</button>
        
        <template v-if="!isLoggedIn">
          <button class="btn-login" @click="showLogin = true">{{ t('nav.login') }}</button>
          <button class="btn-register" @click="showRegister = true">{{ t('nav.register') }}</button>
        </template>
        
        <template v-else>
          <div class="user-menu-wrapper">
            <button class="btn-user" @click="showUserMenu = !showUserMenu">
              <img v-if="currentUser?.avatar" :src="currentUser.avatar" class="nav-avatar" />
              <span v-else class="nav-avatar-text">{{ currentUser?.username?.[0] || '?' }}</span>
              <span class="username">{{ currentUser?.username || 'User' }}</span>
              <span class="arrow">▼</span>
            </button>
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="dropdown-item" @click="goProfile">
                👤 {{ t('nav.profile') }}
              </div>
              <div class="dropdown-item" @click="goMyProducts">
                📦 {{ t('nav.myPosts') }}
              </div>
              <div class="dropdown-item" @click="goFriends">
                👥 {{ t('nav.friends') }}
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item logout" @click="handleLogout">
                {{ t('nav.logout') }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </header>

    <!-- 路由出口 -->
    <router-view></router-view>

    <!-- 右下角悬浮发布按钮 -->
    <button v-if="showFab" class="fab-publish" @click="showPublish = true" title="发布闲置"></button>

    <!-- 登录弹窗 -->
    <div v-if="showLogin" class="modal-overlay">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>{{ t('login.title') }}</h3>
          <button class="btn-close" @click="showLogin = false">✕</button>
        </div>
        <input v-model="loginForm.email" type="email" :placeholder="t('login.email')" />
        <input v-model="loginForm.password" type="password" :placeholder="t('login.password')" />
        <button class="btn-primary" @click="handleLogin">{{ t('login.submit') }}</button>
        <p class="switch-text">
          {{ t('login.noAccount') }}<a @click="switchToRegister">{{ t('login.registerNow') }}</a>
        </p>
      </div>
    </div>

    <!-- 注册弹窗（带邮箱验证码） -->
    <div v-if="showRegister" class="modal-overlay">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>{{ t('register.title') }}</h3>
          <button class="btn-close" @click="showRegister = false">✕</button>
        </div>
        <input v-model="registerForm.username" :placeholder="t('register.username')" />
        
        <!-- 邮箱 + 验证码 -->
        <div class="email-row">
          <input 
            v-model="registerForm.email" 
            type="email" 
            placeholder="XJTLU邮箱 (@student.xjtlu.edu.cn)" 
            class="email-input"
          />
          <button 
            class="code-btn" 
            @click="sendCode" 
            :disabled="codeTimer > 0 || !isXJTLUEmail(registerForm.email)"
          >
            {{ codeTimer > 0 ? `${codeTimer}s` : t('register.sendCode') }}
          </button>
        </div>
        
        <input 
          v-model="registerForm.code" 
          :placeholder="t('register.code')" 
          maxlength="6"
        />
        
        <input v-model="registerForm.password" type="password" :placeholder="t('register.password')" />
        <button class="btn-primary" @click="handleRegister">{{ t('register.submit') }}</button>
        <p class="switch-text">
          {{ t('register.hasAccount') }}<a @click="switchToLogin">{{ t('register.loginNow') }}</a>
        </p>
      </div>
    </div>

    <!-- 发布闲置弹窗 -->
    <div v-if="showPublish" class="modal-overlay">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>{{ t('publish.title') }}</h3>
          <button class="btn-close" @click="showPublish = false">✕</button>
        </div>
        <input v-model="publishForm.title" :placeholder="t('publish.itemTitle')" />
        <input v-model="publishForm.price" type="number" :placeholder="t('publish.price')" />
        <select v-model="publishForm.tag">
          <option value="数码">Digital/数码</option>
          <option value="书籍">Books/书籍</option>
          <option value="出行">Travel/出行</option>
          <option value="生活">Life/生活</option>
          <option value="乐器">Instruments/乐器</option>
          <option value="服饰">Clothing/服饰</option>
          <option value="美妆">Beauty/美妆</option>
          <option value="其他">Others/其他</option>
        </select>
        <div class="file-upload">
          <label for="file-input" class="file-label">{{ t('publish.uploadImage') }}</label>
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
        <textarea v-model="publishForm.description" :placeholder="t('publish.description')"></textarea>
        <button class="btn-primary" @click="handlePublish">{{ t('publish.submit') }}</button>
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

.nav-left {
  display: flex;
  align-items: center;
  gap: 30px;
  flex: 1;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
  white-space: nowrap;
}

.search-bar {
  display: flex;
  max-width: 400px;
  flex: 1;
}

.search-bar input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #dcdfe6;
  border-right: none;
  border-radius: 20px 0 0 20px;
  outline: none;
  font-size: 14px;
}

.search-btn {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 0 20px 20px 0;
  cursor: pointer;
  font-size: 14px;
}

/* 语言切换按钮 */
.btn-lang {
  background: #f4f4f5;
  color: #606266;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
}

.btn-lang:hover {
  background: #e4e7ed;
}

/* 登录注册按钮 */
.btn-login {
  background: transparent;
  border: 1px solid #dcdfe6;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
}

.btn-register {
  background: #409eff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

/* 用户菜单 */
.user-menu-wrapper {
  position: relative;
}

.btn-user {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f0f2f5;
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  cursor: pointer;
}

.nav-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.nav-avatar-text {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.username {
  font-weight: bold;
  color: #303133;
}

.arrow {
  font-size: 10px;
  color: #909399;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 160px;
  z-index: 1000;
  overflow: hidden;
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 14px;
}

.dropdown-item:hover {
  background: #f5f7fa;
}

.dropdown-divider {
  height: 1px;
  background: #e4e7ed;
  margin: 4px 0;
}

.dropdown-item.logout {
  color: #f56c6c;
}

/* 右下角悬浮发布按钮 */
.fab-publish {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 80px;
  height: 80px;
  background: url('/publish-bubble.png') no-repeat center center;
  background-size: contain;
  border: none;
  cursor: pointer;
  transition: transform 0.3s;
  z-index: 999;
  padding: 0;
}

.fab-publish:hover {
  transform: scale(1.1);
}

.fab-publish:active {
  transform: scale(0.95);
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
  width: 340px;
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

/* 弹窗头部和关闭按钮样式 */
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

/* 邮箱验证码行 */
.email-row {
  display: flex;
  gap: 8px;
  margin: 10px 0;
}

.email-input {
  flex: 1;
  margin: 0 !important;
}

.code-btn {
  padding: 0 14px;
  background: #67c23a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
  height: 40px;
}

.code-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  cursor: pointer;
  white-space: nowrap;
}

.logo-icon {
  width: 48px;
  height: 48px;
}

</style>
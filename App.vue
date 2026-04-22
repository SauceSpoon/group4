<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = 'http://localhost:3000/api'

const productList = ref([])
const loading = ref(false)
const searchKeyword = ref('')

// 登录注册相关
const showLogin = ref(false)
const showRegister = ref(false)
const isLoggedIn = ref(false)
const currentUser = ref(null)

const loginForm = ref({ email: '', password: '' })
const registerForm = ref({ username: '', email: '', password: '' })

const fetchProducts = async (keyword = '') => {
  loading.value = true
  try {
    const url = keyword 
      ? `${API_BASE}/products?keyword=${encodeURIComponent(keyword)}`
      : `${API_BASE}/products`
    const res = await fetch(url)
    const data = await res.json()
    productList.value = data.data.map(item => ({
      id: item._id,
      title: item.title,
      price: item.price,
      tag: item.tag,
      img: item.images?.[0] || '📷'
    }))
  } catch (err) {
    console.error('获取商品失败:', err)
    productList.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchProducts(searchKeyword.value)
}

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
      isLoggedIn.value = true
      currentUser.value = data.user
      showLogin.value = false
      loginForm.value = { email: '', password: '' }
      alert('登录成功')
    } else {
      alert(data.message || '登录失败')
    }
  } catch (err) {
    alert('登录失败，请检查网络')
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
      isLoggedIn.value = true
      currentUser.value = data.user
      showRegister.value = false
      registerForm.value = { username: '', email: '', password: '' }
      alert('注册成功')
    } else {
      alert(data.message || '注册失败')
    }
  } catch (err) {
    alert('注册失败，请检查网络')
  }
}

const handleLogout = () => {
  localStorage.removeItem('token')
  isLoggedIn.value = false
  currentUser.value = null
  alert('已退出登录')
}

const switchToRegister = () => {
  showLogin.value = false
  showRegister.value = true
}

const switchToLogin = () => {
  showRegister.value = false
  showLogin.value = true
}

onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    isLoggedIn.value = true
  }
  fetchProducts()
})
</script>

<template>
  <div class="page-container">
    <header class="navbar">
      <div class="logo">🏫 校内二手街</div>
      <div class="search-bar">
        <input 
          type="text" 
          v-model="searchKeyword"
          @keyup.enter="handleSearch"
          placeholder="搜索闲置好物..." 
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>
      <div class="user-actions">
        <template v-if="!isLoggedIn">
          <button class="btn-login" @click="showLogin = true">登录</button>
          <button class="btn-register" @click="showRegister = true">注册</button>
        </template>
        <template v-else>
          <span class="user-name">{{ currentUser?.username || '用户' }}</span>
          <button class="btn-publish">+ 发布闲置</button>
          <button class="btn-logout" @click="handleLogout">退出</button>
        </template>
      </div>
    </header>

    <main class="main-content">
      <h2>✨ 最新发布</h2>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else class="product-grid">
        <div class="product-card" v-for="item in productList" :key="item.id">
          <div class="card-img">
            <img v-if="item.img.startsWith('http') || item.img.startsWith('/')" 
                 :src="item.img" 
                 alt="商品图片" />
            <span v-else>{{ item.img }}</span>
          </div>
          <div class="card-info">
            <h3 class="title">{{ item.title }}</h3>
            <div class="meta">
              <span class="tag">{{ item.tag }}</span>
              <span class="price">¥{{ item.price }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-if="!loading && productList.length === 0" class="empty">
        暂无商品
      </div>
    </main>

    <!-- 登录弹窗 -->
    <div v-if="showLogin" class="modal-overlay" @click="showLogin = false">
      <div class="modal-box" @click.stop>
        <h3>登录</h3>
        <input v-model="loginForm.email" type="email" placeholder="邮箱" />
        <input v-model="loginForm.password" type="password" placeholder="密码" />
        <button class="btn-primary" @click="handleLogin">登录</button>
        <p class="switch-text">
          还没有账号？<a @click="switchToRegister">立即注册</a>
        </p>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <div v-if="showRegister" class="modal-overlay" @click="showRegister = false">
      <div class="modal-box" @click.stop>
        <h3>注册</h3>
        <input v-model="registerForm.username" placeholder="用户名" />
        <input v-model="registerForm.email" type="email" placeholder="邮箱" />
        <input v-model="registerForm.password" type="password" placeholder="密码" />
        <button class="btn-primary" @click="handleRegister">注册</button>
        <p class="switch-text">
          已有账号？<a @click="switchToLogin">立即登录</a>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 全局容器 */
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

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

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-right: 40px;
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

/* 主体内容 */
.main-content {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
}

.main-content h2 {
  margin-bottom: 20px;
  color: #303133;
}

.loading, .empty {
  text-align: center;
  padding: 50px;
  color: #909399;
  font-size: 16px;
}

/* 商品网格布局 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

/* 单个商品卡片 */
.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  border: 1px solid #e4e7ed;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-img {
  height: 180px;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
}

.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-info {
  padding: 15px;
}

.title {
  font-size: 16px;
  margin: 0 0 10px 0;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tag {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.price {
  color: #f56c6c;
  font-size: 18px;
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

.modal-box input {
  width: 100%;
  margin: 10px 0;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
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

.switch-text a:hover {
  text-decoration: underline;
}
</style>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const keyword = ref('')

const handleSearch = () => {
  const key = keyword.value.trim()

  // 空搜索 → 回首页
  if (key === '') {
    router.push('/')
    return
  }

  // 正常搜索 → 搜索页
  router.push({
    path: '/search',
    query: {
      q: key
    }
  })
}
</script>

<template>
  <div>

    <!-- 全局导航 -->
    <header class="navbar">
      <div class="logo">🏫 校内二手街</div>

      <div class="search-bar">
        <input
        v-model="keyword"
        placeholder="搜索闲置好物..."
        @keyup.enter="handleSearch"
        />
      <button class="search-btn" @click="handleSearch">
        搜索
      </button>
      </div>

      <div class="user-actions">
        <button class="btn-login">登录</button>
        <button class="btn-publish">+ 发布闲置</button>
      </div>
    </header>

    <!-- 页面内容 -->
    <router-view />

  </div>
</template>

<style>

body {
  margin: 0;
}

#app {
  min-height: 100vh;
  background-color: #f5f7fa;
}/* 👉 这里直接复制你Home里的navbar样式 */

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
}

.search-bar {
  flex: 1;
  display: flex;
  max-width: 500px;
  margin: 0 20px;
}

.search-bar input {
  flex: 1;
  padding: 10px;
  border: 1px solid #dcdfe6;
  border-right: none;
  border-radius: 4px 0 0 4px;
}

.search-btn {
  padding: 10px 20px;
  background: #409eff;
  color: white;
  border: none;
}

.user-actions {
  display: flex;
  gap: 10px;
}

.btn-login {
  background: transparent;
  border: 1px solid #dcdfe6;
  padding: 8px 15px;
}

.btn-publish {
  background: #67c23a;
  color: white;
  border: none;
  padding: 8px 15px;
}
</style>

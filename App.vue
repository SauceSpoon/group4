<script setup>
import { ref } from 'vue'

// --- 1. 模拟后端数据 (等后端好了，这部分会变成 API 调用) ---
const productList = ref([
  { id: 1, title: '九成新 iPad Air', price: '2800', tag: '数码', img: '📱' },
  { id: 2, title: '大学物理教材', price: '15', tag: '书籍', img: '📚' },
  { id: 3, title: '泰勒明斯特自行车', price: '450', tag: '出行', img: '🚲' },
  { id: 4, title: '机械键盘', price: '120', tag: '数码', img: '⌨️' },
  { id: 5, title: '宜家台灯', price: '30', tag: '生活', img: '💡' },
  { id: 6, title: '二手吉他', price: '200', tag: '乐器', img: '🎸' },
  { id: 7, title: '考研数学笔记', price: '10', tag: '书籍', img: '📝' },
  { id: 8, title: '宿舍小电锅', price: '25', tag: '生活', img: '🍳' },
])
</script>

<template>
  <div class="page-container">
    <!-- --- 2. 顶部导航栏 --- -->
    <header class="navbar">
      <div class="logo">🏫 校内二手街</div>
      <div class="search-bar">
        <input type="text" placeholder="搜索闲置好物..." />
        <button class="search-btn">搜索</button>
      </div>
      <div class="user-actions">
        <button class="btn-login">登录</button>
        <button class="btn-publish">+ 发布闲置</button>
      </div>
    </header>

    <!-- --- 3. 主要内容区域 --- -->
    <main class="main-content">
      <h2>✨ 最新发布</h2>
      
      <!-- 商品网格列表 -->
      <div class="product-grid">
        <!-- v-for 是循环，遍历上面的 productList 数据 -->
        <div class="product-card" v-for="item in productList" :key="item.id">
          <div class="card-img">{{ item.img }}</div>
          <div class="card-info">
            <h3 class="title">{{ item.title }}</h3>
            <div class="meta">
              <span class="tag">{{ item.tag }}</span>
              <span class="price">¥{{ item.price }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* --- 4. 样式部分 --- */

/* 全局容器 */
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa; /* 浅灰背景，显得高级 */
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

/* 导航栏样式 */
.navbar {
  background-color: #fff;
  padding: 15px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05); /* 底部淡淡的阴影 */
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: #409eff; /* Element Blue */
  margin-right: 40px;
}

.search-bar {
  flex: 1; /* 占据中间剩余空间 */
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
}

.btn-login {
  background: transparent;
  border: 1px solid #dcdfe6;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-publish {
  background: #67c23a; /* Element Green */
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
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

/* 商品网格布局 */
.product-grid {
  display: grid;
  /* 核心代码：自动填充，每个卡片最小240px，自动换行 */
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

/* 鼠标悬停卡片上浮效果 */
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

.card-info {
  padding: 15px;
}

.title {
  font-size: 16px;
  margin: 0 0 10px 0;
  color: #303133;
  white-space: nowrap;       /* 标题不换行 */
  overflow: hidden;          /* 超出隐藏 */
  text-overflow: ellipsis;   /* 超出显示省略号 */
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
  color: #f56c6c; /* 红色价格 */
  font-size: 18px;
  font-weight: bold;
}
</style>
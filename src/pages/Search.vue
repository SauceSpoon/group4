<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productList } from '../data/products'

const route = useRoute()
const router = useRouter()

const keyword = computed(() => route.query.q || '')

// 根据关键词筛选
const resultList = computed(() => {
  const key = (route.query.q || '').toLowerCase()

  return productList.filter(item => {
    return (
      item.title.toLowerCase().includes(key) ||
      item.tag.toLowerCase().includes(key)
    )
  })
})

// 去详情
const goDetail = (id) => {
  router.push(`/item/${id}`)
}

const highlightKeyword = (text) => {
  const key = keyword.value.trim()

  if (!key) return text

  // 忽略大小写
  const reg = new RegExp(`(${key})`, 'ig')

  return text.replace(
    reg,
    '<span class="highlight">$1</span>'
  )
}
</script>

<template>
  <div class="main-content">

    <h2>
      搜索结果：{{ keyword }}
    </h2>

    <div v-if="resultList.length === 0">
      没有找到相关商品
    </div>

    <div class="product-grid">
      <div
        class="product-card"
        v-for="item in resultList"
        :key="item.id"
        @click="goDetail(item.id)"
      >
        <div class="card-img">{{ item.img }}</div>
        <div class="card-info">
          <h3 class="title"><span v-html="highlightKeyword(item.title)"></span></h3>
          <div class="meta">
            <span class="tag">{{ item.tag }}</span>
            <span class="price">¥{{ item.price }}</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* --- 4. 样式部分 --- */

/* 全局容器 */

.highlight{
  color: #e62222;
  font-weight: bold;
  padding: 0 2px;
  border-radius: 3px;
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
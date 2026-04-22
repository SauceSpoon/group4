<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const API_BASE = 'http://localhost:3000/api'

const resultList = ref([])
const loading = ref(false)

const keyword = computed(() => route.query.q || '')

const fetchSearchResults = async () => {
  const key = keyword.value
  if (!key) {
    resultList.value = []
    return
  }
  
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/products?keyword=${encodeURIComponent(key)}`)
    const data = await res.json()
    resultList.value = data.data.map(item => ({
      id: item._id,
      title: item.title,
      price: item.price,
      tag: item.tag,
      img: item.images?.[0] || '📷'
    }))
  } catch (err) {
    console.error('搜索失败:', err)
    resultList.value = []
  } finally {
    loading.value = false
  }
}

// 监听关键词变化，自动搜索
watch(() => route.query.q, () => {
  fetchSearchResults()
}, { immediate: true })

const goDetail = (id) => {
  router.push(`/item/${id}`)
}

const highlightKeyword = (text) => {
  const key = keyword.value.trim()
  if (!key) return text
  const reg = new RegExp(`(${key})`, 'ig')
  return text.replace(reg, '<span class="highlight">$1</span>')
}
</script>

<template>
  <div class="main-content">
    <h2>搜索结果：{{ keyword }}</h2>

    <div v-if="loading" class="loading">搜索中...</div>
    
    <div v-else-if="resultList.length === 0">
      没有找到相关商品
    </div>

    <div v-else class="product-grid">
      <div
        class="product-card"
        v-for="item in resultList"
        :key="item.id"
        @click="goDetail(item.id)"
      >
        <div class="card-img">
          <img v-if="item.img.startsWith('http') || item.img.startsWith('/')" 
               :src="item.img" 
               alt="商品图片" />
          <span v-else>{{ item.img }}</span>
        </div>
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

<style scoped>
.loading {
  text-align: center;
  padding: 50px;
  color: #909399;
  font-size: 16px;
}

.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.highlight {
  color: #e62222;
  font-weight: bold;
  padding: 0 2px;
  border-radius: 3px;
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
}

.btn-login {
  background: transparent;
  border: 1px solid #dcdfe6;
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

.main-content {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
}

.main-content h2 {
  margin-bottom: 20px;
  color: #303133;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

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
</style>
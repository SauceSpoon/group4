<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_BASE = 'http://localhost:3000/api'

const productList = ref([])
const loading = ref(false)

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/products`)
    const data = await res.json()
    productList.value = data.data.map(item => ({
      id: item._id,
      title: item.title,
      price: item.price,
      tag: item.tag,
      img: item.images?.[0] ? `http://localhost:3000${item.images[0]}` : '📷'
    }))
  } catch (err) {
    console.error('获取商品失败:', err)
    productList.value = []
  } finally {
    loading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/item/${id}`)
}

onMounted(() => {
  fetchProducts()
})
</script>

<template>
  <main class="main-content">
    <h2>✨ 最新发布</h2>
    
    <div v-if="loading" class="loading">加载中...</div>
    
    <div v-else class="product-grid">
      <div 
        class="product-card" 
        v-for="item in productList" 
        :key="item.id"
        @click="goToDetail(item.id)"
      >
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
</template>

<style scoped>
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
</style>
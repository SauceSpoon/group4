<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()

const API_BASE = 'http://localhost:3000/api'

const product = ref(null)
const loading = ref(true)

const fetchProduct = async () => {
  const id = route.params.id
  try {
    const res = await fetch(`${API_BASE}/products/${id}`)
    const data = await res.json()
    if (res.ok) {
      product.value = {
        id: data._id,
        title: data.title,
        price: data.price,
        tag: data.tag,
        // ✅ 拼接完整后端地址
        img: data.images?.[0] ? `http://localhost:3000${data.images[0]}` : '📷',
        description: data.description || '暂无描述'
      }
    } else {
      product.value = null
    }
  } catch (err) {
    console.error('获取商品详情失败:', err)
    product.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProduct()
})
</script>

<template>
  <div class="page-container">
    <div class="top-bar">
      <button class="back-btn" @click="router.back()">← 返回</button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="product" class="detail-card">
      <div class="img-box">
        <img v-if="product.img.startsWith('http') || product.img.startsWith('/')" 
             :src="product.img" 
             alt="商品图片" />
        <div v-else class="emoji">{{ product.img }}</div>
      </div>

      <div class="info-box">
        <h1 class="title">{{ product.title }}</h1>
        <div class="price">¥ {{ product.price }}</div>
        <span class="tag">{{ product.tag }}</span>
        <div class="desc">
          <h3>商品描述</h3>
          <p>{{ product.description }}</p>
        </div>
        <button class="contact-btn">联系卖家</button>
      </div>
    </div>

    <div v-else class="empty">
      <h2>商品不存在</h2>
    </div>
  </div>
</template>

<style scoped>
/* 你原来的所有样式保留，只加这一个 */
.loading {
  text-align: center;
  padding: 50px;
  color: #909399;
}

/* 图片样式 */
.img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

/* 其他样式保持不变... */
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  padding: 20px;
}

.top-bar {
  max-width: 1100px;
  margin: 0 auto 20px auto;
}

.back-btn {
  background: #fff;
  border: 1px solid #dcdfe6;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.back-btn:hover {
  background: #f2f6fc;
}

.detail-card {
  max-width: 1100px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  padding: 30px;
  display: flex;
  gap: 40px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.06);
}

.img-box {
  width: 320px;
  height: 320px;
  background: #f0f2f5;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.emoji {
  font-size: 120px;
}

.info-box {
  flex: 1;
}

.title {
  font-size: 26px;
  color: #303133;
  margin-bottom: 15px;
}

.price {
  font-size: 28px;
  color: #f56c6c;
  font-weight: bold;
  margin-bottom: 15px;
}

.tag {
  display: inline-block;
  background: #f4f4f5;
  color: #909399;
  padding: 4px 10px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 13px;
}

.desc {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.desc h3 {
  font-size: 16px;
  margin-bottom: 10px;
  color: #606266;
}

.desc p {
  color: #666;
  line-height: 1.6;
}

.contact-btn {
  margin-top: 25px;
  background: #409eff;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.2s;
}

.contact-btn:hover {
  background: #66b1ff;
}

.empty {
  text-align: center;
  margin-top: 80px;
  color: #999;
}
</style>
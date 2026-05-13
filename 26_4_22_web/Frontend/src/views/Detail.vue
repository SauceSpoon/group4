<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import { t } from '../i18n.js'

const route = useRoute()
const router = useRouter()

const API_BASE = import.meta.env.VITE_API_BASE || ''

const product = ref(null)
const loading = ref(true)
const currentImageIndex = ref(0)
const showPreview = ref(false)

const fetchProduct = async () => {
  const id = route.params.id
  try {
    const res = await fetch(`${API_BASE}/products/${id}`)
    const data = await res.json()
    if (res.ok) {
      product.value = {
        id: data.id,
        title: data.title,
        price: data.price,
        tag: data.tag,
        images: data.images || [],
        img: data.images?.[0] || '📷',
        description: data.description || '',
        sellerId: data.seller_user_id || data.seller_id,
        sellerName: data.username,
        sellerAvatar: data.avatar,
        sellerContact: data.contact,
        createdAt: data.created_at
      }
      currentImageIndex.value = 0
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

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

const nextImage = () => {
  if (!product.value?.images?.length) return
  currentImageIndex.value = (currentImageIndex.value + 1) % product.value.images.length
}

const prevImage = () => {
  if (!product.value?.images?.length) return
  currentImageIndex.value = (currentImageIndex.value - 1 + product.value.images.length) % product.value.images.length
}

const contactSeller = () => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert('请先登录')
    return
  }
  
  if (!product.value?.sellerId) {
    alert('无法获取卖家信息')
    return
  }
  
  router.push(`/chat?friendId=${product.value.sellerId}`)
}

watch(() => route.params.id, () => {
  currentImageIndex.value = 0
  fetchProduct()
})

onMounted(() => {
  fetchProduct()
})
</script>

<template>
  <div class="page-container">
    <div class="top-bar">
      <button class="back-btn" @click="router.back()"></button>
    </div>

    <div v-if="loading" class="loading">{{ t('detail.loading') }}</div>
    <div v-else-if="product" class="detail-card">
      <!-- 左侧图片区 -->
      <div class="gallery-section">
        <!-- 主图 -->
        <div class="main-image" @click="showPreview = true">
          <img 
            v-if="product.images && product.images.length > 0" 
            :src="product.images[currentImageIndex]" 
            alt="item" 
          />
          <div v-else class="emoji">{{ product.img }}</div>
          
          <!-- 左右切换按钮 -->
          <button 
            v-if="product.images.length > 1" 
            class="gallery-arrow gallery-prev" 
            @click.stop="prevImage"
          >
            ‹
          </button>
          <button 
            v-if="product.images.length > 1" 
            class="gallery-arrow gallery-next" 
            @click.stop="nextImage"
          >
            ›
          </button>
          
          <!-- 图片计数 -->
          <div class="image-counter" v-if="product.images.length > 1">
            {{ currentImageIndex + 1 }} / {{ product.images.length }}
          </div>
        </div>
        
        <!-- 缩略图列表 -->
        <div class="thumbnail-list" v-if="product.images.length > 1">
          <img 
            v-for="(img, idx) in product.images" 
            :key="idx"
            :src="img"
            :class="['thumbnail', { active: idx === currentImageIndex }]"
            @click="currentImageIndex = idx"
          />
        </div>
      </div>

      <!-- 右侧信息区 -->
      <div class="info-box">
        <h1 class="title">{{ product.title }}</h1>
        <div class="price">¥ {{ product.price }}</div>
        <span class="tag">{{ product.tag }}</span>
        
        <!-- 卖家信息 -->
        <div class="seller-info" v-if="product.sellerName">
          <div class="seller-avatar">
            <img v-if="product.sellerAvatar" :src="product.sellerAvatar" />
            <span v-else>{{ product.sellerName?.[0] || '?' }}</span>
          </div>
          <div class="seller-detail">
            <div class="seller-name">{{ product.sellerName }}</div>
            <div class="seller-time" v-if="product.createdAt">
              {{ formatDate(product.createdAt) }} 发布
            </div>
          </div>
        </div>
        
        <div class="desc">
          <h3>{{ t('detail.description') }}</h3>
          <p>{{ product.description || t('detail.noDesc') }}</p>
        </div>
        
        <div class="contact-wrapper" @click="contactSeller">
          <img src="/contact-seller-bubble.png" class="contact-bubble" />
          <span class="contact-text">{{ t('detail.contact') }}</span>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      <h2>{{ t('detail.notFound') }}</h2>
    </div>

    <!-- 大图预览弹窗 -->
    <div v-if="showPreview" class="preview-overlay" @click="showPreview = false">
      <div class="preview-container" @click.stop>
        <img :src="product.images[currentImageIndex]" class="preview-img" />
        <button class="preview-close" @click="showPreview = false">✕</button>
        
        <button 
          v-if="product.images.length > 1" 
          class="preview-arrow preview-prev" 
          @click.stop="prevImage"
        >
          ‹
        </button>
        <button 
          v-if="product.images.length > 1" 
          class="preview-arrow preview-next" 
          @click.stop="nextImage"
        >
          ›
        </button>
        
        <div class="preview-counter" v-if="product.images.length > 1">
          {{ currentImageIndex + 1 }} / {{ product.images.length }}
        </div>
        
        <div class="preview-thumbnails" v-if="product.images.length > 1">
          <img 
            v-for="(img, idx) in product.images" 
            :key="idx"
            :src="img"
            :class="['preview-thumb', { active: idx === currentImageIndex }]"
            @click.stop="currentImageIndex = idx"
          />
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
}

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
  width: 100px;
  height: 45px;
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

.back-btn:active {
  transform: scale(0.95);
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

/* ========== 图片画廊 ========== */
.gallery-section {
  width: 400px;
  flex-shrink: 0;
}

.main-image {
  position: relative;
  width: 100%;
  height: 400px;
  background: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
  cursor: zoom-in;
}

.main-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.emoji {
  font-size: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.gallery-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgba(255,255,255,0.8);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 24px;
  color: #303133;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

.gallery-arrow:hover {
  background: rgba(255,255,255,0.95);
}

.gallery-prev {
  left: 10px;
}

.gallery-next {
  right: 10px;
}

.image-counter {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.5);
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 2;
}

/* 缩略图列表 */
.thumbnail-list {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  overflow-x: auto;
}

.thumbnail {
  width: 70px;
  height: 70px;
  border-radius: 6px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
  flex-shrink: 0;
}

.thumbnail:hover {
  border-color: #409eff;
}

.thumbnail.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64,158,255,0.2);
}

/* ========== 商品信息 ========== */
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
  margin-bottom: 15px;
  font-size: 13px;
}

/* 卖家信息 */
.seller-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 15px 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.seller-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: #409eff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  flex-shrink: 0;
}

.seller-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.seller-detail {
  flex: 1;
}

.seller-name {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}

.seller-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
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

/* 联系卖家按钮 */
.contact-wrapper {
  position: relative;
  width: 180px;
  height: 70px;
  cursor: pointer;
  margin-top: 25px;
  display: inline-block;
}

.contact-bubble {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.contact-text {
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
  text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
  pointer-events: none;
  white-space: nowrap;
}

.empty {
  text-align: center;
  margin-top: 80px;
  color: #999;
}

/* ========== 大图预览弹窗 ========== */
.preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.preview-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-close:hover {
  background: rgba(255,255,255,0.4);
}

.preview-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-arrow:hover {
  background: rgba(255,255,255,0.4);
}

.preview-prev {
  left: -70px;
}

.preview-next {
  right: -70px;
}

.preview-counter {
  color: white;
  margin-top: 15px;
  font-size: 14px;
}

.preview-thumbnails {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  max-width: 100%;
  overflow-x: auto;
}

.preview-thumb {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  object-fit: cover;
  cursor: pointer;
  border: 2px solid transparent;
  opacity: 0.6;
  transition: all 0.2s;
}

.preview-thumb:hover {
  opacity: 0.9;
}

.preview-thumb.active {
  border-color: #409eff;
  opacity: 1;
}

@media (max-width: 768px) {
  .detail-card {
    flex-direction: column;
    padding: 20px;
  }
  
  .gallery-section {
    width: 100%;
  }
  
  .main-image {
    height: 300px;
  }
  
  .preview-prev {
    left: 10px;
  }
  
  .preview-next {
    right: 10px;
  }
}
</style>
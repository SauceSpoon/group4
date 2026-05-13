<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { currentLang, t } from '../i18n.js'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE || ''

const productList = ref([])
const loading = ref(false)
const currentTag = ref('全部')
const currentPage = ref(1)
const pageSize = ref(12)
const totalPages = ref(0)
const total = ref(0)

const categories = computed(() => {
  // eslint-disable-next-line no-unused-expressions
  currentLang.value
  return [
    { label: t('category.all'), value: '全部', icon: '/category-all-v2.png' },
    { label: t('category.digital'), value: '数码', icon: '/category-digital.png' },
    { label: t('category.books'), value: '书籍', icon: '/category-books.png' },
    { label: t('category.travel'), value: '出行', icon: '/category-travel.png' },
    { label: t('category.life'), value: '生活', icon: '/category-life.png' },
    { label: t('category.instruments'), value: '乐器', icon: '/category-instruments.png' },
    { label: t('category.clothing'), value: '服饰', icon: '/category-clothing.png' },
    { label: t('category.beauty'), value: '美妆', icon: '/category-beauty.png' },
    { label: t('category.others'), value: '其他', icon: '/category-others.png' }
  ]
})

const fetchProducts = async (tag = '全部', page = 1) => {
  loading.value = true
  try {
    let url = `${API_BASE}/products?page=${page}&limit=${pageSize.value}`
    if (tag && tag !== '全部') {
      url += `&tag=${encodeURIComponent(tag)}`
    }
    const res = await fetch(url)
    const data = await res.json()
    
    productList.value = data.data.map(item => {
      let img = '📷'
      if (item.images && Array.isArray(item.images)) {
        const first = item.images[0]
        if (typeof first === 'string') img = first
      }
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        tag: item.tag,
        img: img
      }
    })
    
    // 保存分页信息
    if (data.pagination) {
      totalPages.value = data.pagination.totalPages
      total.value = data.pagination.total
      currentPage.value = data.pagination.current
    }
  } catch (err) {
    console.error('获取商品失败:', err)
    productList.value = []
  } finally {
    loading.value = false
  }
}

const selectCategory = (tag) => {
  currentTag.value = tag
  currentPage.value = 1  // 切换分类重置到第一页
  fetchProducts(tag, 1)
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  fetchProducts(currentTag.value, page)
}

const goToDetail = (id) => {
  router.push(`/item/${id}`)
}

onMounted(() => {
  fetchProducts('全部', 1)
})
</script>

<template>
  <div class="home-layout">
    <!-- 桌面端左侧分类栏 -->
    <aside class="sidebar desktop-only">
      <h3 class="sidebar-title">📂 {{ t('category.title') }}</h3>
      <div class="category-list">
        <div
          v-for="cat in categories"
          :key="cat.value"
          :class="['category-item', { active: currentTag === cat.value }]"
          @click="selectCategory(cat.value)"
        >
          <div class="category-wrapper">
            <img :src="cat.icon" class="category-icon" />
            <span class="category-text">{{ cat.label }}</span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧商品区 -->
    <main class="main-content">
      <!-- 移动端顶部横向分类栏 -->
      <div class="mobile-categories mobile-only">
        <div class="category-scroll">
          <div
            v-for="cat in categories"
            :key="cat.value"
            :class="['mobile-tag', { active: currentTag === cat.value }]"
            @click="selectCategory(cat.value)"
          >
            <template v-if="cat.icon">
              <div class="mobile-category-wrapper">
                <img :src="cat.icon" class="mobile-category-icon" />
                <span class="mobile-category-text">{{ cat.label }}</span>
              </div>
            </template>
            <template v-else>
              {{ cat.label }}
            </template>
          </div>
        </div>
      </div>

      <h2>
        {{ currentTag === '全部' ? t('home.latest') : categories.find(c => c.value === currentTag)?.label || currentTag }}
      </h2>
      
      <div v-if="loading" class="loading">{{ t('home.loading') }}</div>
      
      <div v-else class="product-grid">
        <div 
          class="product-card" 
          v-for="item in productList" 
          :key="item.id"
          @click="goToDetail(item.id)"
        >
          <div class="card-img">
            <img 
              v-if="typeof item.img === 'string' && (item.img.startsWith('http') || item.img.startsWith('/') || item.img.startsWith('data:'))" 
              :src="item.img" 
              alt="item"
            >
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
        {{ t('home.noItems') }}
      </div>

      <!-- 分页 -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          :disabled="currentPage <= 1" 
          @click="goToPage(currentPage - 1)"
          class="page-btn"
        >
          {{ t('pagination.prev') || '上一页' }}
        </button>
        
        <div class="page-numbers">
          <button
            v-for="page in totalPages"
            :key="page"
            :class="['page-num', { active: page === currentPage }]"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
        </div>
        
        <button 
          :disabled="currentPage >= totalPages" 
          @click="goToPage(currentPage + 1)"
          class="page-btn"
        >
          {{ t('pagination.next') || '下一页' }}
        </button>
        
        <span class="page-info">{{ currentPage }} / {{ totalPages }} 页</span>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-layout {
  max-width: 1200px;
  margin: 30px auto;
  padding: 0 20px;
  display: flex;
  gap: 20px;
}

/* ========== 桌面端左侧分类栏 ========== */
.sidebar {
  width: 200px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  height: fit-content;
  position: sticky;
  top: 80px;
}

.sidebar-title {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 桌面端 */
.category-item {
  padding: 4px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  width: 180px;
  height: 55px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.category-item:hover {
  transform: translateY(-2px);
}

.category-item.active {
  box-shadow: 0 0 0 3px #409eff;
  background: transparent;
}

.category-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.category-text {
  position: absolute;
  top: 50%;
  right: 35px;
  transform: translateY(-50%);
  font-size: 14px;
  font-weight: bold;
  color: #1a5fb4;
  text-shadow: 1px 1px 2px rgba(255,255,255,0.9);
  pointer-events: none;
  white-space: nowrap;
}

/* ========== 移动端顶部横向分类 ========== */
.mobile-categories {
  margin-bottom: 15px;
  background: #fff;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.category-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  white-space: nowrap;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.mobile-tag {
  padding: 4px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  width: 140px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4f5;
}

.mobile-tag.active {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.mobile-category-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-category-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.mobile-category-text {
  position: absolute;
  top: 50%;
  left: 60%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: bold;
  color: #409eff;
  text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
  pointer-events: none;
  white-space: nowrap;
}

/* ========== 商品区 ========== */
.main-content {
  flex: 1;
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

/* ========== 分页 ========== */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 30px;
  padding: 20px 0;
}

.page-btn {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn:hover:not(:disabled) {
  color: #409eff;
  border-color: #409eff;
}

.page-numbers {
  display: flex;
  gap: 5px;
}

.page-num {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
}

.page-num:hover {
  color: #409eff;
  border-color: #409eff;
}

.page-num.active {
  background: #409eff;
  color: #fff;
  border-color: #409eff;
}

.page-info {
  color: #909399;
  font-size: 14px;
  margin-left: 10px;
}

/* ========== 响应式显示控制 ========== */
.mobile-only {
  display: none;
}

@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }
  .mobile-only {
    display: block;
  }
  .home-layout {
    flex-direction: column;
    gap: 10px;
  }
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .main-content h2 {
    font-size: 18px;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 5px;
  }
  
  .page-info {
    width: 100%;
    text-align: center;
    margin-left: 0;
    margin-top: 10px;
  }
}
</style>
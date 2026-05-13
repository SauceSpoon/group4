<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { t } from '../i18n.js'

const route = useRoute()
const router = useRouter()

const API_BASE = 'https://ent-project-d3ge03zdx1e71b66a-1424722488.ap-shanghai.app.tcloudbase.com/api'

const resultList = ref([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const totalPages = ref(0)
const total = ref(0)

const keyword = computed(() => route.query.q || '')

const fetchSearchResults = async (page = 1) => {
  const key = keyword.value
  if (!key) {
    resultList.value = []
    return
  }
  
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/products?keyword=${encodeURIComponent(key)}&page=${page}&limit=${pageSize.value}`)
    const data = await res.json()
    
    resultList.value = data.data.map(item => ({
      id: item.id,
      title: item.title,
      price: item.price,
      tag: item.tag,
      img: item.images?.[0] || '📷'
    }))
    
    // 保存分页信息
    if (data.pagination) {
      totalPages.value = data.pagination.totalPages
      total.value = data.pagination.total
      currentPage.value = data.pagination.current
    }
  } catch (err) {
    console.error('搜索失败:', err)
    resultList.value = []
  } finally {
    loading.value = false
  }
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  fetchSearchResults(page)
}

watch(() => route.query.q, () => {
  currentPage.value = 1
  fetchSearchResults(1)
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
    <h2>{{ t('search.result') }}{{ keyword }}</h2>

    <div v-if="loading" class="loading">{{ t('search.loading') }}</div>
    
    <div v-else-if="resultList.length === 0">
      {{ t('search.noResult') }}
    </div>

    <div v-else class="product-grid">
      <div
        class="product-card"
        v-for="item in resultList"
        :key="item.id"
        @click="goDetail(item.id)"
      >
        <div class="card-img">
          <img v-if="typeof item.img === 'string' && (item.img.startsWith('http') || item.img.startsWith('/') || item.img.startsWith('data:'))" 
               :src="item.img" 
               alt="item" />
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

@media (max-width: 768px) {
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
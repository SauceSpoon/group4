<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const API_BASE = 'http://localhost:3000/api'

const myProducts = ref([])
const loading = ref(false)
const showEdit = ref(false)
const editingProduct = ref(null)

// 编辑表单
const editForm = ref({
  title: '',
  price: '',
  tag: '数码',
  description: '',
  status: '在售'
})

// 获取我的发布
const fetchMyProducts = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert('请先登录')
    router.push('/')
    return
  }

  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/products/user/my-products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (res.ok) {
      myProducts.value = data.map(item => ({
  ...item,
  // ✅ 拼接完整图片地址
  firstImage: item.images?.[0] ? `http://localhost:3000${item.images[0]}` : null
}))
    } else {
      alert(data.message || '获取失败')
    }
  } catch (err) {
    console.error('获取我的发布失败:', err)
  } finally {
    loading.value = false
  }
}

// 打开编辑弹窗
const openEdit = (product) => {
  editingProduct.value = product
  editForm.value = {
    title: product.title,
    price: product.price,
    tag: product.tag,
    description: product.description || '',
    status: product.status
  }
  showEdit.value = true
}

// 保存修改
const handleUpdate = async () => {
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/products/${editingProduct.value._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: editForm.value.title,
        price: Number(editForm.value.price),
        tag: editForm.value.tag,
        description: editForm.value.description,
        status: editForm.value.status
      })
    })
    
    const data = await res.json()
    if (res.ok) {
      alert('修改成功')
      showEdit.value = false
      fetchMyProducts() // 刷新列表
    } else {
      alert(data.message || '修改失败')
    }
  } catch (err) {
    alert('修改失败，请检查网络')
  }
}

// 删除商品
const handleDelete = async (id) => {
  if (!confirm('确定要删除这个商品吗？')) return
  
  const token = localStorage.getItem('token')
  try {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const data = await res.json()
    if (res.ok) {
      alert('删除成功')
      fetchMyProducts()
    } else {
      alert(data.message || '删除失败')
    }
  } catch (err) {
    alert('删除失败')
  }
}

// 状态文字颜色
const statusClass = (status) => {
  return {
    '在售': 'status-onsale',
    '已售': 'status-sold',
    '下架': 'status-off'
  }[status] || ''
}

onMounted(() => {
  fetchMyProducts()
})
</script>

<template>
  <div class="page-container">
    <div class="top-bar">
      <button class="back-btn" @click="router.back()">← 返回首页</button>
      <h2>📦 我的发布</h2>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else-if="myProducts.length === 0" class="empty">
      你还没有发布任何闲置，去发布一个吧~
    </div>

    <div v-else class="product-list">
      <div class="product-item" v-for="item in myProducts" :key="item._id">
        <div class="item-img">
          <img v-if="item.firstImage" :src="item.firstImage" alt="商品" />
          <span v-else>📷</span>
        </div>
        
        <div class="item-info">
          <h3>{{ item.title }}</h3>
          <div class="item-meta">
            <span class="price">¥{{ item.price }}</span>
            <span class="tag">{{ item.tag }}</span>
            <span class="status" :class="statusClass(item.status)">{{ item.status }}</span>
          </div>
          <p class="desc">{{ item.description || '暂无描述' }}</p>
        </div>

        <div class="item-actions">
          <button class="btn-edit" @click="openEdit(item)">编辑</button>
          <button class="btn-delete" @click="handleDelete(item._id)">删除</button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEdit" class="modal-overlay" @click="showEdit = false">
      <div class="modal-box" @click.stop>
        <h3>编辑闲置</h3>
        <input v-model="editForm.title" placeholder="商品标题" />
        <input v-model="editForm.price" type="number" placeholder="价格" />
        <select v-model="editForm.tag">
          <option value="数码">数码</option>
          <option value="书籍">书籍</option>
          <option value="出行">出行</option>
          <option value="生活">生活</option>
          <option value="乐器">乐器</option>
          <option value="服饰">服饰</option>
          <option value="美妆">美妆</option>
          <option value="其他">其他</option>
        </select>
        <select v-model="editForm.status">
          <option value="在售">在售</option>
          <option value="已售">已售</option>
          <option value="下架">下架</option>
        </select>
        <textarea v-model="editForm.description" placeholder="商品描述"></textarea>
        <button class="btn-primary" @click="handleUpdate">保存修改</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  padding: 20px;
}

.top-bar {
  max-width: 1100px;
  margin: 0 auto 20px auto;
  display: flex;
  align-items: center;
  gap: 15px;
}

.back-btn {
  background: #fff;
  border: 1px solid #dcdfe6;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
}

.top-bar h2 {
  color: #303133;
  margin: 0;
}

.loading, .empty {
  text-align: center;
  padding: 50px;
  color: #909399;
}

.product-list {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-item {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.item-img {
  width: 100px;
  height: 100px;
  background: #f0f2f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
}

.item-info h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.item-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
}

.price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.tag {
  background: #f4f4f5;
  color: #909399;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-onsale {
  background: #e1f3d8;
  color: #67c23a;
}

.status-sold {
  background: #fde2e2;
  color: #f56c6c;
}

.status-off {
  background: #e9e9eb;
  color: #909399;
}

.desc {
  color: #666;
  font-size: 14px;
  margin: 0;
}

.item-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-edit {
  background: #409eff;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-delete {
  background: #f56c6c;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 4px;
  cursor: pointer;
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

.modal-box input,
.modal-box select,
.modal-box textarea {
  width: 100%;
  margin: 10px 0;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 14px;
}

.modal-box textarea {
  height: 80px;
  resize: vertical;
  font-family: inherit;
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
</style>
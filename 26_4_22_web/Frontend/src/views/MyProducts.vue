<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '../i18n.js'

const router = useRouter()
const API_BASE = import.meta.env.VITE_API_BASE || ''

const myProducts = ref([])
const loading = ref(false)
const showEdit = ref(false)
const editingProduct = ref(null)

const editForm = ref({
  title: '',
  price: '',
  tag: '数码',
  description: '',
  status: '在售',
  images: []
})

const editImages = ref([])

const fetchMyProducts = async () => {
  const token = localStorage.getItem('token')
  if (!token) {
    alert(t('login.please'))
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
        firstImage: item.images?.[0] || null
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

const compressImage = (file, maxWidth = 400, maxHeight = 400, quality = 0.5) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height)
            height = maxHeight
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const fileToBase64 = (file) => compressImage(file, 400, 400, 0.5)

const openEdit = (product) => {
  editingProduct.value = product
  editForm.value = {
    title: product.title,
    price: product.price,
    tag: product.tag,
    description: product.description || '',
    status: product.status,
    images: product.images || []
  }
  editImages.value = []
  showEdit.value = true
}

const handleEditFileChange = (event) => {
  const files = Array.from(event.target.files)
  if (editImages.value.length + files.length > 3) {
    alert('最多只能上传3张图片')
    return
  }
  editImages.value.push(...files)
}

const removeEditImage = (index) => {
  editImages.value.splice(index, 1)
}

const removeExistingImage = (index) => {
  editForm.value.images.splice(index, 1)
}

const handleUpdate = async () => {
  const token = localStorage.getItem('token')
  try {
    const newBase64Images = await Promise.all(
      editImages.value.map(file => fileToBase64(file))
    )
    const allImages = [...editForm.value.images, ...newBase64Images]

    const res = await fetch(`${API_BASE}/products/${editingProduct.value.id}`, {
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
        status: editForm.value.status,
        images: allImages
      })
    })
    
    const data = await res.json()
    if (res.ok) {
      alert('修改成功')
      showEdit.value = false
      fetchMyProducts()
    } else {
      alert(data.message || '修改失败')
    }
  } catch (err) {
    alert('修改失败，请检查网络')
  }
}

const handleDelete = async (id) => {
  if (!confirm(t('myProducts.deleteConfirm'))) return
  
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

const statusClass = (status) => {
  return {
    '在售': 'status-onsale',
    '已售': 'status-sold',
    '下架': 'status-off'
  }[status] || ''
}

const statusText = (status) => {
  const map = {
    '在售': t('myProducts.status.onSale'),
    '已售': t('myProducts.status.sold'),
    '下架': t('myProducts.status.offShelf')
  }
  return map[status] || status
}

onMounted(() => {
  fetchMyProducts()
})
</script>

<template>
  <div class="page-container">
    <div class="top-bar">
      <button class="back-btn" @click="router.back()"></button>
      <h2>{{ t('myProducts.title') }}</h2>
    </div>

    <div v-if="loading" class="loading">{{ t('myProducts.loading') }}</div>

    <div v-else-if="myProducts.length === 0" class="empty">
      {{ t('myProducts.empty') }}
    </div>

    <div v-else class="product-list">
      <div class="product-item" v-for="item in myProducts" :key="item.id">
        <div class="item-img">
          <img v-if="item.firstImage" :src="item.firstImage" alt="item" />
          <span v-else>📷</span>
        </div>
        
        <div class="item-info">
          <h3>{{ item.title }}</h3>
          <div class="item-meta">
            <span class="price">¥{{ item.price }}</span>
            <span class="tag">{{ item.tag }}</span>
            <span class="status" :class="statusClass(item.status)">{{ statusText(item.status) }}</span>
          </div>
          <p class="desc">{{ item.description || '暂无描述' }}</p>
        </div>

        <div class="item-actions">
          <button class="btn-edit" @click="openEdit(item)">{{ t('myProducts.edit') }}</button>
          <button class="btn-delete" @click="handleDelete(item.id)">{{ t('myProducts.delete') }}</button>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEdit" class="modal-overlay">
      <div class="modal-box" @click.stop>
        <div class="modal-header">
          <h3>{{ t('myProducts.editTitle') }}</h3>
          <button class="btn-close" @click="showEdit = false">✕</button>
        </div>

        <!-- 修复：placeholder 走翻译 -->
        <input v-model="editForm.title" :placeholder="t('myProducts.itemTitle')" />
        <input v-model="editForm.price" type="number" :placeholder="t('myProducts.price')" />
        
        <!-- 修复：分类选项 label 走翻译，value 保持中文 -->
        <select v-model="editForm.tag">
          <option value="数码">{{ t('category.digital') }}</option>
          <option value="书籍">{{ t('category.books') }}</option>
          <option value="出行">{{ t('category.travel') }}</option>
          <option value="生活">{{ t('category.life') }}</option>
          <option value="乐器">{{ t('category.instruments') }}</option>
          <option value="服饰">{{ t('category.clothing') }}</option>
          <option value="美妆">{{ t('category.beauty') }}</option>
          <option value="其他">{{ t('category.others') }}</option>
        </select>
        
        <select v-model="editForm.status">
          <option value="在售">{{ t('myProducts.status.onSale') }}</option>
          <option value="已售">{{ t('myProducts.status.sold') }}</option>
          <option value="下架">{{ t('myProducts.status.offShelf') }}</option>
        </select>
        
        <!-- 修复：placeholder 走翻译 -->
        <textarea v-model="editForm.description" :placeholder="t('myProducts.description')"></textarea>

        <!-- 修复：label 走翻译 -->
        <div v-if="editForm.images && editForm.images.length > 0" class="existing-images">
          <label>{{ t('myProducts.currentImages') }}</label>
          <div class="image-list">
            <div v-for="(img, idx) in editForm.images" :key="idx" class="image-item">
              <img :src="img" />
              <button class="img-remove" @click="removeExistingImage(idx)">✕</button>
            </div>
          </div>
        </div>

        <!-- 修复：上传按钮文字走翻译 -->
        <div class="file-upload">
          <label for="edit-file-input" class="file-label">
            📷 {{ t('myProducts.uploadNewImage') }}
          </label>
          <input 
            id="edit-file-input" 
            type="file" 
            multiple 
            accept="image/*" 
            @change="handleEditFileChange"
          />
          <div v-if="editImages.length > 0" class="file-list">
            <span v-for="(file, index) in editImages" :key="index">
              {{ file.name }}
              <button class="file-remove" @click="removeEditImage(index)">✕</button>
            </span>
          </div>
        </div>

        <button class="btn-primary" @click="handleUpdate">{{ t('myProducts.save') }}</button>
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
  width: 120px;
  height: 54px;
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
  width: 360px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  flex: 1;
  text-align: center;
}

.btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.btn-close:hover {
  background: #f0f2f5;
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

/* 已有图片 */
.existing-images {
  margin: 10px 0;
}

.existing-images label {
  display: block;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: #f56c6c;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图片上传 */
.file-upload {
  margin: 10px 0;
}

.file-label {
  display: block;
  padding: 10px;
  background: #f0f2f5;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  text-align: center;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s;
  font-size: 14px;
}

.file-label:hover {
  border-color: #409eff;
  color: #409eff;
}

.file-upload input[type="file"] {
  display: none;
}

.file-list {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.file-list span {
  background: #e6f7ff;
  color: #409eff;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-remove {
  background: #f56c6c;
  color: white;
  border: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
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
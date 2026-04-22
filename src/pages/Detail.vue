<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { productList } from '../data/products'

const route = useRoute()
const router = useRouter()

const id = Number(route.params.id)

const product = computed(() => {
  return productList.find(item => item.id === id)
})
</script>

<template>
  <div class="page-container">

    <!-- 返回栏 -->
    <div class="top-bar">
      <button class="back-btn" @click="router.back()">← 返回</button>
    </div>

    <div v-if="product" class="detail-card">

      <!-- 左：图片 -->
      <div class="img-box">
        <div class="emoji">{{ product.img }}</div>
      </div>

      <!-- 右：信息 -->
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
/* ===== 全局背景（和Home统一） ===== */
.page-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  padding: 20px;
}

/* ===== 返回按钮区域 ===== */
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

/* ===== 主卡片 ===== */
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

/* ===== 左侧图片 ===== */
.img-box {
  width: 320px;
  height: 320px;
  background: #f0f2f5;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji {
  font-size: 120px;
}

/* ===== 右侧信息 ===== */
.info-box {
  flex: 1;
}

.title {
  font-size: 26px;
  color: #303133;
  margin-bottom: 15px;
}

/* 价格 */
.price {
  font-size: 28px;
  color: #f56c6c;
  font-weight: bold;
  margin-bottom: 15px;
}

/* 标签 */
.tag {
  display: inline-block;
  background: #f4f4f5;
  color: #909399;
  padding: 4px 10px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 13px;
}

/* 描述 */
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

/* 联系按钮 */
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

/* 空状态 */
.empty {
  text-align: center;
  margin-top: 80px;
  color: #999;
}
</style>
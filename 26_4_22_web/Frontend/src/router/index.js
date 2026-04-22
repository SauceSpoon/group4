import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Detail from '../views/Detail.vue'
import Search from '../views/Search.vue'
import MyProducts from '../views/MyProducts.vue'
import Chat from '../views/Chat.vue'  // ✅ 注意路径
import Friends from '../views/Friends.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/item/:id', component: Detail },
    { path: '/search', component: Search },
    { path: '/my-products', component: MyProducts },
    { path: '/friends', component: Friends },   // ✅ 好友列表
    { path: '/chat', component: Chat }          // ✅ 私信聊天
  ]
})

export default router
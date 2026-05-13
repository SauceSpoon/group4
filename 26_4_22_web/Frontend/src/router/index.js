import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Detail from '../views/Detail.vue'
import Search from '../views/Search.vue'
import MyProducts from '../views/MyProducts.vue'
import Chat from '../views/Chat.vue'
import Friends from '../views/Friends.vue'
import Profile from '../views/Profile.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/item/:id', component: Detail },
    { path: '/search', component: Search },
    { path: '/my-products', component: MyProducts },
    { path: '/friends', component: Friends },
    { path: '/chat', component: Chat },
    { path: '/profile', component: Profile }
  ]
})

export default router
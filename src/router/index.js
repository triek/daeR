import { createRouter, createWebHistory } from 'vue-router'
import BookshelfView from '../views/BookshelfView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: BookshelfView,
    },
  ],
})

export default router

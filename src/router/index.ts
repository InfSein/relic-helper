import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/MainView.vue'),
    },
    {
      path: '/po',
      name: 'ProgressOverview',
      component: () => import('@/views/ProgressOverview.vue'),
    },
    {
      path: '/:groupKey/overview',
      name: 'RelicGroupOverview',
      component: () => import('@/views/RelicGroupOverview.vue'),
    },
    {
      path: '/relic/atma',
      name: 'RelicAtmaHelper',
      component: () => import('@/views/relic/AtmaHelper.vue'),
    },
    {
      path: '/relic/book',
      name: 'RelicBookHelper',
      component: () => import('@/views/relic/BookHelper.vue'),
    },
    {
      path: '/phantom/memo',
      name: 'PhantomMemoHelper',
      component: () => import('@/views/phantom/MartialMemoHelper.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      meta: {
        keepAlive: false,
        showTabBar: false
      },
      component: () => import('@/views/ErrorView404.vue')
    }
  ],
})

export default router

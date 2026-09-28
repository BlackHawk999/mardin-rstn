import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue'), meta: { public: true } },
    { path: '/', name: 'dashboard', component: () => import('@/pages/DashboardPage.vue') },
    { path: '/orders', name: 'orders', component: () => import('@/pages/OrdersPage.vue') },
    { path: '/orders/:id', name: 'order', component: () => import('@/pages/OrderPage.vue'), props: true },
    { path: '/menu', name: 'menu', component: () => import('@/pages/MenuPage.vue') },
    { path: '/banners', name: 'banners', component: () => import('@/pages/BannersPage.vue') },
    { path: '/customers', name: 'customers', component: () => import('@/pages/CustomersPage.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/pages/SettingsPage.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.ready) await auth.init();
  if (!to.meta.public && !auth.isAuthed()) return { name: 'login', query: { next: to.fullPath } };
  if (to.name === 'login' && auth.isAuthed()) return { name: 'dashboard' };
  return true;
});

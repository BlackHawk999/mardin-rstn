import { createRouter, createWebHistory } from 'vue-router';
import { scrollWhenReady } from '@/composables/useKeepScroll';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('@/pages/HomePage.vue'), meta: { nav: true } },
    { path: '/menu', name: 'menu', component: () => import('@/pages/MenuPage.vue'), meta: { nav: true } },
    { path: '/cart', name: 'cart', component: () => import('@/pages/CartPage.vue'), meta: { nav: true } },
    { path: '/favorites', name: 'favorites', component: () => import('@/pages/FavoritesPage.vue'), meta: { nav: true } },
    { path: '/profile', name: 'profile', component: () => import('@/pages/ProfilePage.vue'), meta: { nav: true } },
    { path: '/search', name: 'search', component: () => import('@/pages/SearchPage.vue'), meta: { nav: true } },
    { path: '/orders', name: 'orders', component: () => import('@/pages/OrdersPage.vue'), meta: { nav: true } },
    { path: '/addresses', name: 'addresses', component: () => import('@/pages/AddressesPage.vue'), meta: { nav: true } },
    { path: '/addresses/map', name: 'address-map', component: () => import('@/pages/AddressMapPage.vue'), meta: { nav: false } },
    { path: '/dish/:id', name: 'dish', component: () => import('@/pages/DishPage.vue'), props: true, meta: { nav: false } },
    { path: '/orders/:id', name: 'order', component: () => import('@/pages/OrderPage.vue'), props: true, meta: { nav: false } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  async scrollBehavior(_to, _from, saved) {
    if (!saved) return { top: 0 };
    // On a slow phone the list may not be rendered yet; restoring too early gets clamped to 0.
    await scrollWhenReady(saved.top);
    return false; // already scrolled
  },
});

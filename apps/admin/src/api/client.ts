import type {
  AdminBannerDto,
  AdminCategoryDto,
  AdminDishDto,
  AdminOrderDto,
  AdminStatsDto,
  AdminUserDto,
  OrderStatus,
  Paginated,
  SettingsDto,
  UserRole,
} from '@rt/shared';

const BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin';
const TOKEN_KEY = 'admin-token';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details?: unknown,
  ) {
    super(code);
  }
}

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(method: string, path: string, body?: unknown, raw?: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + path, { method, headers, body: raw ?? (body === undefined ? undefined : JSON.stringify(body)) });
  if (res.status === 401 && !path.startsWith('/login')) onUnauthorized?.();
  if (!res.ok) {
    let payload: { error?: string; details?: unknown } = {};
    try {
      payload = await res.json();
    } catch {
      /* no body */
    }
    throw new ApiError(res.status, payload.error ?? 'unknown', payload.details);
  }
  return res.json() as Promise<T>;
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : '';
};

export type CategoryInput = Partial<Pick<AdminCategoryDto, 'nameUz' | 'nameRu' | 'imageUrl' | 'sortOrder' | 'isHidden'>>;
export type DishInput = Partial<Omit<AdminDishDto, 'id'>>;
export type BannerInput = Partial<Omit<AdminBannerDto, 'id'>>;

export const api = {
  login: (login: string, password: string) => request<{ token: string }>('POST', '/login', { login, password }),
  me: () => request<{ name: string; sub: string }>('GET', '/me'),
  stats: () => request<AdminStatsDto>('GET', '/stats'),

  orders: (params: { status?: OrderStatus; active?: boolean; q?: string; page?: number; pageSize?: number }) =>
    request<Paginated<AdminOrderDto>>('GET', `/orders${qs(params)}`),
  order: (id: number) => request<AdminOrderDto>('GET', `/orders/${id}`),
  setOrderStatus: (id: number, status: OrderStatus, extra: { cancelReason?: string; courierId?: number } = {}) =>
    request<AdminOrderDto>('POST', `/orders/${id}/status`, { status, ...extra }),
  assignCourier: (id: number, courierId: number | null) => request<AdminOrderDto>('POST', `/orders/${id}/courier`, { courierId }),
  couriers: () => request<{ id: number; displayName: string; phone: string | null }[]>('GET', '/couriers'),

  categories: () => request<AdminCategoryDto[]>('GET', '/categories'),
  createCategory: (data: CategoryInput) => request<AdminCategoryDto>('POST', '/categories', data),
  updateCategory: (id: number, data: CategoryInput) => request<AdminCategoryDto>('PATCH', `/categories/${id}`, data),
  deleteCategory: (id: number) => request<{ ok: true }>('DELETE', `/categories/${id}`),
  reorderCategories: (ids: number[]) => request<{ ok: true }>('POST', '/categories/reorder', { ids }),

  dishes: (params: { categoryId?: number; q?: string } = {}) => request<AdminDishDto[]>('GET', `/dishes${qs(params)}`),
  createDish: (data: DishInput) => request<AdminDishDto>('POST', '/dishes', data),
  updateDish: (id: number, data: DishInput) => request<AdminDishDto>('PATCH', `/dishes/${id}`, data),
  deleteDish: (id: number) => request<{ ok: true }>('DELETE', `/dishes/${id}`),
  reorderDishes: (ids: number[]) => request<{ ok: true }>('POST', '/dishes/reorder', { ids }),

  banners: () => request<AdminBannerDto[]>('GET', '/banners'),
  createBanner: (data: BannerInput) => request<AdminBannerDto>('POST', '/banners', data),
  updateBanner: (id: number, data: BannerInput) => request<AdminBannerDto>('PATCH', `/banners/${id}`, data),
  deleteBanner: (id: number) => request<{ ok: true }>('DELETE', `/banners/${id}`),

  users: (params: { q?: string; role?: UserRole; page?: number; pageSize?: number }) => request<Paginated<AdminUserDto>>('GET', `/users${qs(params)}`),
  updateUser: (id: number, data: { role?: UserRole; isBlocked?: boolean; displayName?: string; phone?: string | null }) =>
    request<AdminUserDto>('PATCH', `/users/${id}`, data),

  settings: () => request<SettingsDto>('GET', '/settings'),
  botStatus: () => request<{ botUsername: string | null; staffChatConnected: boolean; staffChatTitle: string | null }>('GET', '/bot'),
  saveSettings: (data: Partial<SettingsDto>) => request<SettingsDto>('PUT', '/settings', data),

  upload: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ url: string }>('POST', '/upload', undefined, fd);
  },
};

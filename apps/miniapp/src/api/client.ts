import type { AddressDto, CatalogDto, CreateOrderInput, OrderDto, UserDto, WeatherDto } from '@rt/shared';
import { getInitData, isInTelegram } from '@/telegram';

// Empty VITE_API_URL = same origin (Vite dev proxy or a reverse proxy in production).
const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details?: unknown,
  ) {
    super(code);
  }
}

function authHeader(): string {
  if (isInTelegram) return `tma ${getInitData()}`;
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_TELEGRAM_ID) return `dev ${import.meta.env.VITE_DEV_TELEGRAM_ID}`;
  return '';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      Authorization: authHeader(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    let payload: { error?: string; details?: unknown } = {};
    try {
      payload = await res.json();
    } catch {
      /* no body */
    }
    throw new ApiError(res.status, payload.error ?? 'unknown', payload.details);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  catalog: () => request<CatalogDto>('GET', '/catalog'),
  weather: () => request<WeatherDto>('GET', '/weather'),
  recommendations: (dishIds: number[]) =>
    request<{ ids: number[]; togetherCount: number }>('GET', `/recommendations?ids=${dishIds.join(',')}`),

  me: () => request<UserDto>('POST', '/me'),
  updateMe: (data: { displayName?: string; language?: 'ru' | 'uz' }) => request<UserDto>('PATCH', '/me', data),
  savePhone: (data: { response?: string; phone?: string }) => request<UserDto>('POST', '/me/phone', data),

  addresses: () => request<AddressDto[]>('GET', '/me/addresses'),
  createAddress: (data: { label?: string; text: string; lat?: number; lng?: number; comment?: string; isDefault?: boolean }) =>
    request<AddressDto>('POST', '/me/addresses', data),
  updateAddress: (id: number, data: { label?: string | null; text?: string; comment?: string | null }) =>
    request<AddressDto>('PATCH', `/me/addresses/${id}`, data),
  setDefaultAddress: (id: number) => request<{ ok: true }>('POST', `/me/addresses/${id}/default`),
  deleteAddress: (id: number) => request<{ ok: true }>('DELETE', `/me/addresses/${id}`),

  favorites: () => request<number[]>('GET', '/me/favorites'),
  addFavorite: (dishId: number) => request<{ ok: true }>('PUT', `/me/favorites/${dishId}`),
  removeFavorite: (dishId: number) => request<{ ok: true }>('DELETE', `/me/favorites/${dishId}`),

  reverseGeocode: (lat: number, lng: number, lang: 'ru' | 'uz') =>
    request<{ text: string; full: string; lat: number; lng: number }>('GET', `/geo/reverse?lat=${lat}&lng=${lng}&lang=${lang}`),

  createOrder: (data: CreateOrderInput) => request<OrderDto>('POST', '/orders', data),
  orders: () => request<OrderDto[]>('GET', '/orders'),
  order: (id: number) => request<OrderDto>('GET', `/orders/${id}`),
  cancelOrder: (id: number, reason: 'changed_mind' | 'mistake' | 'too_long' | 'other') =>
    request<OrderDto>('POST', `/orders/${id}/cancel`, { reason }),
};

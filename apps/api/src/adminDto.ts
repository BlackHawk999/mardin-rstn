import type { Banner, Category, Dish, Order, OrderItem, User } from '@prisma/client';
import type { AdminBannerDto, AdminCategoryDto, AdminDishDto, AdminOrderDto } from '@rt/shared';
import { toBannerDto, toCategoryDto, toDishDto, toOrderDto } from './dto.js';

export const toAdminOrderDto = (o: Order & { items: OrderItem[]; user: User; courier: User | null }): AdminOrderDto => ({
  ...toOrderDto(o),
  addressLat: o.addressLat,
  addressLng: o.addressLng,
  cancelReason: o.cancelReason,
  acceptedAt: o.acceptedAt?.toISOString() ?? null,
  completedAt: o.completedAt?.toISOString() ?? null,
  customer: { id: o.user.id, displayName: o.user.displayName, phone: o.user.phone, telegramId: o.user.telegramId, tgUsername: o.user.tgUsername },
  courier: o.courier ? { id: o.courier.id, displayName: o.courier.displayName, phone: o.courier.phone } : null,
});

export const toAdminCategoryDto = (c: Category & { _count: { dishes: number } }): AdminCategoryDto => ({
  ...toCategoryDto(c),
  isHidden: c.isHidden,
  dishesCount: c._count.dishes,
});

/** Raw catalog price (what the admin edits) plus the dish's own discount setting and the one in effect. */
export const toAdminDishDto = (d: Dish, menuDiscountPercent: number): AdminDishDto => ({
  ...toDishDto(d, menuDiscountPercent),
  price: d.price,
  basePrice: d.price,
  discountPercent: d.discountPercent,
  effectiveDiscountPercent: toDishDto(d, menuDiscountPercent).discountPercent,
  isHidden: d.isHidden,
});

export const toAdminBannerDto = (b: Banner): AdminBannerDto => ({ ...toBannerDto(b), sortOrder: b.sortOrder, isActive: b.isActive });

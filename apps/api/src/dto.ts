import { discountedPrice, effectiveDiscountPercent } from '@rt/shared';
import type { Address, Banner, Category, Dish, Order, OrderItem, User } from '@prisma/client';
import type {
  AddressDto,
  BannerDto,
  CategoryDto,
  DishDto,
  Language,
  OrderDto,
  OrderItemDto,
  OrderStatus,
  OrderType,
  PaymentMethod,
  UserDto,
  UserRole,
} from '@rt/shared';

export const toUserDto = (u: User): UserDto => ({
  id: u.id,
  telegramId: u.telegramId,
  displayName: u.displayName,
  phone: u.phone,
  language: u.language as Language,
  role: u.role as UserRole,
});

export const toAddressDto = (a: Address): AddressDto => ({
  id: a.id,
  label: a.label,
  text: a.text,
  lat: a.lat,
  lng: a.lng,
  comment: a.comment,
  isDefault: a.isDefault,
});

export const toCategoryDto = (c: Category): CategoryDto => ({
  id: c.id,
  nameUz: c.nameUz,
  nameRu: c.nameRu,
  imageUrl: c.imageUrl,
  sortOrder: c.sortOrder,
});

/** Catalog dish with its current price: `menuDiscountPercent` comes from settings. */
export const toDishDto = (d: Dish, menuDiscountPercent: number): DishDto => {
  const percent = effectiveDiscountPercent(d.discountPercent, menuDiscountPercent);
  const price = discountedPrice(d.price, percent);
  return {
  id: d.id,
  categoryId: d.categoryId,
  nameUz: d.nameUz,
  nameRu: d.nameRu,
  descriptionUz: d.descriptionUz,
  descriptionRu: d.descriptionRu,
  ingredientsUz: d.ingredientsUz,
  ingredientsRu: d.ingredientsRu,
  imageUrl: d.imageUrl,
  price,
  basePrice: d.price,
  // Report 0 when rounding leaves the price unchanged, so the UI never shows "-1%" with no visible saving.
  discountPercent: price < d.price ? percent : 0,
  weight: d.weight,
  isNew: d.isNew,
  isHit: d.isHit,
  isAvailable: d.isAvailable,
  pickupOnly: d.pickupOnly,
  sortOrder: d.sortOrder,
  };
};

export const toBannerDto = (b: Banner): BannerDto => ({
  id: b.id,
  imageUrl: b.imageUrl,
  titleUz: b.titleUz,
  titleRu: b.titleRu,
  subtitleUz: b.subtitleUz,
  subtitleRu: b.subtitleRu,
  categoryId: b.categoryId,
  dishId: b.dishId,
});

export const toOrderItemDto = (i: OrderItem): OrderItemDto => ({
  id: i.id,
  dishId: i.dishId,
  nameUz: i.nameUz,
  nameRu: i.nameRu,
  price: i.price,
  basePrice: i.basePrice,
  quantity: i.quantity,
  comment: i.comment,
});

export const toOrderDto = (o: Order & { items: OrderItem[] }): OrderDto => ({
  id: o.id,
  type: o.type as OrderType,
  status: o.status as OrderStatus,
  paymentMethod: o.paymentMethod as PaymentMethod,
  addressText: o.addressText,
  addressComment: o.addressComment,
  scheduledAt: o.scheduledAt?.toISOString() ?? null,
  comment: o.comment,
  itemsTotal: o.itemsTotal,
  deliveryFee: o.deliveryFee,
  discount: o.discount,
  total: o.total,
  createdAt: o.createdAt.toISOString(),
  items: o.items.map(toOrderItemDto),
});

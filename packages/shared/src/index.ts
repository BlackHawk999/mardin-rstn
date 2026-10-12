// Types shared between the API, the mini app and (later) the admin panel.

export type Language = 'ru' | 'uz';
export type UserRole = 'customer' | 'courier' | 'admin';
export type OrderType = 'delivery' | 'pickup';
export type PaymentMethod = 'cash' | 'transfer';

export const ORDER_STATUSES = [
  'new',        // created by the customer, waiting for the restaurant
  'accepted',   // restaurant confirmed
  'cooking',
  'ready',      // pickup only: can be collected
  'delivering', // delivery only: courier is on the way
  'completed',
  'cancelled',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Allowed status transitions per order type. */
export const STATUS_FLOW: Record<OrderType, OrderStatus[]> = {
  delivery: ['new', 'accepted', 'cooking', 'delivering', 'completed'],
  pickup: ['new', 'accepted', 'cooking', 'ready', 'completed'],
};

export interface UserDto {
  id: number;
  telegramId: string;
  displayName: string;
  phone: string | null;
  language: Language;
  role: UserRole;
}

export interface AddressDto {
  id: number;
  label: string | null;
  text: string;
  lat: number | null;
  lng: number | null;
  comment: string | null;
  isDefault: boolean;
}

export interface CategoryDto {
  id: number;
  nameUz: string;
  nameRu: string;
  imageUrl: string | null;
  sortOrder: number;
}

/**
 * Price after a percentage discount, rounded down to 100 sum (in the customer's favour).
 * The only place a discount is computed: the API uses it for the catalog and when pricing an order.
 */
export function discountedPrice(price: number, percent: number): number {
  if (!percent || percent <= 0) return price;
  return Math.floor((price * (100 - Math.min(percent, 100))) / 100 / 100) * 100;
}

/** A dish's own discount wins (0 excludes it from a menu-wide sale); otherwise the menu-wide discount applies. */
export function effectiveDiscountPercent(dishPercent: number | null, menuPercent: number): number {
  return dishPercent ?? menuPercent ?? 0;
}

export interface DishDto {
  id: number;
  categoryId: number;
  nameUz: string;
  nameRu: string;
  descriptionUz: string | null;
  descriptionRu: string | null;
  ingredientsUz: string | null;
  ingredientsRu: string | null;
  imageUrl: string | null;
  /** What the customer pays now (after discount), UZS. Use this everywhere for totals. */
  price: number;
  /** Price before discount; equal to `price` when there is no discount. */
  basePrice: number;
  /** Effective discount in %, 0 when none. */
  discountPercent: number;
  weight: string | null; // e.g. "350 г"
  isNew: boolean;
  isHit: boolean;
  isAvailable: boolean;
  /** Can be ordered for pickup only (e.g. hot drinks), not delivered. */
  pickupOnly: boolean;
  sortOrder: number;
}

export interface BannerDto {
  id: number;
  imageUrl: string;
  titleUz: string | null;
  titleRu: string | null;
  subtitleUz: string | null;
  subtitleRu: string | null;
  categoryId: number | null;
  dishId: number | null;
}

export interface SettingsDto {
  restaurantName: string;
  restaurantPhone: string;
  restaurantAddress: string;
  restaurantLat: number | null;
  restaurantLng: number | null;
  openTime: string; // "10:00"
  closeTime: string; // "23:00"
  deliveryFee: number;
  /** While true, delivery goes by taxi: no fixed fee, the customer sees a note that the price depends on the address. */
  deliveryByTaxi: boolean;
  /** Minimum items total for delivery orders. Pickup has no minimum. */
  minOrderAmount: number;
  /** Discount on the whole menu, %, 0 = none. A dish's own discount overrides it. */
  menuDiscountPercent: number;
  /** Categories whose dishes are offered in the cart ("Добавить к заказу"). */
  cartSuggestCategoryIds: number[];
}

/** Current weather at the restaurant, simplified for the decorative sky on the profile page. */
export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'snow';
export interface WeatherDto {
  condition: WeatherCondition;
}

export interface CatalogDto {
  categories: CategoryDto[];
  dishes: DishDto[];
  banners: BannerDto[];
  settings: SettingsDto;
  isOpen: boolean;
}

export interface OrderItemDto {
  id: number;
  dishId: number | null;
  nameUz: string;
  nameRu: string;
  /** Unit price paid (after discount). */
  price: number;
  /** Unit price before discount; null for old orders. */
  basePrice: number | null;
  quantity: number;
  comment: string | null;
}

export interface OrderDto {
  id: number;
  type: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  addressText: string | null;
  addressComment: string | null;
  scheduledAt: string | null;
  comment: string | null;
  itemsTotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  createdAt: string;
  items: OrderItemDto[];
}

/** Body of POST /orders. Prices are recalculated on the server. */
export interface CreateOrderInput {
  type: OrderType;
  paymentMethod: PaymentMethod;
  addressId?: number;
  addressText?: string;
  addressLat?: number;
  addressLng?: number;
  addressComment?: string;
  scheduledAt?: string | null;
  comment?: string;
  items: { dishId: number; quantity: number; comment?: string }[];
}

// ---------------- Admin panel ----------------

export interface AdminUserDto extends UserDto {
  tgUsername: string | null;
  isBlocked: boolean;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface AdminOrderDto extends OrderDto {
  addressLat: number | null;
  addressLng: number | null;
  cancelReason: string | null;
  acceptedAt: string | null;
  completedAt: string | null;
  customer: { id: number; displayName: string; phone: string | null; telegramId: string; tgUsername: string | null };
  courier: { id: number; displayName: string; phone: string | null } | null;
}

export interface AdminCategoryDto extends CategoryDto {
  isHidden: boolean;
  dishesCount: number;
}

/** Admin sees the raw catalog price and the dish's own discount setting (null = follow the menu). */
export interface AdminDishDto extends Omit<DishDto, 'discountPercent'> {
  isHidden: boolean;
  discountPercent: number | null;
  /** Discount actually applied right now (own or menu-wide), for the list view. */
  effectiveDiscountPercent: number;
}

export interface AdminBannerDto extends BannerDto {
  sortOrder: number;
  isActive: boolean;
}

export interface AdminStatsDto {
  today: { orders: number; revenue: number };
  week: { orders: number; revenue: number };
  activeOrders: number;
  newOrders: number;
  customers: number;
  topDishes: { dishId: number | null; nameRu: string; nameUz: string; quantity: number }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

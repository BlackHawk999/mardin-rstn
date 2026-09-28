import type { CategoryDto, DishDto, OrderItemDto } from '@rt/shared';
import { i18n } from '@/i18n';

export function money(amount: number): string {
  const suffix = i18n.global.t('common.sum');
  return `${amount.toLocaleString('ru-RU')} ${suffix}`;
}

/** Picks the Uzbek or Russian variant according to the active locale. */
export function tr(uz: string | null | undefined, ru: string | null | undefined): string {
  const primary = i18n.global.locale.value === 'uz' ? uz : ru;
  return primary || uz || ru || '';
}

type Localized = Pick<DishDto, 'nameRu' | 'nameUz'> | Pick<CategoryDto, 'nameRu' | 'nameUz'> | Pick<OrderItemDto, 'nameRu' | 'nameUz'>;

export function name(item: Localized): string {
  return tr(item.nameUz, item.nameRu);
}

export function description(dish: DishDto): string {
  return tr(dish.descriptionUz, dish.descriptionRu);
}

export function ingredients(dish: DishDto): string[] {
  return tr(dish.ingredientsUz, dish.ingredientsRu)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatDate(iso: string, withTime = true): string {
  const d = new Date(iso);
  // Numeric form (22.09.2026) is the same in both languages.
  if (!withTime) return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return d.toLocaleString(i18n.global.locale.value === 'uz' ? 'uz-UZ' : 'ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

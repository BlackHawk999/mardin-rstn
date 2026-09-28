<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { AdminCategoryDto, SettingsDto } from '@rt/shared';
import { api } from '@/api/client';
import Toggle from '@/components/Toggle.vue';

const form = ref<SettingsDto | null>(null);
const categories = ref<AdminCategoryDto[]>([]);
const botStatus = ref<{ botUsername: string | null; staffChatConnected: boolean; staffChatTitle: string | null } | null>(null);

function toggleSuggestCategory(id: number) {
  if (!form.value) return;
  const list = form.value.cartSuggestCategoryIds ?? [];
  form.value.cartSuggestCategoryIds = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}
const saved = ref(false);
const error = ref('');
const busy = ref(false);

async function save() {
  if (!form.value) return;
  busy.value = true;
  error.value = '';
  try {
    form.value = await api.saveSettings({
      ...form.value,
      deliveryFee: Number(form.value.deliveryFee),
      minOrderAmount: Number(form.value.minOrderAmount),
      restaurantLat: form.value.restaurantLat === null || form.value.restaurantLat === ('' as unknown) ? null : Number(form.value.restaurantLat),
      restaurantLng: form.value.restaurantLng === null || form.value.restaurantLng === ('' as unknown) ? null : Number(form.value.restaurantLng),
    });
    saved.value = true;
    window.setTimeout(() => (saved.value = false), 2000);
  } catch {
    error.value = 'Проверьте поля: время в формате ЧЧ:ММ, суммы — целые числа';
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  [form.value, categories.value] = await Promise.all([api.settings(), api.categories()]);
  botStatus.value = await api.botStatus().catch(() => null);
});
</script>

<template>
  <div class="max-w-2xl space-y-4">
    <h1 class="text-xl font-bold">Настройки</h1>

    <section class="card space-y-3 p-5">
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-bold">Telegram-бот и приём заказов</h2>
        <span v-if="botStatus?.staffChatConnected" class="badge bg-[#e6f4ea] text-success">Чат подключён{{ botStatus.staffChatTitle ? `: ${botStatus.staffChatTitle}` : '' }}</span>
        <span v-else class="badge bg-[#fdecec] text-danger">Чат для заказов не подключён</span>
      </div>
      <p class="text-muted text-xs">Новые заказы приходят в группу ресторана с кнопками «Принять», «Готовится», «Отправлен», «Доставлен». Сотрудники нажимают кнопки, клиент получает уведомления.</p>
      <ol class="list-decimal space-y-1 pl-5 text-[13px]">
        <li>Напишите боту <a v-if="botStatus?.botUsername" :href="`https://t.me/${botStatus.botUsername}`" target="_blank" class="text-accent font-semibold">@{{ botStatus.botUsername }}</a><span v-else>вашему боту</span> команду <code>/start</code>.</li>
        <li>В разделе <RouterLink :to="{ name: 'customers' }" class="text-accent font-semibold">Клиенты</RouterLink> назначьте себе роль «Админ».</li>
        <li>Создайте группу сотрудников в Telegram и добавьте туда бота.</li>
        <li>Отправьте в группе команду <code>/bind</code>. Команда <code>/orders</code> покажет активные заказы.</li>
      </ol>
    </section>

    <form v-if="form" class="space-y-4" @submit.prevent="save">
      <section class="card space-y-3 p-5">
        <h2 class="font-bold">Ресторан</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div><label class="label">Название</label><input v-model="form.restaurantName" class="input" /></div>
          <div><label class="label">Телефон</label><input v-model="form.restaurantPhone" class="input" placeholder="+998 90 000 00 00" /></div>
        </div>
        <div><label class="label">Адрес (для самовывоза)</label><input v-model="form.restaurantAddress" class="input" /></div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div><label class="label">Широта</label><input v-model.number="form.restaurantLat" type="number" step="0.000001" class="input" placeholder="41.311081" /></div>
          <div><label class="label">Долгота</label><input v-model.number="form.restaurantLng" type="number" step="0.000001" class="input" placeholder="69.240562" /></div>
        </div>
        <p class="text-muted text-xs">Координаты используются как начальная точка карты при выборе адреса. Скопировать их можно из Яндекс.Карт: правый клик по точке → «Что здесь?».</p>
      </section>

      <section class="card space-y-3 p-5">
        <h2 class="font-bold">Заказы</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          <div><label class="label">Открытие</label><input v-model="form.openTime" class="input" placeholder="10:00" /></div>
          <div><label class="label">Закрытие</label><input v-model="form.closeTime" class="input" placeholder="23:00" /></div>
          <div>
            <label class="label">Стоимость доставки, сум</label>
            <input v-model.number="form.deliveryFee" type="number" min="0" step="1000" class="input" :disabled="form.deliveryByTaxi" />
          </div>
          <div><label class="label">Минимальная сумма для доставки, сум</label><input v-model.number="form.minOrderAmount" type="number" min="0" step="1000" class="input" /></div>
        </div>
        <Toggle v-model="form.deliveryByTaxi" label="Доставка через такси" />
        <p class="text-muted text-xs">
          Пока включено, фиксированная цена доставки не берётся. Клиент видит, что стоимость зависит от адреса и что доставка идёт через такси.
          Когда запустите свою доставку, выключите и укажите цену. Для самовывоза минимальной суммы нет.
        </p>
      </section>

      <section class="card space-y-3 p-5">
        <h2 class="font-bold">Предложения в корзине</h2>
        <p class="text-muted text-xs">
          В корзине клиент видит блок «Добавить к заказу». Сначала там идут блюда, которые часто заказывают вместе с тем, что уже в корзине.
          Остальное место заполняется блюдами из отмеченных категорий, хиты первыми.
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="c in categories"
            :key="c.id"
            type="button"
            class="btn btn-sm"
            :class="(form.cartSuggestCategoryIds ?? []).includes(c.id) ? '' : 'btn-ghost'"
            @click="toggleSuggestCategory(c.id)"
          >
            {{ c.nameRu }}
          </button>
        </div>
      </section>

      <div class="flex items-center gap-3">
        <button type="submit" class="btn" :disabled="busy">Сохранить</button>
        <span v-if="saved" class="text-success text-xs font-semibold">Сохранено</span>
        <span v-if="error" class="text-danger text-xs">{{ error }}</span>
      </div>
    </form>
  </div>
</template>

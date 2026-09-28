<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import type { AdminCategoryDto, AdminDishDto } from '@rt/shared';
import { api, ApiError, type CategoryInput, type DishInput } from '@/api/client';
import { money } from '@/utils/format';
import ImageUpload from '@/components/ImageUpload.vue';
import Modal from '@/components/Modal.vue';
import Toggle from '@/components/Toggle.vue';

const categories = ref<AdminCategoryDto[]>([]);
const dishes = ref<AdminDishDto[]>([]);
const selectedCategory = ref<number | null>(null);
const search = ref('');

const visibleDishes = computed(() =>
  dishes.value.filter((d) => {
    if (selectedCategory.value !== null && d.categoryId !== selectedCategory.value) return false;
    const q = search.value.trim().toLowerCase();
    return !q || d.nameRu.toLowerCase().includes(q) || d.nameUz.toLowerCase().includes(q);
  }),
);

async function load() {
  [categories.value, dishes.value] = await Promise.all([api.categories(), api.dishes()]);
}

// ---- Category editor ----
const catOpen = ref(false);
const catEditing = ref<number | null>(null);
const catForm = ref<CategoryInput>({});
const catError = ref('');

function openCategory(c?: AdminCategoryDto) {
  catEditing.value = c?.id ?? null;
  catForm.value = c ? { nameRu: c.nameRu, nameUz: c.nameUz, imageUrl: c.imageUrl, isHidden: c.isHidden } : { nameRu: '', nameUz: '', imageUrl: null, isHidden: false };
  catError.value = '';
  catOpen.value = true;
}
async function saveCategory() {
  try {
    if (catEditing.value === null) await api.createCategory(catForm.value);
    else await api.updateCategory(catEditing.value, catForm.value);
    catOpen.value = false;
    await load();
  } catch (e) {
    catError.value = e instanceof ApiError ? 'Проверьте поля (оба названия обязательны)' : 'Нет связи';
  }
}
async function deleteCategory(c: AdminCategoryDto) {
  if (!confirm(`Удалить категорию «${c.nameRu}»?`)) return;
  try {
    await api.deleteCategory(c.id);
    if (selectedCategory.value === c.id) selectedCategory.value = null;
    await load();
  } catch (e) {
    alert(e instanceof ApiError && e.code === 'category_not_empty' ? 'Сначала перенесите или удалите блюда этой категории' : 'Не удалось удалить');
  }
}
async function moveCategory(c: AdminCategoryDto, dir: -1 | 1) {
  const ids = categories.value.map((x) => x.id);
  const i = ids.indexOf(c.id);
  const j = i + dir;
  if (j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  await api.reorderCategories(ids);
  await load();
}

// ---- Dish editor ----
const dishOpen = ref(false);
const dishEditing = ref<number | null>(null);
const dishForm = ref<DishInput>({});
const dishError = ref('');

function openDish(d?: AdminDishDto) {
  dishEditing.value = d?.id ?? null;
  dishForm.value = d
    ? { ...d }
    : {
        categoryId: selectedCategory.value ?? categories.value[0]?.id,
        nameRu: '',
        nameUz: '',
        descriptionRu: '',
        descriptionUz: '',
        ingredientsRu: '',
        ingredientsUz: '',
        imageUrl: null,
        price: 0,
        weight: '',
        isNew: false,
        isHit: false,
        isAvailable: true,
        isHidden: false,
        pickupOnly: false,
      };
  dishError.value = '';
  dishOpen.value = true;
}
async function saveDish() {
  const { id: _id, ...data } = dishForm.value as DishInput & { id?: number };
  data.price = Number(data.price);
  try {
    if (dishEditing.value === null) await api.createDish(data);
    else await api.updateDish(dishEditing.value, data);
    dishOpen.value = false;
    await load();
  } catch (e) {
    dishError.value = e instanceof ApiError ? 'Проверьте поля: названия, категория и цена обязательны' : 'Нет связи';
  }
}
async function toggleDish(d: AdminDishDto, field: 'isAvailable' | 'isHit' | 'isNew' | 'isHidden' | 'pickupOnly') {
  const updated = await api.updateDish(d.id, { [field]: !d[field] });
  dishes.value = dishes.value.map((x) => (x.id === d.id ? updated : x));
}
async function deleteDish(d: AdminDishDto) {
  if (!confirm(`Удалить блюдо «${d.nameRu}»? В старых заказах оно останется.`)) return;
  await api.deleteDish(d.id);
  await load();
}
async function moveDish(d: AdminDishDto, dir: -1 | 1) {
  const list = dishes.value.filter((x) => x.categoryId === d.categoryId).map((x) => x.id);
  const i = list.indexOf(d.id);
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j]!, list[i]!];
  await api.reorderDishes(list);
  await load();
}

const catName = (id: number) => categories.value.find((c) => c.id === id)?.nameRu ?? '—';

onMounted(load);
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[260px_1fr]">
    <!-- Categories -->
    <aside class="card self-start">
      <div class="flex items-center justify-between px-4 py-3">
        <h2 class="font-bold">Категории</h2>
        <button type="button" class="btn btn-secondary btn-sm" @click="openCategory()">+ Новая</button>
      </div>
      <ul>
        <li class="nav-link mx-2 cursor-pointer" :class="{ 'nav-link--active': selectedCategory === null }" @click="selectedCategory = null">
          <span class="flex-1">Все блюда</span><span class="text-muted text-xs">{{ dishes.length }}</span>
        </li>
        <li
          v-for="(c, i) in categories"
          :key="c.id"
          class="nav-link group mx-2 cursor-pointer"
          :class="{ 'nav-link--active': selectedCategory === c.id, 'opacity-50': c.isHidden }"
          @click="selectedCategory = c.id"
        >
          <img v-if="c.imageUrl" :src="c.imageUrl" class="h-7 w-7 rounded-md object-cover" alt="" />
          <span class="flex-1 truncate">{{ c.nameRu }}<span class="text-muted block text-[11px]">{{ c.nameUz }}</span></span>
          <span class="text-muted text-xs">{{ c.dishesCount }}</span>
          <span class="hidden gap-0.5 group-hover:flex" @click.stop>
            <button type="button" class="text-muted px-1 text-xs" :disabled="i === 0" @click="moveCategory(c, -1)">▲</button>
            <button type="button" class="text-muted px-1 text-xs" :disabled="i === categories.length - 1" @click="moveCategory(c, 1)">▼</button>
            <button type="button" class="text-muted px-1 text-xs" @click="openCategory(c)">✎</button>
            <button type="button" class="text-danger px-1 text-xs" @click="deleteCategory(c)">✕</button>
          </span>
        </li>
      </ul>
    </aside>

    <!-- Dishes -->
    <section class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-xl font-bold">{{ selectedCategory === null ? 'Все блюда' : catName(selectedCategory) }}</h1>
        <div class="flex gap-2">
          <input v-model="search" class="input w-56" placeholder="Поиск блюда" />
          <button type="button" class="btn" :disabled="categories.length === 0" @click="openDish()">+ Блюдо</button>
        </div>
      </div>

      <div class="card overflow-x-auto">
        <table class="table">
          <thead>
            <tr><th></th><th>Блюдо</th><th>Категория</th><th>Цена</th><th>В наличии</th><th>Хит</th><th>Новинка</th><th>Только самовывоз</th><th>Скрыто</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="(d, i) in visibleDishes" :key="d.id" :class="{ 'opacity-50': d.isHidden }">
              <td class="w-14"><div class="bg-surface-2 h-11 w-11 overflow-hidden rounded-lg"><img v-if="d.imageUrl" :src="d.imageUrl" class="h-full w-full object-cover" alt="" /></div></td>
              <td><span class="font-medium">{{ d.nameRu }}</span><span class="text-muted block text-xs">{{ d.nameUz }}<span v-if="d.weight"> · {{ d.weight }}</span></span></td>
              <td class="text-xs">{{ catName(d.categoryId) }}</td>
              <td class="font-semibold whitespace-nowrap">{{ money(d.price) }}</td>
              <td><Toggle :model-value="d.isAvailable" @update:model-value="toggleDish(d, 'isAvailable')" /></td>
              <td><Toggle :model-value="d.isHit" @update:model-value="toggleDish(d, 'isHit')" /></td>
              <td><Toggle :model-value="d.isNew" @update:model-value="toggleDish(d, 'isNew')" /></td>
              <td><Toggle :model-value="d.pickupOnly" @update:model-value="toggleDish(d, 'pickupOnly')" /></td>
              <td><Toggle :model-value="d.isHidden" @update:model-value="toggleDish(d, 'isHidden')" /></td>
              <td class="whitespace-nowrap">
                <button v-if="selectedCategory !== null" type="button" class="text-muted px-1" :disabled="i === 0" @click="moveDish(d, -1)">▲</button>
                <button v-if="selectedCategory !== null" type="button" class="text-muted px-1" :disabled="i === visibleDishes.length - 1" @click="moveDish(d, 1)">▼</button>
                <button type="button" class="btn btn-ghost btn-sm ml-1" @click="openDish(d)">Изменить</button>
                <button type="button" class="btn btn-danger btn-sm ml-1" @click="deleteDish(d)">Удалить</button>
              </td>
            </tr>
            <tr v-if="visibleDishes.length === 0"><td colspan="10" class="text-muted py-10 text-center">Блюд нет</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Category modal -->
    <Modal :open="catOpen" :title="catEditing === null ? 'Новая категория' : 'Категория'" @close="catOpen = false">
      <div class="grid gap-4 sm:grid-cols-[1fr_180px]">
        <div class="space-y-3">
          <div><label class="label">Название (рус)</label><input v-model="catForm.nameRu" class="input" /></div>
          <div><label class="label">Nomi (o'zb)</label><input v-model="catForm.nameUz" class="input" /></div>
          <Toggle v-model="catForm.isHidden as boolean" label="Скрыть из меню" />
        </div>
        <div><label class="label">Фото</label><ImageUpload v-model="catForm.imageUrl" aspect="aspect-square" /></div>
      </div>
      <p v-if="catError" class="text-danger mt-2 text-xs">{{ catError }}</p>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="catOpen = false">Отмена</button>
        <button type="button" class="btn" @click="saveCategory">Сохранить</button>
      </template>
    </Modal>

    <!-- Dish modal -->
    <Modal :open="dishOpen" :title="dishEditing === null ? 'Новое блюдо' : 'Блюдо'" wide @close="dishOpen = false">
      <div class="grid gap-5 md:grid-cols-[1fr_240px]">
        <div class="space-y-3">
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="label">Название (рус)</label><input v-model="dishForm.nameRu" class="input" /></div>
            <div><label class="label">Nomi (o'zb)</label><input v-model="dishForm.nameUz" class="input" /></div>
          </div>
          <div class="grid gap-3 sm:grid-cols-3">
            <div>
              <label class="label">Категория</label>
              <select v-model="dishForm.categoryId" class="select"><option v-for="c in categories" :key="c.id" :value="c.id">{{ c.nameRu }}</option></select>
            </div>
            <div><label class="label">Цена, сум</label><input v-model.number="dishForm.price" type="number" min="0" step="1000" class="input" /></div>
            <div><label class="label">Вес / объём</label><input v-model="dishForm.weight" class="input" placeholder="300 г" /></div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="label">Описание (рус)</label><textarea v-model="dishForm.descriptionRu" class="textarea" /></div>
            <div><label class="label">Tavsif (o'zb)</label><textarea v-model="dishForm.descriptionUz" class="textarea" /></div>
          </div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div><label class="label">Состав через запятую (рус)</label><input v-model="dishForm.ingredientsRu" class="input" placeholder="Говядина, лук, специи" /></div>
            <div><label class="label">Tarkibi (o'zb)</label><input v-model="dishForm.ingredientsUz" class="input" placeholder="Mol go'shti, piyoz, ziravorlar" /></div>
          </div>
          <div class="flex flex-wrap gap-5 pt-1">
            <Toggle v-model="dishForm.isAvailable as boolean" label="В наличии" />
            <Toggle v-model="dishForm.isHit as boolean" label="Хит" />
            <Toggle v-model="dishForm.isNew as boolean" label="Новинка" />
            <Toggle v-model="dishForm.pickupOnly as boolean" label="Только самовывоз" />
            <Toggle v-model="dishForm.isHidden as boolean" label="Скрыто" />
          </div>
        </div>
        <div><label class="label">Фото</label><ImageUpload v-model="dishForm.imageUrl" /></div>
      </div>
      <p v-if="dishError" class="text-danger mt-2 text-xs">{{ dishError }}</p>
      <template #footer>
        <button type="button" class="btn btn-ghost" @click="dishOpen = false">Отмена</button>
        <button type="button" class="btn" @click="saveDish">Сохранить</button>
      </template>
    </Modal>
  </div>
</template>

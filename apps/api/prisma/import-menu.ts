import { PrismaClient } from '@prisma/client';
import { MENU } from './menu-data.js';

// Imports prisma/menu-data.ts. Safe to re-run: existing categories/dishes (matched by Russian name) are left as they are,
// so prices or photos changed in the admin panel are never overwritten.
const prisma = new PrismaClient();

async function main() {
  let createdCats = 0;
  let createdDishes = 0;
  let skipped = 0;

  const maxCat = await prisma.category.aggregate({ _max: { sortOrder: true } });
  let catOrder = maxCat._max.sortOrder ?? 0;

  for (const cat of MENU) {
    let category = await prisma.category.findFirst({ where: { nameRu: cat.ru } });
    if (!category) {
      category = await prisma.category.create({ data: { nameRu: cat.ru, nameUz: cat.uz, sortOrder: ++catOrder, isHidden: cat.hidden ?? false } });
      createdCats++;
    }

    let dishOrder = (await prisma.dish.aggregate({ _max: { sortOrder: true }, where: { categoryId: category.id } }))._max.sortOrder ?? 0;

    const rows = cat.items.flatMap((item) =>
      item.sizes
        ? item.sizes.map(([labelRu, labelUz, price]) => ({ ...item, ru: `${item.ru}, ${labelRu}`, uz: `${item.uz}, ${labelUz}`, price, weight: labelRu }))
        : [{ ...item, weight: undefined as string | undefined }],
    );

    for (const row of rows) {
      const exists = await prisma.dish.findFirst({ where: { nameRu: row.ru } });
      if (exists) {
        skipped++;
        continue;
      }
      await prisma.dish.create({
        data: {
          categoryId: category.id,
          nameRu: row.ru,
          nameUz: row.uz,
          price: row.price,
          weight: row.weight ?? null,
          ingredientsRu: row.ingRu ?? null,
          ingredientsUz: row.ingUz ?? null,
          descriptionRu: row.descRu ?? null,
          descriptionUz: row.descUz ?? null,
          pickupOnly: cat.pickupOnly ?? false,
          sortOrder: ++dishOrder,
        },
      });
      createdDishes++;
    }
  }

  console.log(`Menu import: ${createdCats} categories and ${createdDishes} dishes created, ${skipped} dishes already existed.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

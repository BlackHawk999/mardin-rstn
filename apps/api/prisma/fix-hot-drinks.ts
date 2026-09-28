import { PrismaClient } from '@prisma/client';

// One-off (2026-09-24): show "Чай и кофе" again, but make its dishes pickup-only.
const prisma = new PrismaClient();

async function main() {
  const cat = await prisma.category.findFirst({ where: { nameRu: 'Чай и кофе' } });
  if (!cat) return console.log('Category "Чай и кофе" not found, nothing to do.');
  await prisma.category.update({ where: { id: cat.id }, data: { isHidden: false } });
  const res = await prisma.dish.updateMany({ where: { categoryId: cat.id }, data: { pickupOnly: true } });
  console.log(`"Чай и кофе" visible again, ${res.count} dishes set to pickup-only.`);
}

main().finally(() => prisma.$disconnect());

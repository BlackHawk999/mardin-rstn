import { PrismaClient } from '@prisma/client';

// Removes only the demo menu (dishes and banners with Unsplash photos, then categories left empty).
// Anything added through the admin panel stays untouched. Orders keep their item snapshots.
const prisma = new PrismaClient();
const DEMO = 'images.unsplash.com';

async function main() {
  const banners = await prisma.banner.deleteMany({ where: { imageUrl: { contains: DEMO } } });
  const dishes = await prisma.dish.deleteMany({ where: { imageUrl: { contains: DEMO } } });
  const emptyCats = await prisma.category.findMany({ where: { dishes: { none: {} } }, select: { id: true, imageUrl: true } });
  const demoCats = emptyCats.filter((c) => c.imageUrl?.includes(DEMO)).map((c) => c.id);
  const cats = await prisma.category.deleteMany({ where: { id: { in: demoCats } } });
  console.log(`Removed demo data: ${dishes.count} dishes, ${cats.count} categories, ${banners.count} banners.`);
}

main().finally(() => prisma.$disconnect());

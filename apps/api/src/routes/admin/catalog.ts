import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../db.js';
import { toAdminBannerDto, toAdminCategoryDto, toAdminDishDto } from '../../adminDto.js';

const idParam = (req: { params: unknown }) => Number((req.params as { id: string }).id);

const categorySchema = z.object({
  nameUz: z.string().trim().min(1).max(80),
  nameRu: z.string().trim().min(1).max(80),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  sortOrder: z.number().int().optional(),
  isHidden: z.boolean().optional(),
});

const dishSchema = z.object({
  categoryId: z.number().int(),
  nameUz: z.string().trim().min(1).max(120),
  nameRu: z.string().trim().min(1).max(120),
  descriptionUz: z.string().trim().max(1000).nullable().optional(),
  descriptionRu: z.string().trim().max(1000).nullable().optional(),
  ingredientsUz: z.string().trim().max(500).nullable().optional(),
  ingredientsRu: z.string().trim().max(500).nullable().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  price: z.number().int().min(0),
  weight: z.string().trim().max(40).nullable().optional(),
  isNew: z.boolean().optional(),
  isHit: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  pickupOnly: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const bannerSchema = z.object({
  imageUrl: z.string().trim().min(1).max(500),
  titleUz: z.string().trim().max(120).nullable().optional(),
  titleRu: z.string().trim().max(120).nullable().optional(),
  subtitleUz: z.string().trim().max(200).nullable().optional(),
  subtitleRu: z.string().trim().max(200).nullable().optional(),
  categoryId: z.number().int().nullable().optional(),
  dishId: z.number().int().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function adminCatalogRoutes(app: FastifyInstance) {
  // ---- Categories ----
  app.get('/categories', async () => {
    const rows = await prisma.category.findMany({ include: { _count: { select: { dishes: true } } }, orderBy: { sortOrder: 'asc' } });
    return rows.map(toAdminCategoryDto);
  });

  app.post('/categories', async (req, reply) => {
    const body = categorySchema.parse(req.body);
    const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const row = await prisma.category.create({
      data: { ...body, sortOrder: body.sortOrder ?? (max._max.sortOrder ?? 0) + 1 },
      include: { _count: { select: { dishes: true } } },
    });
    return reply.code(201).send(toAdminCategoryDto(row));
  });

  app.patch('/categories/:id', async (req) => {
    const body = categorySchema.partial().parse(req.body);
    const row = await prisma.category.update({ where: { id: idParam(req) }, data: body, include: { _count: { select: { dishes: true } } } });
    return toAdminCategoryDto(row);
  });

  app.delete('/categories/:id', async (req, reply) => {
    const id = idParam(req);
    const count = await prisma.dish.count({ where: { categoryId: id } });
    if (count > 0) return reply.code(422).send({ error: 'category_not_empty', details: { dishes: count } });
    await prisma.category.delete({ where: { id } });
    return { ok: true };
  });

  /** Reorder: body is the full list of ids in the desired order. */
  app.post('/categories/reorder', async (req) => {
    const { ids } = z.object({ ids: z.array(z.number().int()) }).parse(req.body);
    await prisma.$transaction(ids.map((id, i) => prisma.category.update({ where: { id }, data: { sortOrder: i + 1 } })));
    return { ok: true };
  });

  // ---- Dishes ----
  app.get('/dishes', async (req) => {
    const q = z.object({ categoryId: z.coerce.number().int().optional(), q: z.string().trim().optional() }).parse(req.query);
    const rows = await prisma.dish.findMany({
      where: {
        ...(q.categoryId ? { categoryId: q.categoryId } : {}),
        ...(q.q ? { OR: [{ nameRu: { contains: q.q } }, { nameUz: { contains: q.q } }] } : {}),
      },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
    return rows.map(toAdminDishDto);
  });

  app.post('/dishes', async (req, reply) => {
    const body = dishSchema.parse(req.body);
    const max = await prisma.dish.aggregate({ _max: { sortOrder: true }, where: { categoryId: body.categoryId } });
    const row = await prisma.dish.create({ data: { ...body, sortOrder: body.sortOrder ?? (max._max.sortOrder ?? 0) + 1 } });
    return reply.code(201).send(toAdminDishDto(row));
  });

  app.patch('/dishes/:id', async (req) => {
    const body = dishSchema.partial().parse(req.body);
    const row = await prisma.dish.update({ where: { id: idParam(req) }, data: body });
    return toAdminDishDto(row);
  });

  app.delete('/dishes/:id', async (req) => {
    const id = idParam(req);
    // Orders keep their item snapshots (dishId becomes null via onDelete: SetNull).
    await prisma.dish.delete({ where: { id } });
    return { ok: true };
  });

  app.post('/dishes/reorder', async (req) => {
    const { ids } = z.object({ ids: z.array(z.number().int()) }).parse(req.body);
    await prisma.$transaction(ids.map((id, i) => prisma.dish.update({ where: { id }, data: { sortOrder: i + 1 } })));
    return { ok: true };
  });

  // ---- Banners ----
  app.get('/banners', async () => {
    const rows = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
    return rows.map(toAdminBannerDto);
  });

  app.post('/banners', async (req, reply) => {
    const body = bannerSchema.parse(req.body);
    const max = await prisma.banner.aggregate({ _max: { sortOrder: true } });
    const row = await prisma.banner.create({ data: { ...body, sortOrder: body.sortOrder ?? (max._max.sortOrder ?? 0) + 1 } });
    return reply.code(201).send(toAdminBannerDto(row));
  });

  app.patch('/banners/:id', async (req) => {
    const body = bannerSchema.partial().parse(req.body);
    const row = await prisma.banner.update({ where: { id: idParam(req) }, data: body });
    return toAdminBannerDto(row);
  });

  app.delete('/banners/:id', async (req) => {
    await prisma.banner.delete({ where: { id: idParam(req) } });
    return { ok: true };
  });
}

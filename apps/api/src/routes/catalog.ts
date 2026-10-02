import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { CatalogDto, WeatherDto } from '@rt/shared';
import { prisma } from '../db.js';
import { toBannerDto, toCategoryDto, toDishDto } from '../dto.js';
import { getSettings, isOpenNow } from '../services/settings.js';
import { getRecommendations } from '../services/recommendations.js';
import { getWeather } from '../services/weather.js';

/** Public: the whole menu in one request. The mini app loads it once and caches it. */
export async function catalogRoutes(app: FastifyInstance) {
  app.get('/catalog', async (): Promise<CatalogDto> => {
    const [categories, dishes, banners, settings] = await Promise.all([
      prisma.category.findMany({ where: { isHidden: false }, orderBy: { sortOrder: 'asc' } }),
      prisma.dish.findMany({ where: { isHidden: false, category: { isHidden: false } }, orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }),
      prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      getSettings(),
    ]);
    return {
      categories: categories.map(toCategoryDto),
      dishes: dishes.map(toDishDto),
      banners: banners.map(toBannerDto),
      settings,
      isOpen: isOpenNow(settings),
    };
  });

  /** Public: current weather at the restaurant (decorative sky in the mini app). */
  app.get('/weather', async (): Promise<WeatherDto> => getWeather());

  /** Cart upsell: GET /recommendations?ids=1,2,3 → { ids, togetherCount } */
  app.get('/recommendations', async (req) => {
    const { ids } = z.object({ ids: z.string().optional() }).parse(req.query);
    const dishIds = (ids ?? '')
      .split(',')
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, 50);
    return getRecommendations(dishIds);
  });
}

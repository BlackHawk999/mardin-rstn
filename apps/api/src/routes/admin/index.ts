import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { checkPassword, issueAdminToken } from '../../plugins/adminAuth.js';
import { adminOrderRoutes } from './orders.js';
import { adminCatalogRoutes } from './catalog.js';
import { adminUserRoutes } from './users.js';
import { adminSettingsRoutes } from './settings.js';
import { adminUploadRoutes } from './upload.js';
import { adminStatsRoutes } from './stats.js';

export async function adminRoutes(app: FastifyInstance) {
  // Public: password login
  app.post('/login', async (req, reply) => {
    const body = z.object({ login: z.string().trim().min(1), password: z.string().min(1) }).parse(req.body);
    if (!checkPassword(body.login, body.password)) return reply.code(401).send({ error: 'invalid_credentials' });
    return { token: issueAdminToken({ sub: 'password', name: body.login }) };
  });

  // Everything below requires an admin session
  app.register(async (protectedApp) => {
    protectedApp.addHook('preHandler', protectedApp.requireAdmin);
    protectedApp.get('/me', async (req) => ({ name: req.admin.name, sub: req.admin.sub }));
    await protectedApp.register(adminOrderRoutes);
    await protectedApp.register(adminCatalogRoutes);
    await protectedApp.register(adminUserRoutes);
    await protectedApp.register(adminSettingsRoutes);
    await protectedApp.register(adminUploadRoutes);
    await protectedApp.register(adminStatsRoutes);
  });
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { ZodError } from 'zod';
import { env } from './env.js';
import { prisma } from './db.js';
import { authPlugin } from './plugins/auth.js';
import { adminAuthPlugin } from './plugins/adminAuth.js';
import { geoRoutes } from './routes/geo.js';
import { adminRoutes } from './routes/admin/index.js';
import { UPLOAD_DIR } from './routes/admin/upload.js';
import { catalogRoutes } from './routes/catalog.js';
import { meRoutes } from './routes/me.js';
import { orderRoutes } from './routes/orders.js';
import { bot, setupBot } from './bot/index.js';
import { registerStaffHandlers } from './bot/staff.js';

const app = Fastify({
  logger:
    env.NODE_ENV === 'production'
      ? { level: 'info' }
      : { level: 'info', transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname,reqId' } } },
  // Per-request JSON lines are too noisy in dev; errors are still logged.
  disableRequestLogging: true,
});

await app.register(cors, { origin: true });
// Phone photos can be large; they are compressed on upload (routes/admin/upload.ts).
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024, files: 1 } });
await app.register(fastifyStatic, { root: UPLOAD_DIR, prefix: '/uploads/', decorateReply: false, maxAge: '7d' });
await app.register(authPlugin);
await app.register(adminAuthPlugin);

app.setErrorHandler((err, _req, reply) => {
  if (err instanceof ZodError) {
    return reply.code(400).send({ error: 'validation', issues: err.issues });
  }
  app.log.error(err);
  const status = typeof err === 'object' && err && 'statusCode' in err && typeof err.statusCode === 'number' ? err.statusCode : 500;
  return reply.code(status).send({ error: 'internal' });
});

app.get('/health', async () => ({ ok: true }));

await app.register(catalogRoutes, { prefix: '/api' });
await app.register(meRoutes, { prefix: '/api' });
await app.register(orderRoutes, { prefix: '/api' });
await app.register(geoRoutes, { prefix: '/api' });
await app.register(adminRoutes, { prefix: '/api/admin' });

registerStaffHandlers();

await app.listen({ port: env.PORT, host: '0.0.0.0' });

// Long polling is enough for development and small deployments; switch to a webhook later if needed.
try {
  await bot.init();
  await setupBot();
  bot.start({ onStart: (me) => app.log.info(`Bot @${me.username} started`) }).catch((e) => app.log.error(e, 'Bot polling stopped'));
} catch (e) {
  app.log.error(e, 'Bot failed to start (check BOT_TOKEN). API keeps running.');
}

const shutdown = async () => {
  await bot.stop();
  await app.close();
  await prisma.$disconnect();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

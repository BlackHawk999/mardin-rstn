import fs from 'node:fs';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';

/**
 * Production: the API also serves the built frontends from one origin (no Vercel / reverse proxy needed).
 *   /        → apps/miniapp/dist
 *   /admin/  → apps/admin/dist (built with base '/admin/')
 * A site is skipped when its dist is missing, so dev (Vite on its own port) is unaffected.
 */
const APPS_DIR = path.resolve(process.cwd(), '..');

const sites = [
  { prefix: '/admin/', root: path.join(APPS_DIR, 'admin', 'dist') },
  { prefix: '/', root: path.join(APPS_DIR, 'miniapp', 'dist') },
].filter((s) => fs.existsSync(path.join(s.root, 'index.html')));

export async function registerStaticSites(app: FastifyInstance) {
  if (!sites.length) return;

  for (const site of sites) {
    await app.register(fastifyStatic, {
      root: site.root,
      prefix: site.prefix,
      decorateReply: false,
      // Vite puts content-hashed files in assets/; index.html must always be re-checked so new deploys show up.
      setHeaders: (res, filePath) => {
        res.header(
          'cache-control',
          filePath.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
        );
      },
    });
  }

  app.get('/admin', (_req, reply) => reply.redirect('/admin/'));

  // SPA fallback: client-side routes (/cart, /admin/orders/5, ...) get the app's index.html.
  app.setNotFoundHandler((req, reply) => {
    const url = req.url.split('?')[0];
    const isPage = req.method === 'GET' && !url.startsWith('/api/') && !url.startsWith('/uploads/') && !path.extname(url);
    const site = isPage ? sites.find((s) => url.startsWith(s.prefix)) : undefined;
    if (!site) return reply.code(404).send({ error: 'not_found' });
    return reply
      .type('text/html; charset=utf-8')
      .header('cache-control', 'no-cache')
      .send(fs.createReadStream(path.join(site.root, 'index.html')));
  });
}

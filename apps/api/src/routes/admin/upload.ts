import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import sharp from 'sharp';
import { env } from '../../env.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

/** Longest side of stored images. Enough for the 320px-tall dish hero on 3x phone screens. */
const MAX_SIDE = 1200;
const QUALITY = 80;

const accepted = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif']);

/**
 * POST /upload (multipart, field "file") → { url }.
 * Phone photos (3–15 MB) are auto-rotated, downscaled to MAX_SIDE and re-encoded as WebP (~100–250 KB),
 * so the mini app stays fast. Files are served from /uploads/<name>.
 */
export async function adminUploadRoutes(app: FastifyInstance) {
  app.post('/upload', async (req, reply) => {
    const file = await req.file();
    if (!file) return reply.code(400).send({ error: 'file_required' });
    if (!accepted.has(file.mimetype)) return reply.code(415).send({ error: 'unsupported_type' });

    const input = await file.toBuffer();
    if (file.file.truncated) return reply.code(413).send({ error: 'file_too_large' });

    let output: Buffer;
    try {
      output = await sharp(input, { failOn: 'none' })
        .rotate() // respect EXIF orientation from phones
        .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
    } catch (e) {
      req.log.warn(e, 'image decode failed');
      return reply.code(415).send({ error: 'unsupported_type' });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}.webp`;
    await writeFile(path.join(UPLOAD_DIR, name), output);

    return { url: `${env.PUBLIC_API_URL}/uploads/${name}` };
  });
}

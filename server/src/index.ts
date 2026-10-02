import Anthropic from '@anthropic-ai/sdk';
import { serve } from '@hono/node-server';
import { getConnInfo } from '@hono/node-server/conninfo';
import { Hono, type Context } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { z } from 'zod';

import { CoachInputSchema, RefusalError, coach, scanSlip } from './claude.js';

const PORT = Number(process.env.PORT ?? 8787);
// Claude accepts images up to 5 MB; base64 inflates size by 4/3.
const MAX_IMAGE_BASE64 = Math.floor((5 * 1024 * 1024 * 4) / 3);
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: Number(process.env.RATE_LIMIT_PER_10_MIN ?? 30) };

const SlipInputSchema = z.object({
  imageBase64: z.string().min(100).max(MAX_IMAGE_BASE64),
  mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
});

const app = new Hono();
app.use('*', cors());
app.use('/api/*', bodyLimit({ maxSize: MAX_IMAGE_BASE64 + 64 * 1024 }));

// Minimal per-IP fixed-window limiter so a leaked URL can't run up the API bill.
// Replace with real user auth before going to production.
const hits = new Map<string, { start: number; count: number }>();
app.use('/api/*', async (c, next) => {
  const ip = getConnInfo(c).remote.address ?? 'unknown';
  const now = Date.now();
  if (hits.size > 10_000) {
    for (const [key, v] of hits) if (now - v.start > RATE_LIMIT.windowMs) hits.delete(key);
  }
  const entry = hits.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT.windowMs) hits.set(ip, { start: now, count: 1 });
  else if (++entry.count > RATE_LIMIT.max) return c.json({ error: 'ใช้งานถี่เกินไป ลองใหม่ภายหลัง' }, 429);
  await next();
});

function handleError(c: Context, err: unknown) {
  if (err instanceof RefusalError) return c.json({ error: err.message }, 422);
  if (err instanceof Anthropic.RateLimitError) return c.json({ error: 'AI ไม่ว่าง ลองใหม่อีกครั้ง' }, 503);
  if (err instanceof Anthropic.AuthenticationError) {
    console.error('Anthropic authentication failed — check ANTHROPIC_API_KEY');
    return c.json({ error: 'เซิร์ฟเวอร์ตั้งค่าไม่ถูกต้อง' }, 500);
  }
  if (err instanceof Anthropic.APIError) {
    console.error(`Anthropic API error ${err.status}:`, err.message);
    return c.json({ error: 'AI ขัดข้อง ลองใหม่อีกครั้ง' }, 502);
  }
  console.error(err);
  return c.json({ error: 'เกิดข้อผิดพลาด' }, 500);
}

app.get('/health', (c) => c.json({ ok: true }));

app.post('/api/scan-slip', async (c) => {
  const parsed = SlipInputSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'รูปไม่ถูกต้องหรือใหญ่เกินไป (สูงสุด 5MB)' }, 400);
  try {
    return c.json(await scanSlip(parsed.data.imageBase64, parsed.data.mediaType));
  } catch (err) {
    return handleError(c, err);
  }
});

app.post('/api/coach', async (c) => {
  const parsed = CoachInputSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'ข้อมูลไม่ถูกต้อง' }, 400);
  try {
    return c.json(await coach(parsed.data));
  } catch (err) {
    return handleError(c, err);
  }
});

serve({ fetch: app.fetch, port: PORT, hostname: '0.0.0.0' }, (info) => {
  console.log(`AI Finance Coach API listening on http://localhost:${info.port}`);
});

// Öğretmen HTTP sunucusu. Yalnızca bu bilgisayarda dinler; tablet Vite (5173) üzerinden gelir.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import {
  askTutor,
  createLesson,
  lessonDir,
  listLessons,
  loadConfig,
  makeQuiz,
  MAX_IMAGES,
  readInputText,
  readMeta,
  runLesson,
  teach,
  understand,
  type OnProgress,
  type TeacherConfig,
  type UploadedImage,
} from './index.ts';
import { parseMultipart } from './multipart.ts';
import { synthesize } from './tts.ts';
import type { LessonLang, ProgressEvent } from './types.ts';

const PORT = Number(process.env.OGRETMEN_PORT ?? 5174);
const HOST = '127.0.0.1';
const BODY_LIMIT = 20 * 1024 * 1024;
const IMAGE_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

let config: TeacherConfig | null = null;
try {
  config = loadConfig();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
}

const listeners = new Map<string, Set<(event: ProgressEvent) => void>>();
const onProgress: OnProgress = (event) => {
  for (const listener of listeners.get(event.lessonId) ?? []) listener(event);
};

let queue: Promise<unknown> = Promise.resolve();
/** Aynı anda tek ajan çalışsın. Çağıran bekleyebilir; kuyruk hata yüzünden kopmaz. */
function enqueue<T>(job: () => Promise<T>): Promise<T> {
  const result = queue.then(job, job);
  queue = result.then(
    () => undefined,
    (err: unknown) => {
      console.error(err instanceof Error ? err.message : err);
    },
  );
  return result;
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(new Error('İstek çok büyük.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function requireConfig(): TeacherConfig {
  if (!config) throw new Error('CURSOR_API_KEY tanımlı değil. ogretmen/.env.local dosyasını kontrol edin.');
  return config;
}

function langOf(value: string | undefined): LessonLang | undefined {
  return value === 'tr' || value === 'de' || value === 'en' ? value : undefined;
}

function gradeOf(value: string | undefined): number | undefined {
  const grade = Number(value);
  return Number.isInteger(grade) && grade >= 1 && grade <= 12 ? grade : undefined;
}

async function formData(req: IncomingMessage) {
  const type = req.headers['content-type'] ?? '';
  const body = await readBody(req);
  if (type.includes('multipart/form-data')) return parseMultipart(body, type);
  if (type.includes('application/json')) {
    const json = JSON.parse(body.toString('utf8') || '{}') as Record<string, unknown>;
    const fields: Record<string, string> = {};
    for (const [key, value] of Object.entries(json)) {
      if (typeof value === 'string' || typeof value === 'number') fields[key] = String(value);
    }
    return { fields, files: [] };
  }
  return { fields: {}, files: [] };
}

function imagesOf(files: { name: string; mimeType: string; data: Buffer }[]): UploadedImage[] {
  return files
    .filter((file) => file.name === 'resim')
    .slice(0, MAX_IMAGES)
    .map((file) => ({ data: file.data, mimeType: file.mimeType }));
}

function subscribe(id: string, listener: (event: ProgressEvent) => void): () => void {
  const set = listeners.get(id) ?? new Set();
  set.add(listener);
  listeners.set(id, set);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(id);
  };
}

async function serveFile(res: ServerResponse, path: string): Promise<boolean> {
  if (!existsSync(path)) return false;
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const mime = IMAGE_MIME[ext] ?? 'application/octet-stream';
  const data = await readFile(path);
  res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store', 'Content-Length': data.length });
  res.end(data);
  return true;
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${HOST}`);
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'api' || parts[1] !== 'ogretmen') {
    send(res, 404, { error: 'Bulunamadı.' });
    return;
  }

  if (req.method === 'GET' && parts[2] === 'ses') {
    const text = url.searchParams.get('metin')?.trim() ?? '';
    if (!text || text.length > 800) {
      send(res, 400, { error: 'Seslendirilecek metin yok veya çok uzun.' });
      return;
    }
    const lang = url.searchParams.get('dil') ?? 'tr';
    const rate = Number(url.searchParams.get('hiz') ?? '1');
    const audio = await synthesize(text, lang, Number.isFinite(rate) ? rate : 1);
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400',
      'Content-Length': audio.length,
    });
    res.end(audio);
    return;
  }

  if (req.method === 'GET' && parts.length === 3 && parts[2] === 'dersler') {
    send(res, 200, await listLessons());
    return;
  }

  if (req.method === 'POST' && parts.length === 3 && parts[2] === 'dersler') {
    const teacher = requireConfig();
    const form = await formData(req);
    const meta = await createLesson(
      {
        images: imagesOf(form.files),
        text: form.fields.metin,
        topic: form.fields.konu,
        grade: gradeOf(form.fields.sinif),
        lang: langOf(form.fields.dil),
        request: form.fields.istek,
      },
      teacher.model,
    );
    enqueue(() => runLesson(meta.id, teacher, onProgress));
    send(res, 202, { id: meta.id });
    return;
  }

  const id = parts[3];
  if (!id || !/^[a-z0-9-]+$/.test(id)) {
    send(res, 404, { error: 'Bulunamadı.' });
    return;
  }
  const dir = lessonDir(id);
  const tail = parts.slice(4);

  if (req.method === 'GET' && tail.length === 0) {
    send(res, 200, await readMeta(id));
    return;
  }

  if (req.method === 'GET' && tail[0] === 'olaylar') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    const meta = await readMeta(id).catch(() => undefined);
    if (meta) res.write(`data: ${JSON.stringify({ lessonId: id, stage: 'understand', kind: 'working', message: meta.status })}\n\n`);
    const stop = subscribe(id, (event) => res.write(`data: ${JSON.stringify(event)}\n\n`));
    const beat = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => {
      clearInterval(beat);
      stop();
    });
    return;
  }

  if (req.method === 'GET' && (tail[0] === 'source' || tail[0] === 'lesson')) {
    const path = join(dir, `${tail[0]}.json`);
    if (!existsSync(path)) {
      send(res, 404, { error: 'Henüz hazır değil.' });
      return;
    }
    send(res, 200, JSON.parse(await readFile(path, 'utf8')));
    return;
  }

  if (req.method === 'GET' && tail[0] === 'girdi' && tail[1]) {
    const name = basename(tail[1]);
    if (!/^[0-9]+\.(png|jpe?g|webp)$/i.test(name) || !(await serveFile(res, join(dir, 'girdi', name)))) {
      send(res, 404, { error: 'Resim yok.' });
    }
    return;
  }

  if (req.method === 'GET' && tail[0] === 'sinavlar' && tail[1]) {
    const path = join(dir, `quiz-${tail[1]}.json`);
    if (!/^[0-9]+$/.test(tail[1]) || !existsSync(path)) {
      send(res, 404, { error: 'Sınav yok.' });
      return;
    }
    send(res, 200, JSON.parse(await readFile(path, 'utf8')));
    return;
  }

  if (req.method === 'GET' && tail[0] === 'cevaplar' && /^[0-9]+$/.test(tail[1] ?? '')) {
    if (tail[2] === 'resim') {
      const names = existsSync(join(dir, 'answers')) ? await readdir(join(dir, 'answers')) : [];
      const name = names.find((file) => new RegExp(`^${tail[1]}\\.(png|jpe?g|webp)$`, 'i').test(file));
      if (!name || !(await serveFile(res, join(dir, 'answers', name)))) send(res, 404, { error: 'Resim yok.' });
      return;
    }
    const path = join(dir, 'answers', `${tail[1]}.json`);
    if (!existsSync(path)) {
      send(res, 404, { error: 'Cevap yok.' });
      return;
    }
    send(res, 200, JSON.parse(await readFile(path, 'utf8')));
    return;
  }

  if (req.method === 'POST' && tail[0] === 'dil') {
    const teacher = requireConfig();
    const form = await formData(req);
    const lang = langOf(form.fields.dil);
    if (lang !== 'tr' && lang !== 'de') throw new Error('Dil Türkçe veya Almanca olmalı.');
    const meta = await readMeta(id);
    const images: UploadedImage[] = [];
    for (const file of meta.input.images) {
      const ext = file.split('.').pop()?.toLowerCase() ?? '';
      const mimeType = IMAGE_MIME[ext];
      if (!mimeType) continue;
      images.push({ data: await readFile(join(dir, file)), mimeType });
    }
    const saved = await readInputText(id);
    const created = await createLesson(
      {
        images,
        text: saved.text,
        topic: saved.topic,
        grade: meta.input.grade,
        lang,
        request: meta.input.request,
      },
      teacher.model,
    );
    enqueue(() => runLesson(created.id, teacher, onProgress));
    send(res, 202, { id: created.id });
    return;
  }

  if (req.method === 'POST' && tail[0] === 'sinav') {
    const teacher = requireConfig();
    const form = await formData(req);
    const { quiz, file } = await enqueue(() => makeQuiz(id, teacher, {
      count: form.fields.count ? Number(form.fields.count) : form.fields.sayi ? Number(form.fields.sayi) : undefined,
      request: form.fields.request || form.fields.istek,
    }, onProgress));
    send(res, 200, { file, quiz });
    return;
  }

  if (req.method === 'POST' && tail[0] === 'sorular') {
    const teacher = requireConfig();
    const form = await formData(req);
    const image = imagesOf(form.files)[0];
    const { answer, file } = await enqueue(() => askTutor(id, teacher, {
      question: form.fields.soru ?? '',
      image,
    }, onProgress));
    send(res, 200, { file, answer, hasImage: Boolean(image) });
    return;
  }

  if (req.method === 'POST' && tail[0] === 'yeniden') {
    const teacher = requireConfig();
    enqueue(async () => {
      if (!existsSync(join(dir, 'source.json'))) await understand(id, teacher, onProgress);
      const meta = await readMeta(id);
      if (meta.status !== 'rejected') await teach(id, teacher, onProgress);
    });
    send(res, 202, { id });
    return;
  }

  send(res, 404, { error: 'Bulunamadı.' });
}

const server = createServer((req, res) => {
  void handle(req, res).catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Sunucu hatası.';
    console.error(message);
    if (!res.headersSent) send(res, 400, { error: message });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Öğretmen sunucusu http://${HOST}:${PORT}/`);
  console.log(config ? `Model: ${config.model}` : 'API anahtarı yok; ders üretilemez.');
});

import { randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { LessonInput, LessonLang, LessonListItem, LessonMeta } from './types.ts';

/**
 * Disk düzeni (kök: OGRETMEN_VERI, varsayılan <repo>/ogretmen-veri):
 *   dersler/<id>/meta.json      LessonMeta
 *   dersler/<id>/girdi/1.jpg    çocuğun gönderdiği resimler
 *   dersler/<id>/source.json    Ajan 1 çıktısı (SourceDoc)
 *   dersler/<id>/lesson.json    Ajan 2 çıktısı (Lesson)
 *   dersler/<id>/quiz-<n>.json  Quiz
 *   dersler/<id>/answers/<n>.json  TutorAnswer (+ soru metni: <n>.question.txt)
 */
export function dataRoot(): string {
  return resolve(process.env.OGRETMEN_VERI ?? join(import.meta.dirname, '..', '..', 'ogretmen-veri'));
}

export function lessonDir(id: string): string {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Geçersiz ders kimliği: ${id}`);
  return join(dataRoot(), 'dersler', id);
}

/** Ajanların çalışma klasörü: boş tutulur ki proje kuralları/dosyaları bağlama girmesin. */
export async function agentWorkDir(): Promise<string> {
  const dir = join(dataRoot(), '.calisma');
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

/** Yarım yazılmış dosyayı arayüzün okumaması için önce geçici dosyaya yazar. */
export async function writeJson(path: string, data: unknown): Promise<void> {
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await rename(tmp, path);
}

export async function readMeta(id: string): Promise<LessonMeta> {
  return readJson<LessonMeta>(join(lessonDir(id), 'meta.json'));
}

export async function updateMeta(id: string, patch: Partial<LessonMeta>): Promise<LessonMeta> {
  const meta = { ...(await readMeta(id)), ...patch, updatedAt: new Date().toISOString() };
  await writeJson(join(lessonDir(id), 'meta.json'), meta);
  return meta;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

/** Tek resim için üst sınır. Arayüz göndermeden önce uzun kenarı ~1600 px'e küçültmeli. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGES = 4;

export interface UploadedImage {
  data: Buffer;
  mimeType: string;
}

export async function createLesson(
  input: Omit<LessonInput, 'images'> & { images?: UploadedImage[] },
  model: string,
): Promise<LessonMeta> {
  const images = input.images ?? [];
  if (!images.length && !input.text?.trim() && !input.topic?.trim()) {
    throw new Error('Resim, metin veya konu gerekli.');
  }
  if (images.length > MAX_IMAGES) throw new Error(`En fazla ${MAX_IMAGES} resim gönderilebilir.`);
  for (const img of images) {
    if (!EXT[img.mimeType]) throw new Error(`Desteklenmeyen resim türü: ${img.mimeType}`);
    if (img.data.length > MAX_IMAGE_BYTES) throw new Error('Resim çok büyük (en fazla 8 MB).');
  }

  const now = new Date();
  const id = `${now.toISOString().slice(0, 10)}-${randomBytes(3).toString('hex')}`;
  const dir = lessonDir(id);
  await mkdir(join(dir, 'girdi'), { recursive: true });

  const files: string[] = [];
  for (const [i, img] of images.entries()) {
    const name = `girdi/${i + 1}.${EXT[img.mimeType]}`;
    await writeFile(join(dir, name), img.data);
    files.push(name);
  }

  const lang: LessonLang = input.lang ?? 'tr';
  const meta: LessonMeta = {
    id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: 'understanding',
    input: {
      kind: images.length ? 'page' : input.text?.trim() ? 'text' : 'topic',
      images: files,
      lang,
      ...(input.grade ? { grade: input.grade } : {}),
      ...(input.request?.trim() ? { request: input.request.trim() } : {}),
    },
    model,
    agentIds: {},
    quizzes: 0,
    answers: 0,
  };
  if (input.text?.trim()) await writeFile(join(dir, 'girdi', 'metin.txt'), input.text.trim(), 'utf8');
  if (input.topic?.trim()) await writeFile(join(dir, 'girdi', 'konu.txt'), input.topic.trim(), 'utf8');
  await writeJson(join(dir, 'meta.json'), meta);
  return meta;
}

export async function readInputText(id: string): Promise<{ text?: string; topic?: string }> {
  const dir = join(lessonDir(id), 'girdi');
  const read = async (f: string) =>
    existsSync(join(dir, f)) ? (await readFile(join(dir, f), 'utf8')) : undefined;
  return { text: await read('metin.txt'), topic: await read('konu.txt') };
}

async function lessonLabel(id: string): Promise<Pick<LessonListItem, 'title' | 'subject' | 'topic'>> {
  const dir = lessonDir(id);
  let title: string | undefined;
  let subject: string | undefined;
  let topic: string | undefined;
  const lesson = await readJson<{ title?: string; subject?: string }>(join(dir, 'lesson.json')).catch(() => undefined);
  const source = await readJson<{ subject?: string; topic?: string }>(join(dir, 'source.json')).catch(() => undefined);
  title = lesson?.title?.trim() || undefined;
  subject = lesson?.subject?.trim() || source?.subject?.trim() || undefined;
  topic = source?.topic?.trim() || undefined;
  if (!topic) topic = (await readInputText(id)).topic?.trim() || undefined;
  return { title, subject, topic };
}

export async function listLessons(): Promise<LessonListItem[]> {
  const root = join(dataRoot(), 'dersler');
  if (!existsSync(root)) return [];
  const ids = await readdir(root);
  const metas = await Promise.all(
    ids.map(async (id) => {
      const meta = await readMeta(id).catch(() => undefined);
      if (!meta) return undefined;
      return { ...meta, ...(await lessonLabel(id)) };
    }),
  );
  return metas
    .filter((m): m is LessonListItem => !!m)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

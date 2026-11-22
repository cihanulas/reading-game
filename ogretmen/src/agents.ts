import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Agent, CursorAgentError, type SDKCustomTool, type SDKImage } from '@cursor/sdk';
import {
  agentWorkDir,
  createLesson,
  lessonDir,
  MIME_BY_EXT,
  readInputText,
  readJson,
  readMeta,
  updateMeta,
  writeJson,
  type UploadedImage,
} from './store.ts';
import { answerSchema, lessonSchema, quizSchema, sourceSchema } from './schemas.ts';
import { validateContract, type ContractName } from './validate.ts';
import type {
  Lesson,
  LessonInput,
  LessonMeta,
  ProgressEvent,
  ProgressStage,
  Quiz,
  SourceDoc,
  TutorAnswer,
} from './types.ts';

export interface TeacherConfig {
  apiKey: string;
  model: string;
}

export type OnProgress = (event: ProgressEvent) => void;

const PROMPTS_DIR = join(import.meta.dirname, '..', 'prompts');

/** CURSOR_API_KEY ve OGRETMEN_MODEL; ogretmen/.env.local varsa önce o okunur. */
export function loadConfig(): TeacherConfig {
  const envFile = join(import.meta.dirname, '..', '.env.local');
  if (existsSync(envFile)) process.loadEnvFile(envFile);
  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'CURSOR_API_KEY tanımlı değil. Anahtarı https://cursor.com/dashboard/integrations adresinden alıp ' +
        'ogretmen/.env.local dosyasına CURSOR_API_KEY=... olarak yazın.',
    );
  }
  return { apiKey, model: process.env.OGRETMEN_MODEL?.trim() || 'grok-4.7' };
}

async function prompt(name: string): Promise<string> {
  const [shared, role] = await Promise.all([
    readFile(join(PROMPTS_DIR, 'ortak-ilkeler.md'), 'utf8'),
    readFile(join(PROMPTS_DIR, `${name}.md`), 'utf8'),
  ]);
  return `${shared}\n\n${role}`;
}

async function lessonImages(meta: LessonMeta): Promise<SDKImage[]> {
  const dir = lessonDir(meta.id);
  return Promise.all(
    meta.input.images.map(async (file) => ({
      data: (await readFile(join(dir, file))).toString('base64'),
      mimeType: MIME_BY_EXT[file.split('.').pop() ?? ''] ?? 'image/jpeg',
    })),
  );
}

interface StructuredRun {
  config: TeacherConfig;
  lessonId: string;
  stage: ProgressStage;
  instructions: string;
  task: string;
  images?: SDKImage[];
  toolName: string;
  toolDescription: string;
  contract: ContractName;
  imageCount: number;
  onProgress?: OnProgress;
}

const SCHEMAS: Record<ContractName, Record<string, unknown>> = {
  source: sourceSchema,
  lesson: lessonSchema,
  quiz: quizSchema,
  answer: answerSchema,
};

/**
 * Ajanı yalnızca tek bir kayıt aracıyla çalıştırır (dosya/kabuk erişimi yok).
 * Araç gelen veriyi doğrular; hata varsa ajana geri döndürür, ajan düzeltip yeniden dener.
 */
async function runStructured<T>(opts: StructuredRun): Promise<{ data: T; agentId: string }> {
  const emit = (kind: ProgressEvent['kind'], message: string) =>
    opts.onProgress?.({ lessonId: opts.lessonId, stage: opts.stage, kind, message });

  let captured: T | undefined;
  const tool: SDKCustomTool = {
    description: opts.toolDescription,
    inputSchema: SCHEMAS[opts.contract] as SDKCustomTool['inputSchema'],
    async execute(args) {
      const errors = validateContract(opts.contract, args, { imageCount: opts.imageCount });
      if (errors.length) {
        emit('retry', `Doğrulama hatası (${errors.length}), ajan düzeltiyor`);
        return {
          isError: true,
          content: [{ type: 'text', text: `Kaydedilmedi. Düzelt ve yeniden çağır:\n- ${errors.slice(0, 30).join('\n- ')}` }],
        };
      }
      captured = args as T;
      emit('saved', 'Sonuç doğrulandı');
      return 'Kaydedildi. Kısa bir "tamam" yazıp bitir.';
    },
  };

  const cwd = await agentWorkDir();
  emit('started', 'Ajan başlatılıyor');
  await using agent = await Agent.create({
    apiKey: opts.config.apiKey,
    model: { id: opts.config.model },
    tools: ['mcp'],
    local: { cwd, customTools: { [opts.toolName]: tool } },
  });

  let message = `${opts.instructions}\n\n---\n\n${opts.task}`;
  for (let attempt = 0; attempt < 3 && captured === undefined; attempt++) {
    const run = await agent.send(
      attempt === 0 && opts.images?.length ? { text: message, images: opts.images } : message,
    );
    for await (const event of run.stream()) {
      if (event.type === 'tool_call' && event.status === 'running') emit('working', `Araç: ${event.name}`);
    }
    const result = await run.wait();
    if (result.status !== 'finished') {
      throw new Error(`Ajan çalışması ${result.status}: ${result.error?.message ?? 'bilinmeyen hata'} (run ${result.id})`);
    }
    message = `Sonucu henüz kaydetmedin. Lütfen ${opts.toolName} aracını şemaya uygun verilerle çağır.`;
  }
  if (captured === undefined) throw new Error(`Ajan sonucu ${opts.toolName} ile kaydetmedi.`);
  emit('done', 'Tamamlandı');
  return { data: captured, agentId: agent.agentId };
}

async function fail(id: string, err: unknown, onProgress: OnProgress | undefined, stage: ProgressStage) {
  const msg =
    err instanceof CursorAgentError
      ? `Cursor bağlantı hatası: ${err.message}${err.isRetryable ? ' (tekrar denenebilir)' : ''}`
      : err instanceof Error
        ? err.message
        : String(err);
  await updateMeta(id, { status: 'error', error: msg }).catch(() => undefined);
  onProgress?.({ lessonId: id, stage, kind: 'error', message: msg });
  return new Error(msg);
}

function languageOrder(lang: string): string {
  if (lang === 'de') {
    return 'Açıklama dili Almanca. lang alanı "de" olmak zorunda. Konuşma, tahta, sorular ve ipuçları yalnızca Almanca. Öğretmenin adı Käpt’n Wort. Sayfa Türkçeyse döküm Türkçe kalır, anlatım Almanca olur.';
  }
  return 'Açıklama dili Türkçe. lang alanı "tr" olmak zorunda. Konuşma, tahta, sorular ve ipuçları yalnızca Türkçe. Öğretmenin adı Kaptan Kelime. Sayfa Almancaysa döküm Almanca kalır, anlatım Türkçe olur.';
}

/** Ajan 1: girdiyi source.json'a dönüştürür. */
export async function understand(id: string, config: TeacherConfig, onProgress?: OnProgress): Promise<SourceDoc> {
  const meta = await updateMeta(id, { status: 'understanding', error: undefined });
  try {
    const images = await lessonImages(meta);
    const { text, topic } = await readInputText(id);
    const task = [
      `Girdi türü: ${meta.input.kind}.`,
      languageOrder(meta.input.lang),
      meta.input.grade ? `Çocuğun sınıfı: ${meta.input.grade}.` : 'Çocuğun sınıfı bilinmiyor; tahmin et.',
      meta.input.request ? `Çocuğun isteği: """${meta.input.request}"""` : '',
      images.length ? `${images.length} resim ekte (sıra 0'dan başlar).` : '',
      text ? `Metin:\n"""\n${text}\n"""` : '',
      topic ? `Konu: """${topic}"""` : '',
      'Sonucu kaynak_kaydet aracıyla kaydet.',
    ]
      .filter(Boolean)
      .join('\n');

    const { data, agentId } = await runStructured<SourceDoc>({
      config,
      lessonId: id,
      stage: 'understand',
      instructions: await prompt('sayfa-cozumleyici'),
      task,
      images,
      toolName: 'kaynak_kaydet',
      toolDescription: 'Çözümlenen sayfayı/konuyu kaynak belge (source.json) olarak kaydeder.',
      contract: 'source',
      imageCount: images.length,
      onProgress,
    });
    await writeJson(join(lessonDir(id), 'source.json'), data);
    await updateMeta(id, {
      status: data.safety.ok ? 'teaching' : 'rejected',
      ...(data.safety.ok ? {} : { error: data.safety.note ?? 'İçerik uygun bulunmadı.' }),
      agentIds: { ...meta.agentIds, understand: agentId },
    });
    return data;
  } catch (err) {
    throw await fail(id, err, onProgress, 'understand');
  }
}

/** Ajan 2: source.json'dan animasyonlu ders senaryosu (lesson.json) üretir. */
export async function teach(id: string, config: TeacherConfig, onProgress?: OnProgress): Promise<Lesson> {
  const meta = await updateMeta(id, { status: 'teaching', error: undefined });
  try {
    const source = await readJson<SourceDoc>(join(lessonDir(id), 'source.json'));
    const images = await lessonImages(meta);
    const task = [
      languageOrder(meta.input.lang),
      meta.input.grade ? `Çocuğun sınıfı: ${meta.input.grade}.` : '',
      meta.input.request ? `Çocuğun isteği: """${meta.input.request}"""` : '',
      `Girdi resim sayısı: ${images.length} (image komutu yalnızca bunlar için).`,
      `source.json:\n\`\`\`json\n${JSON.stringify(source, null, 2)}\n\`\`\``,
      'Dersi ders_kaydet aracıyla kaydet.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const { data, agentId } = await runStructured<Lesson>({
      config,
      lessonId: id,
      stage: 'teach',
      instructions: await prompt('ders-anlatici'),
      task,
      images,
      toolName: 'ders_kaydet',
      toolDescription: 'Animasyonlu ders senaryosunu (lesson.json) kaydeder.',
      contract: 'lesson',
      imageCount: images.length,
      onProgress,
    });
    await writeJson(join(lessonDir(id), 'lesson.json'), data);
    await updateMeta(id, { status: 'ready', agentIds: { ...meta.agentIds, teach: agentId } });
    return data;
  } catch (err) {
    throw await fail(id, err, onProgress, 'teach');
  }
}

/** `createLesson` ile açılmış kayıt için hattı çalıştırır: anlar, uygunsa ders hazırlar. */
export async function runLesson(id: string, config: TeacherConfig, onProgress?: OnProgress): Promise<LessonMeta> {
  const source = await understand(id, config, onProgress);
  if (source.safety.ok) await teach(id, config, onProgress);
  return readMeta(id);
}

/** Kaydı açıp hattı sonuna kadar çalıştırır (CLI ve basit kullanım için). */
export async function createLessonFromInput(
  input: Omit<LessonInput, 'images'> & { images?: UploadedImage[] },
  config: TeacherConfig,
  onProgress?: OnProgress,
): Promise<LessonMeta> {
  const meta = await createLesson(input, config.model);
  return runLesson(meta.id, config, onProgress);
}

async function lessonContext(id: string): Promise<string> {
  const dir = lessonDir(id);
  const source = await readJson<SourceDoc>(join(dir, 'source.json'));
  const lesson = await readJson<Lesson>(join(dir, 'lesson.json'));
  return `source.json:\n\`\`\`json\n${JSON.stringify(source)}\n\`\`\`\n\nlesson.json:\n\`\`\`json\n${JSON.stringify(lesson)}\n\`\`\``;
}

export interface QuizRequest {
  count?: number;
  /** Ör. "sadece doğru-yanlış", "daha zor sorular". */
  request?: string;
}

export async function makeQuiz(
  id: string,
  config: TeacherConfig,
  req: QuizRequest = {},
  onProgress?: OnProgress,
): Promise<{ quiz: Quiz; file: string }> {
  const meta = await readMeta(id);
  if (meta.status !== 'ready') throw new Error('Ders hazır değil; önce ders oluşturulmalı.');
  const count = Math.min(Math.max(req.count ?? 5, 1), 20);
  const { data } = await runStructured<Quiz>({
    config,
    lessonId: id,
    stage: 'quiz',
    instructions: await prompt('sinav-hazirlayici'),
    task: [
      languageOrder(meta.input.lang),
      `Soru sayısı: ${count}.`,
      req.request ? `İstek: """${req.request}"""` : '',
      await lessonContext(id),
      'Sınavı sinav_kaydet aracıyla kaydet.',
    ]
      .filter(Boolean)
      .join('\n\n'),
    toolName: 'sinav_kaydet',
    toolDescription: 'Ders için hazırlanan sınavı (quiz.json) kaydeder.',
    contract: 'quiz',
    imageCount: 0,
    onProgress,
  });
  const n = meta.quizzes + 1;
  const file = `quiz-${n}.json`;
  await writeJson(join(lessonDir(id), file), data);
  await updateMeta(id, { quizzes: n });
  return { quiz: data, file };
}

export interface TutorQuestion {
  question: string;
  image?: UploadedImage;
}

const HISTORY_LIMIT = 5;

/** Çocuğun takip sorusuna mini ders şeklinde cevap verir. */
export async function askTutor(
  id: string,
  config: TeacherConfig,
  q: TutorQuestion,
  onProgress?: OnProgress,
): Promise<{ answer: TutorAnswer; file: string }> {
  const meta = await readMeta(id);
  if (meta.status !== 'ready') throw new Error('Ders hazır değil; önce ders oluşturulmalı.');
  if (!q.question.trim()) throw new Error('Soru boş olamaz.');
  const dir = lessonDir(id);

  const history: string[] = [];
  for (let n = Math.max(1, meta.answers - HISTORY_LIMIT + 1); n <= meta.answers; n++) {
    const qPath = join(dir, 'answers', `${n}.question.txt`);
    const aPath = join(dir, 'answers', `${n}.json`);
    if (!existsSync(qPath) || !existsSync(aPath)) continue;
    const prev = await readJson<TutorAnswer>(aPath);
    history.push(`Çocuk: ${await readFile(qPath, 'utf8')}\nÖğretmen: ${prev.steps.map((s) => s.say).join(' ')}`);
  }

  const images: SDKImage[] = q.image ? [{ data: q.image.data.toString('base64'), mimeType: q.image.mimeType }] : [];
  const { data } = await runStructured<TutorAnswer>({
    config,
    lessonId: id,
    stage: 'answer',
    instructions: await prompt('soru-cevap'),
    task: [
      languageOrder(meta.input.lang),
      await lessonContext(id),
      history.length ? `Önceki soru-cevaplar:\n${history.join('\n\n')}` : '',
      images.length ? 'Çocuk soruyla birlikte bir resim gönderdi (ekte). image komutu bu resim için 0 sırasını kullanır.' : '',
      `Çocuğun sorusu: """${q.question.trim()}"""`,
      'Cevabı cevap_kaydet aracıyla kaydet.',
    ]
      .filter(Boolean)
      .join('\n\n'),
    images,
    toolName: 'cevap_kaydet',
    toolDescription: 'Çocuğun sorusuna verilen mini ders cevabını kaydeder.',
    contract: 'answer',
    imageCount: images.length,
    onProgress,
  });

  const n = meta.answers + 1;
  await mkdir(join(dir, 'answers'), { recursive: true });
  await writeFile(join(dir, 'answers', `${n}.question.txt`), q.question.trim(), 'utf8');
  if (q.image) {
    const ext = Object.entries(MIME_BY_EXT).find(([, m]) => m === q.image!.mimeType)?.[0] ?? 'jpg';
    await writeFile(join(dir, 'answers', `${n}.${ext}`), q.image.data);
  }
  const file = `answers/${n}.json`;
  await writeJson(join(dir, file), data);
  await updateMeta(id, { answers: n });
  return { answer: data, file };
}

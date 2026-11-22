// Sunucu olmadan hattı denemek için komut satırı.
//   npm run ogretmen -- ders --resim sayfa.jpg [--resim 2.jpg] [--sinif 4] [--istek "..."] [--dil tr]
//   npm run ogretmen -- ders --konu "Su döngüsü" --sinif 3
//   npm run ogretmen -- ders --metin "..."
//   npm run ogretmen -- sinav <id> [--sayi 5] [--istek "..."]
//   npm run ogretmen -- sor <id> "Kesirler neden alt alta yazılır?" [--resim soru.jpg]
//   npm run ogretmen -- liste
//   npm run ogretmen -- modeller
//   npm run ogretmen -- dogrula <dosya.json> <source|lesson|quiz|answer>
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { Cursor } from '@cursor/sdk';
import { askTutor, createLessonFromInput, loadConfig, makeQuiz, type OnProgress } from './agents.ts';
import { lessonDir, listLessons, MIME_BY_EXT, type UploadedImage } from './store.ts';
import { validateContract, type ContractName } from './validate.ts';
import type { LessonLang } from './types.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    resim: { type: 'string', multiple: true },
    metin: { type: 'string' },
    konu: { type: 'string' },
    sinif: { type: 'string' },
    istek: { type: 'string' },
    dil: { type: 'string' },
    sayi: { type: 'string' },
  },
});

const progress: OnProgress = (e) => console.log(`[${e.stage}] ${e.kind}: ${e.message}`);

async function loadImage(path: string): Promise<UploadedImage> {
  const mimeType = MIME_BY_EXT[extname(path).slice(1).toLowerCase()];
  if (!mimeType) throw new Error(`Desteklenmeyen resim: ${path} (jpg, png, webp)`);
  return { data: await readFile(path), mimeType };
}

async function main(command: string | undefined, rest: string[]): Promise<number> {
  switch (command) {
    case 'ders': {
      const meta = await createLessonFromInput(
        {
          images: await Promise.all((values.resim ?? []).map(loadImage)),
          text: values.metin,
          topic: values.konu,
          grade: values.sinif ? Number(values.sinif) : undefined,
          request: values.istek,
          lang: values.dil as LessonLang | undefined,
        },
        loadConfig(),
        progress,
      );
      console.log(`\nDers: ${meta.id} (${meta.status})${meta.error ? ` – ${meta.error}` : ''}`);
      console.log(`Klasör: ${lessonDir(meta.id)}`);
      return 0;
    }
    case 'sinav': {
      const req = { count: values.sayi ? Number(values.sayi) : undefined, request: values.istek };
      const { file } = await makeQuiz(rest[0], loadConfig(), req, progress);
      console.log(`\nSınav: ${join(lessonDir(rest[0]), file)}`);
      return 0;
    }
    case 'sor': {
      const image = values.resim?.[0] ? await loadImage(values.resim[0]) : undefined;
      const { file } = await askTutor(rest[0], loadConfig(), { question: rest.slice(1).join(' '), image }, progress);
      console.log(`\nCevap: ${join(lessonDir(rest[0]), file)}`);
      return 0;
    }
    case 'liste': {
      for (const m of await listLessons()) {
        console.log(`${m.id}  ${m.status.padEnd(13)} ${m.input.kind}  sınav:${m.quizzes} soru:${m.answers}`);
      }
      return 0;
    }
    case 'modeller': {
      const models = await Cursor.models.list({ apiKey: loadConfig().apiKey });
      for (const m of models) console.log(m.id);
      return 0;
    }
    case 'dogrula': {
      const data = JSON.parse(await readFile(rest[0], 'utf8'));
      const errors = validateContract(rest[1] as ContractName, data, { imageCount: 4 });
      console.log(errors.length ? errors.join('\n') : 'Geçerli.');
      return errors.length ? 1 : 0;
    }
    default:
      console.log('Komutlar: ders, sinav, sor, liste, modeller, dogrula. Ayrıntı: ogretmen/README.md');
      return 1;
  }
}

try {
  process.exitCode = await main(positionals[0], positionals.slice(1));
} catch (err) {
  console.error(`Hata: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
}

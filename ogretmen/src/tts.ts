import { createHash } from 'node:crypto';
import { EdgeTTS } from 'node-edge-tts';

/** Dinletilen örneklerden seçilen sesler: Almanca Florian, Türkçe Emel. Perde kaydırılmaz. */
const VOICES: Record<string, { voice: string; lang: string }> = {
  tr: { voice: 'tr-TR-EmelNeural', lang: 'tr-TR' },
  de: { voice: 'de-DE-FlorianMultilingualNeural', lang: 'de-DE' },
  en: { voice: 'en-US-JennyNeural', lang: 'en-US' },
};

/** Kaydırıcı 0.8–1.2. 1, dinlenen doğal hızdır. */
export function edgeRate(rate: number): string {
  const safe = Math.min(1.2, Math.max(0.8, rate));
  const percent = Math.round((safe - 1) * 100);
  if (percent === 0) return 'default';
  return `${percent > 0 ? '+' : ''}${percent}%`;
}

const cache = new Map<string, Buffer>();
const inflight = new Map<string, Promise<Buffer>>();

export async function synthesize(text: string, lang: string, rate: number): Promise<Buffer> {
  const voice = VOICES[lang] ?? VOICES.tr;
  const key = createHash('sha1').update(`${voice.voice}|${edgeRate(rate)}|${text}`).digest('hex');
  const cached = cache.get(key);
  if (cached) return cached;
  const pending = inflight.get(key);
  if (pending) return pending;

  const job = (async () => {
    const tts = new EdgeTTS({
      voice: voice.voice,
      lang: voice.lang,
      outputFormat: 'audio-24khz-96kbitrate-mono-mp3',
      rate: edgeRate(rate),
      pitch: 'default',
      timeout: 30000,
    });
    const chunks: Buffer[] = [];
    for await (const chunk of tts.streamAudio(text)) {
      if (Buffer.isBuffer(chunk)) chunks.push(chunk);
    }
    const audio = Buffer.concat(chunks);
    if (audio.length < 200) throw new Error('Ses üretilemedi.');
    cache.set(key, audio);
    if (cache.size > 300) cache.delete(cache.keys().next().value ?? key);
    return audio;
  })();

  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}

import type { Lesson, LessonListItem, LessonMeta, ProgressEvent, Quiz, TutorAnswer } from '../../ogretmen/src/types';

async function parse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || 'İstek başarısız.');
  return body;
}

export function listLessons(): Promise<LessonListItem[]> {
  return fetch('/api/ogretmen/dersler').then((response) => parse<LessonListItem[]>(response));
}

export function getLessonMeta(id: string): Promise<LessonMeta> {
  return fetch(`/api/ogretmen/dersler/${id}`).then((response) => parse<LessonMeta>(response));
}

export function getLesson(id: string): Promise<Lesson> {
  return fetch(`/api/ogretmen/dersler/${id}/lesson`).then((response) => parse<Lesson>(response));
}

export function imageUrl(id: string, file: string): string {
  return `/api/ogretmen/dersler/${id}/girdi/${file.split('/').pop()}`;
}

export function createLesson(form: FormData): Promise<{ id: string }> {
  return fetch('/api/ogretmen/dersler', { method: 'POST', body: form }).then((response) => parse<{ id: string }>(response));
}

export function explainIn(id: string, lang: 'tr' | 'de'): Promise<{ id: string }> {
  return fetch(`/api/ogretmen/dersler/${id}/dil`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dil: lang }),
  }).then((response) => parse<{ id: string }>(response));
}

export function retryLesson(id: string): Promise<{ id: string }> {
  return fetch(`/api/ogretmen/dersler/${id}/yeniden`, { method: 'POST' }).then((response) => parse<{ id: string }>(response));
}

export function listen(id: string, onEvent: (event: ProgressEvent) => void): () => void {
  const source = new EventSource(`/api/ogretmen/dersler/${id}/olaylar`);
  source.onmessage = (message) => {
    onEvent(JSON.parse(message.data) as ProgressEvent);
  };
  return () => source.close();
}

export function makeQuiz(id: string, count: number): Promise<{ quiz: Quiz }> {
  return fetch(`/api/ogretmen/dersler/${id}/sinav`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  }).then((response) => parse<{ quiz: Quiz }>(response));
}

export function ask(id: string, form: FormData): Promise<{ answer: TutorAnswer; hasImage: boolean; file: string }> {
  return fetch(`/api/ogretmen/dersler/${id}/sorular`, { method: 'POST', body: form }).then((response) =>
    parse<{ answer: TutorAnswer; hasImage: boolean; file: string }>(response),
  );
}

export function answerImageUrl(id: string, file: string): string {
  const n = /(\d+)\.json$/.exec(file)?.[1] ?? '1';
  return `/api/ogretmen/dersler/${id}/cevaplar/${n}/resim`;
}

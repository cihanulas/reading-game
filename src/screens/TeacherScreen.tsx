import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GraduationCap } from 'lucide-react';
import type { Lesson, LessonLang, LessonListItem, LessonMeta, Quiz, TutorAnswer } from '../../ogretmen/src/types';
import { useProfile } from '../db/useProfile';
import { useApp } from '../store/app';
import { ask, answerImageUrl, createLesson, explainIn, getLesson, getLessonMeta, imageUrl, listLessons, listen, makeQuiz, retryLesson } from '../teacher/api';
import { shrinkImage } from '../teacher/imageFile';
import { LessonPlayer } from '../teacher/LessonPlayer';
import { QuizPanel } from '../teacher/QuizPanel';

type View =
  | { name: 'list' }
  | { name: 'wait'; id: string }
  | { name: 'play'; id: string; lesson: Lesson; images: string[] }
  | { name: 'quiz'; id: string; lang: LessonLang; quiz?: Quiz }
  | { name: 'ask'; id: string; lang: LessonLang; answer?: TutorAnswer; images: string[] };

export function TeacherScreen() {
  const { t } = useTranslation();
  const { profileId, go } = useApp();
  const profile = useProfile(profileId);
  const [lessons, setLessons] = useState<LessonListItem[] | null>(null);
  const [offline, setOffline] = useState(false);
  const [view, setView] = useState<View>({ name: 'list' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<LessonMeta | null>(null);
  const [progress, setProgress] = useState('');

  const refresh = () => {
    listLessons().then((items) => {
      setLessons(items);
      setOffline(false);
    }).catch(() => setOffline(true));
  };

  useEffect(refresh, []);

  useEffect(() => {
    if (view.name !== 'wait') return;
    const id = view.id;
    let opened = false;
    const stop = listen(id, (event) => setProgress(event.message));
    const timer = window.setInterval(() => {
      getLessonMeta(id).then((next) => {
        setMeta(next);
        if (next.status === 'ready' && !opened) {
          opened = true;
          window.clearInterval(timer);
          stop();
          void openLesson(id).catch((err: unknown) => setError(err instanceof Error ? err.message : t('teacher.offline')));
        }
        if (next.status === 'error' || next.status === 'rejected') window.clearInterval(timer);
      }).catch(() => undefined);
    }, 2000);
    return () => {
      opened = true;
      window.clearInterval(timer);
      stop();
    };
  }, [view, t]);

  async function openLesson(id: string) {
    const [lesson, info] = await Promise.all([getLesson(id), getLessonMeta(id)]);
    setView({ name: 'play', id, lesson, images: info.input.images.map((file) => imageUrl(id, file)) });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const data = new FormData(event.currentTarget);
    const files = (data.getAll('resim') as File[]).filter((file) => file.size > 0).slice(0, 4);
    const text = String(data.get('metin') ?? '').trim();
    const topic = String(data.get('konu') ?? '').trim();
    if (!files.length && !text && !topic) {
      setError(t('teacher.needInput'));
      return;
    }
    setBusy(true);
    setError(null);
    const form = new FormData();
    for (const file of files) form.append('resim', await shrinkImage(file));
    form.set('metin', text);
    form.set('konu', topic);
    form.set('sinif', String(data.get('sinif') ?? ''));
    form.set('dil', String(data.get('dil') ?? 'tr'));
    form.set('istek', String(data.get('istek') ?? ''));
    try {
      const { id } = await createLesson(form);
      setMeta(null);
      setProgress('');
      setView({ name: 'wait', id });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('teacher.offline'));
    } finally {
      setBusy(false);
    }
  }

  async function switchLanguage(id: string, lang: 'tr' | 'de') {
    setBusy(true);
    setError(null);
    try {
      const created = await explainIn(id, lang);
      setMeta(null);
      setProgress('');
      setView({ name: 'wait', id: created.id });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('teacher.offline'));
    } finally {
      setBusy(false);
    }
  }

  async function startQuiz(id: string, lang: LessonLang, count: number) {
    setBusy(true);
    setError(null);
    setView({ name: 'quiz', id, lang });
    try {
      const { quiz } = await makeQuiz(id, count);
      setView({ name: 'quiz', id, lang, quiz });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('teacher.offline'));
      setView({ name: 'list' });
    } finally {
      setBusy(false);
    }
  }

  async function sendQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (view.name !== 'ask') return;
    const data = new FormData(event.currentTarget);
    const question = String(data.get('soru') ?? '').trim();
    if (!question) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.set('soru', question);
    const file = data.get('resim');
    if (file instanceof File && file.size > 0) form.append('resim', await shrinkImage(file));
    try {
      const result = await ask(view.id, form);
      const images = result.hasImage ? [answerImageUrl(view.id, result.file)] : [];
      setView({ name: 'ask', id: view.id, lang: view.lang, answer: result.answer, images });
    } catch (err) {
      setError(err instanceof Error ? err.message : t('teacher.offline'));
    } finally {
      setBusy(false);
    }
  }

  if (!profile) return null;

  return (
    <section className="screen teacher-screen">
      <header className="teacher-head">
        <GraduationCap aria-hidden="true" />
        <h2>{t('teacher.title')}</h2>
        <button type="button" className="btn ghost" onClick={() => (view.name === 'list' ? go('home') : setView({ name: 'list' }))}>{t('teacher.back')}</button>
      </header>
      {offline && <p className="teacher-note">{t('teacher.offline')}</p>}
      {error && <p className="teacher-note">{error}</p>}

      {view.name === 'list' && (
        <>
          <form className="card teacher-form" onSubmit={onSubmit}>
            <h3>{t('teacher.new')}</h3>
            <label>{t('teacher.photo')}
              <input name="resim" type="file" accept="image/*" capture="environment" multiple />
              <small>{t('teacher.photoHint')}</small>
            </label>
            <label>{t('teacher.topic')}
              <input name="konu" type="text" maxLength={200} />
            </label>
            <label>{t('teacher.text')}
              <textarea name="metin" rows={3} maxLength={8000} />
            </label>
            <label>{t('teacher.explainLang')}
              <select name="dil" defaultValue={profile.lang === 'de' ? 'de' : 'tr'}>
                <option value="tr">{t('teacher.lang_tr')}</option>
                <option value="de">{t('teacher.lang_de')}</option>
              </select>
            </label>
            <label>{t('teacher.grade')}
              <input name="sinif" type="number" min={1} max={12} defaultValue={profile.ageGroup === '14-18' ? 8 : 4} />
            </label>
            <label>{t('teacher.request')}
              <input name="istek" type="text" placeholder={t('teacher.requestHint')} maxLength={300} />
            </label>
            <button type="submit" className="btn primary" disabled={busy}>{t('teacher.start')}</button>
          </form>
          <h3>{t('teacher.list')}</h3>
          {lessons?.length === 0 && <p>{t('teacher.empty')}</p>}
          <ul className="teacher-list">
            {(lessons ?? []).map((lesson) => {
              const category = lesson.subject || t(`teacher.lang_${lesson.input.lang === 'de' ? 'de' : 'tr'}`);
              const heading = lesson.title || lesson.topic || t(`teacher.status_${lesson.status}`);
              return (
              <li key={lesson.id} className="card teacher-lesson">
                <h4 className="teacher-lesson-title">{heading}</h4>
                <p className="teacher-lesson-topic">
                  <span className="teacher-cat">{category}</span>
                  {lesson.title && lesson.topic ? <span>{lesson.topic}</span> : null}
                </p>
                <p className="teacher-lesson-meta">{new Date(lesson.createdAt).toLocaleString(profile.lang)} · {t(`teacher.status_${lesson.status}`)}{lesson.error ? ` · ${lesson.error}` : ''}</p>
                <div className="row wrap">
                  {lesson.status === 'ready' && <button type="button" className="btn primary" onClick={() => void openLesson(lesson.id)}>{t('teacher.play')}</button>}
                  {lesson.status === 'ready' && <button type="button" className="btn" onClick={() => void startQuiz(lesson.id, lesson.input.lang, 5)}>{t('teacher.quiz')}</button>}
                  {lesson.status === 'ready' && <button type="button" className="btn" onClick={() => setView({ name: 'ask', id: lesson.id, lang: lesson.input.lang, images: [] })}>{t('teacher.ask')}</button>}
                  {lesson.status === 'ready' && (
                    <button type="button" className="btn" onClick={() => void switchLanguage(lesson.id, lesson.input.lang === 'de' ? 'tr' : 'de')}>
                      {t(lesson.input.lang === 'de' ? 'teacher.explainTr' : 'teacher.explainDe')}
                    </button>
                  )}
                  {(lesson.status === 'error' || lesson.status === 'rejected') && (
                    <button type="button" className="btn" onClick={() => { setView({ name: 'wait', id: lesson.id }); void retryLesson(lesson.id); }}>{t('teacher.retry')}</button>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        </>
      )}

      {view.name === 'wait' && (
        <section className="card">
          <h3>{t('teacher.working')}</h3>
          <p>{meta ? t(`teacher.status_${meta.status}`) : progress}</p>
          {meta?.error && <p className="teacher-note">{meta.error}</p>}
        </section>
      )}

      {view.name === 'play' && (
        <LessonPlayer
          title={view.lesson.title}
          lang={view.lesson.lang}
          scenes={view.lesson.scenes}
          images={view.images}
          recap={view.lesson.recap}
          glossary={view.lesson.glossary}
          onExit={() => setView({ name: 'list' })}
        />
      )}

      {view.name === 'quiz' && !view.quiz && <section className="card"><p>{t('teacher.preparingQuiz')}</p></section>}
      {view.name === 'quiz' && view.quiz && <QuizPanel quiz={view.quiz} lang={view.lang} onExit={() => setView({ name: 'list' })} />}

      {view.name === 'ask' && !view.answer && (
        <form className="card teacher-form" onSubmit={sendQuestion}>
          <label>{t('teacher.ask')}
            <textarea name="soru" rows={3} placeholder={t('teacher.askPlaceholder')} required />
          </label>
          <label>{t('teacher.photo')}
            <input name="resim" type="file" accept="image/*" capture="environment" />
          </label>
          <button type="submit" className="btn primary" disabled={busy}>{busy ? t('teacher.preparingAnswer') : t('teacher.askSend')}</button>
        </form>
      )}
      {view.name === 'ask' && view.answer && (
        <>
          {!view.answer.onTopic && <p className="teacher-note">{t('teacher.offTopic')}</p>}
          <LessonPlayer
            title={t('teacher.ask')}
            lang={view.lang}
            scenes={[{ id: 'cevap', title: t('teacher.ask'), steps: view.answer.steps }]}
            images={view.images}
            onExit={() => setView({ name: 'ask', id: view.id, lang: view.lang, images: [] })}
          />
          {view.answer.followUp && <p className="card">{t('teacher.follow')}: {view.answer.followUp}</p>}
        </>
      )}
    </section>
  );
}

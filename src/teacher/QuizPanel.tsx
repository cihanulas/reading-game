import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Quiz, QuizQuestion } from '../../ogretmen/src/types';
import { answersMatch } from './answers';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function isRight(question: QuizQuestion, lang: string, choice: number | null, text: string, order: string[]): boolean {
  switch (question.type) {
    case 'multiple_choice':
      return choice === question.answerIndex;
    case 'true_false':
      return (choice === 0) === question.answerBool;
    case 'fill_blank':
    case 'short_answer':
      return answersMatch(lang, text, question.acceptedAnswers ?? []);
    case 'ordering':
      return order.join('|') === (question.orderedItems ?? []).join('|');
    default:
      return false;
  }
}

export function QuizPanel({ quiz, lang, onExit }: { quiz: Quiz; lang: string; onExit: () => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [ok, setOk] = useState(false);
  const [score, setScore] = useState(0);
  const question = quiz.questions[index];
  const pool = useMemo(() => (question?.type === 'ordering' ? shuffle(question.orderedItems ?? []) : []), [question]);

  if (!question) {
    return (
      <section className="card">
        <h2>{t('teacher.score', { ok: score, total: quiz.questions.length })}</h2>
        <button type="button" className="btn primary" onClick={onExit}>{t('teacher.back')}</button>
      </section>
    );
  }

  const submit = () => {
    const right = isRight(question, lang, choice, text, picked);
    setOk(right);
    setRevealed(true);
    if (right) setScore((value) => value + 1);
  };

  const next = () => {
    setIndex(index + 1);
    setChoice(null);
    setText('');
    setPicked([]);
    setRevealed(false);
    setOk(false);
  };

  return (
    <section className="card teacher-quiz">
      <p className="eyebrow">{quiz.title} · {index + 1}/{quiz.questions.length}</p>
      <h2>{question.prompt}</h2>
      {question.type === 'multiple_choice' && (
        <div className="row wrap">
          {(question.choices ?? []).map((option, optionIndex) => (
            <button key={option} type="button" className={`btn ${choice === optionIndex ? 'primary' : ''}`} disabled={revealed} onClick={() => setChoice(optionIndex)}>{option}</button>
          ))}
        </div>
      )}
      {question.type === 'true_false' && (
        <div className="row">
          <button type="button" className={`btn ${choice === 0 ? 'primary' : ''}`} disabled={revealed} onClick={() => setChoice(0)}>{t('question.true')}</button>
          <button type="button" className={`btn ${choice === 1 ? 'primary' : ''}`} disabled={revealed} onClick={() => setChoice(1)}>{t('question.false')}</button>
        </div>
      )}
      {(question.type === 'short_answer' || question.type === 'fill_blank') && (
        <label>{t('teacher.yourAnswer')}
          <input value={text} disabled={revealed} onChange={(event) => setText(event.target.value)} />
        </label>
      )}
      {question.type === 'ordering' && (
        <div>
          <p>{t('teacher.orderHint')}</p>
          <ol>{picked.map((item) => <li key={item}>{item}</li>)}</ol>
          <div className="row wrap">
            {pool.filter((item) => !picked.includes(item)).map((item) => (
              <button key={item} type="button" className="btn" disabled={revealed} onClick={() => setPicked([...picked, item])}>{item}</button>
            ))}
          </div>
        </div>
      )}
      {!revealed && <button type="button" className="btn primary" onClick={submit}>{t('teacher.submit')}</button>}
      {revealed && (
        <>
          <p className="teacher-note">{ok ? question.explanation : question.hint || question.explanation}</p>
          <button type="button" className="btn primary" onClick={next}>{t('teacher.next')}</button>
        </>
      )}
      <button type="button" className="btn ghost" onClick={onExit}>{t('teacher.back')}</button>
    </section>
  );
}

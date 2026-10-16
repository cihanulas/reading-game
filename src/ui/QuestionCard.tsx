import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderingQuestion, Question } from '../content/schema';
import { shuffle } from '../core/shuffle';

interface Props {
  question: Question;
  onDone: (correct: boolean) => void;
}

export function QuestionCard({ question, onDone }: Props) {
  const { t } = useTranslation();
  const [result, setResult] = useState<boolean | null>(null);

  return (
    <div className="card question">
      <h3>{question.prompt}</h3>
      {question.type === 'ordering' ? (
        <OrderingInput question={question} locked={result !== null} onCheck={setResult} />
      ) : (
        <ChoiceInput question={question} locked={result !== null} onCheck={setResult} />
      )}
      {result !== null && (
        <div className={`feedback ${result ? 'ok' : 'no'}`}>
          <span>{result ? t('question.correct') : t('question.wrong')}</span>
          <button type="button" className="btn primary" onClick={() => onDone(result)} autoFocus>
            {t('question.next')}
          </button>
        </div>
      )}
    </div>
  );
}

interface InputProps<Q> {
  question: Q;
  locked: boolean;
  onCheck: (correct: boolean) => void;
}

function ChoiceInput({ question, locked, onCheck }: InputProps<Exclude<Question, OrderingQuestion>>) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<number | null>(null);

  const choices = useMemo(() => {
    if (question.type === 'trueFalse') {
      return [
        { label: t('question.true'), correct: question.answer === true },
        { label: t('question.false'), correct: question.answer === false },
      ];
    }
    return shuffle(question.options.map((label, i) => ({ label, correct: i === question.answer })));
  }, [question, t]);

  const pick = (i: number) => {
    if (locked) return;
    setPicked(i);
    onCheck(choices[i].correct);
  };

  return (
    <div className={`choices ${question.type === 'trueFalse' ? 'two' : ''}`}>
      {choices.map((c, i) => {
        const state = !locked ? '' : c.correct ? 'right' : i === picked ? 'wrong' : 'dim';
        return (
          <button key={i} type="button" className={`btn choice ${state}`} onClick={() => pick(i)} disabled={locked}>
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function OrderingInput({ question, locked, onCheck }: InputProps<OrderingQuestion>) {
  const { t } = useTranslation();
  const shuffled = useMemo(() => shuffle(question.items.map((label, i) => ({ label, i }))), [question]);
  const [order, setOrder] = useState<number[]>([]);

  const tap = (i: number) => {
    if (locked || order.includes(i)) return;
    const next = [...order, i];
    setOrder(next);
    if (next.length === question.items.length) onCheck(next.every((v, idx) => v === idx));
  };

  return (
    <>
      <p className="hint">{t('question.orderingHint')}</p>
      <div className="choices">
        {shuffled.map(({ label, i }) => {
          const pos = order.indexOf(i);
          const state = !locked ? (pos >= 0 ? 'chosen' : '') : pos === i ? 'right' : 'wrong';
          return (
            <button key={i} type="button" className={`btn choice ${state}`} onClick={() => tap(i)} disabled={locked}>
              {pos >= 0 && <span className="order-num">{pos + 1}</span>}
              {label}
            </button>
          );
        })}
      </div>
      {!locked && order.length > 0 && (
        <button type="button" className="btn ghost" onClick={() => setOrder([])}>
          {t('question.orderingReset')}
        </button>
      )}
    </>
  );
}

import { Reorder } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderingQuestion, Question } from '../content/schema';
import { shuffle } from '../core/shuffle';
import { playSound } from './sound';

interface Props {
  question: Question;
  onDone: (correct: boolean) => void;
}

export function QuestionCard({ question, onDone }: Props) {
  const { t } = useTranslation();
  const [result, setResult] = useState<boolean | null>(null);
  const advanced = useRef(false);

  const check = (correct: boolean) => {
    setResult(correct);
    playSound(correct ? 'correct' : 'wrong');
  };

  return (
    <div className="card question">
      <h3>{question.prompt}</h3>
      {question.type === 'ordering' ? (
        <OrderingInput question={question} locked={result !== null} onCheck={check} />
      ) : (
        <ChoiceInput question={question} locked={result !== null} onCheck={check} />
      )}
      {result !== null && (
        <div className={`feedback ${result ? 'ok' : 'no'}`}>
          <span>{result ? t('question.correct') : t('question.wrong')}</span>
          <button type="button" className="btn primary" onClick={() => {
            if (advanced.current) return;
            advanced.current = true;
            onDone(result);
          }} autoFocus>
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
  const [items, setItems] = useState(() => {
    const all = question.items.map((label, i) => ({ label, i }));
    let mixed = shuffle(all);
    while (all.length > 1 && mixed.every((it, idx) => it.i === idx)) mixed = shuffle(all);
    return mixed;
  });

  const move = (from: number, by: number) => {
    const to = from + by;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    setItems(next);
    playSound('tap');
  };

  return (
    <>
      <p className="hint">{t('question.orderingHint')}</p>
      <Reorder.Group as="ol" axis="y" values={items} onReorder={setItems} className="order-list">
        {items.map((item, pos) => {
          const state = !locked ? '' : item.i === pos ? 'right' : 'wrong';
          return (
            <Reorder.Item key={item.i} value={item} dragListener={!locked} className={`btn choice order-item ${state}`}>
              <span className="order-num">{pos + 1}</span>
              <span className="order-label">{item.label}</span>
              {!locked && (
                <span className="order-moves">
                  <button type="button" onClick={() => move(pos, -1)} disabled={pos === 0} aria-label={t('question.moveUp')}>
                    ▲
                  </button>
                  <button type="button" onClick={() => move(pos, 1)} disabled={pos === items.length - 1} aria-label={t('question.moveDown')}>
                    ▼
                  </button>
                </span>
              )}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {!locked && (
        <button type="button" className="btn primary" onClick={() => onCheck(items.every((it, idx) => it.i === idx))}>
          {t('question.check')}
        </button>
      )}
    </>
  );
}

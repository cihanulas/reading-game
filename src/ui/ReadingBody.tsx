import { Fragment, useMemo, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import type { GlossaryEntry } from '../content/schema';
import type { LoadedText } from '../content/loader';
import { getLanguagePack, type LangCode } from '../lang';

interface Props {
  text: LoadedText;
  onGlossaryToggle: (open: boolean) => void;
  /** When set, every word is wrapped in a span with this class (used by the pacer). */
  wordClassName?: (index: number) => string | undefined;
  articleRef?: Ref<HTMLElement>;
}

export function ReadingBody({ text, onGlossaryToggle, wordClassName, articleRef }: Props) {
  const { t } = useTranslation();
  const [entry, setEntry] = useState<GlossaryEntry | null>(null);
  const pack = getLanguagePack(text.lang as LangCode);
  const glossary = useMemo(
    () => new Map(text.glossary.map((g) => [pack.normalize(g.word), g])),
    [text, pack],
  );

  const open = (g: GlossaryEntry) => {
    setEntry(g);
    onGlossaryToggle(true);
  };
  const close = () => {
    setEntry(null);
    onGlossaryToggle(false);
  };

  let wordIndex = 0;
  const renderChunk = (chunk: string, key: number) => {
    if (/^\s*$/.test(chunk)) return chunk;
    const g = glossary.get(pack.normalize(chunk));
    const node = g ? (
      <button key={key} type="button" className="gloss-word" onClick={() => open(g)}>
        {chunk}
      </button>
    ) : (
      chunk
    );
    if (!wordClassName) return node;
    const i = wordIndex++;
    return (
      <span key={key} className={wordClassName(i)} data-word="">
        {node}
      </span>
    );
  };

  return (
    <>
      <article className="reading-body" lang={text.lang} ref={articleRef}>
        {text.body.split(/\n{2,}/).map((para, pi) => (
          <p key={pi}>
            {para.split('\n').map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {line.split(/(\s+)/).map(renderChunk)}
              </Fragment>
            ))}
          </p>
        ))}
      </article>
      {entry && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={close}>
          <div className="modal card" onClick={(e) => e.stopPropagation()}>
            <p className="badge">{t('reading.paused')}</p>
            <h3>{entry.word}</h3>
            <p>{entry.meaning}</p>
            <button type="button" className="btn primary" onClick={close} autoFocus>
              {t('glossary.close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

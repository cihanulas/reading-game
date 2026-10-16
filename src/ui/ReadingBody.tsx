import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import type { GlossaryEntry } from '../content/schema';
import type { LoadedText } from '../content/loader';
import { getLanguagePack, type LangCode } from '../lang';
import { PageNavigation } from './PageNavigation';

interface Props {
  text: LoadedText;
  onGlossaryToggle: (open: boolean) => void;
  /** When set, every word is wrapped in a span with this class (used by the pacer). */
  wordClassName?: (index: number) => string | undefined;
  articleRef?: Ref<HTMLElement>;
  activeWord?: number;
}

export function ReadingBody({ text, onGlossaryToggle, wordClassName, articleRef, activeWord }: Props) {
  const { t } = useTranslation();
  const [entry, setEntry] = useState<GlossaryEntry | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLElement>(null);
  const [page, setPage] = useState(0);
  const [layout, setLayout] = useState({ width: 0, total: 1, stride: 0 });
  const pack = getLanguagePack(text.lang as LangCode);
  const glossary = useMemo(
    () => new Map(text.glossary.map((g) => [pack.normalize(g.word), g])),
    [text, pack],
  );

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const article = contentRef.current;
    if (!viewport || !article) return;
    let active = true;
    const measure = () => {
      if (!active) return;
      const desktop = window.matchMedia('(min-width: 900px) and (min-height: 600px)').matches;
      const frame = getComputedStyle(viewport);
      const width = desktop ? viewport.clientWidth - Number.parseFloat(frame.paddingLeft) - Number.parseFloat(frame.paddingRight) : 0;
      const gap = desktop ? Number.parseFloat(getComputedStyle(article).columnGap) || 0 : 0;
      const stride = width + gap;
      const total = desktop && width > 0 ? Math.max(1, Math.ceil((article.scrollWidth + gap) / stride)) : 1;
      setLayout((previous) => previous.width === width && previous.total === total && previous.stride === stride ? previous : { width, total, stride });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    void document.fonts.ready.then(measure);
    return () => { active = false; observer.disconnect(); };
  }, [text, layout.width]);

  useLayoutEffect(() => {
    const current = Math.min(page, layout.total - 1);
    if (current !== page) setPage(current);
    if (viewportRef.current) viewportRef.current.scrollLeft = current * layout.stride;
  }, [page, layout]);

  useEffect(() => {
    if (activeWord === undefined || layout.width === 0) return;
    const article = contentRef.current;
    const word = article?.querySelectorAll<HTMLElement>('[data-word]')[activeWord];
    if (!article || !word) return;
    const offset = word.getBoundingClientRect().left - article.getBoundingClientRect().left;
    setPage(Math.max(0, Math.min(layout.total - 1, Math.floor((offset + 1) / layout.stride))));
  }, [activeWord, layout]);

  useEffect(() => {
    if (layout.width !== 0 || activeWord === undefined) return;
    contentRef.current?.querySelectorAll<HTMLElement>('[data-word]')[activeWord]?.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
  }, [activeWord, layout.width]);

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
      <div className="reading-pages">
      <div className="reading-page-window" ref={viewportRef}>
      <div className="reading-page-track" style={layout.width > 0 ? { width: `${layout.total * layout.stride}px` } : undefined}>
      <article className="reading-body" lang={text.lang} style={layout.width > 0 ? { width: `${layout.width}px` } : undefined} ref={(node) => {
        contentRef.current = node;
        if (typeof articleRef === 'function') articleRef(node);
        else if (articleRef) articleRef.current = node;
      }}>
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
      </div>
      </div>
      <div className="reading-page-controls"><PageNavigation page={page} total={layout.total} onChange={setPage} /></div>
      </div>
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

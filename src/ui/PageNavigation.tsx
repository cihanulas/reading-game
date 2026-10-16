import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  page: number;
  total: number;
  onChange: (page: number) => void;
}

export function PageNavigation({ page, total, onChange }: Props) {
  const { t } = useTranslation();
  if (total <= 1) return null;
  return (
    <nav className="page-navigation" aria-label={t('navigation.pages')}>
      <button type="button" className="btn" onClick={() => onChange(page - 1)} disabled={page === 0} aria-label={t('navigation.previous')} title={t('navigation.previous')}>
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <span aria-live="polite">{t('navigation.page', { current: page + 1, total })}</span>
      <button type="button" className="btn" onClick={() => onChange(page + 1)} disabled={page + 1 >= total} aria-label={t('navigation.next')} title={t('navigation.next')}>
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </nav>
  );
}
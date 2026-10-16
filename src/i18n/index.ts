import i18n, { type PostProcessorModule } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE } from '../lang';

const localeModules = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', { eager: true, import: 'default' });

export const resources: Record<string, Record<string, Record<string, unknown>>> = {};
for (const [path, data] of Object.entries(localeModules)) {
  const [, lang, file] = path.match(/locales\/([^/]+)\/([^/]+)\.json$/)!;
  (resources[lang] ??= {})[file] = data;
}

// Dev-only: ?pseudo wraps every translated string so hard-coded UI text stands out.
const pseudo: PostProcessorModule = {
  type: 'postProcessor',
  name: 'pseudo',
  process: (value: string) => `⟦${value}⟧`,
};
const usePseudo = import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('pseudo');

i18n
  .use(pseudo)
  .use(initReactI18next)
  .init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    postProcess: usePseudo ? ['pseudo'] : false,
  });

export default i18n;

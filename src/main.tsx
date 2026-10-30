import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/nunito/latin-ext-400.css';
import '@fontsource/nunito/latin-ext-700.css';
import '@fontsource/nunito/latin-ext-800.css';
import '@fontsource/nunito/latin-400.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import '@fontsource/fraunces/latin-ext-700.css';
import '@fontsource/fraunces/latin-700.css';
import './i18n';
import { App } from './App';
import { restoreRecoveredProfile } from './db/restoreRecovered';
import './styles.css';

void restoreRecoveredProfile().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

const VOICE_LANG: Record<string, string> = { tr: 'tr-TR', de: 'de-DE', en: 'en-US' };

function finishOnce(onend: () => void) {
  let finished = false;
  return {
    done: () => finished,
    finish: () => {
      if (finished) return;
      finished = true;
      onend();
    },
    stop: () => {
      finished = true;
    },
  };
}

function bestVoice(lang: string): SpeechSynthesisVoice | undefined {
  const prefix = (VOICE_LANG[lang] ?? 'tr-TR').slice(0, 2).toLowerCase();
  const voices = window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().startsWith(prefix));
  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase();
    let value = 0;
    if (name.includes('natural') || name.includes('neural')) value += 5;
    if (name.includes('emel') || name.includes('katja') || name.includes('jenny')) value += 3;
    if (!voice.localService) value += 1;
    return value;
  };
  return voices.sort((a, b) => score(b) - score(a))[0];
}

/** Sunucudaki doğal ses yoksa tarayıcı sesine düşer. Konuşmayı erken kesmez. */
function browserSpeak(text: string, lang: string, rate: number, onend: () => void): () => void {
  const gate = finishOnce(onend);
  if (!window.speechSynthesis) {
    const timer = setTimeout(gate.finish, Math.min(60000, 2500 + text.length * 90));
    return () => {
      gate.stop();
      clearTimeout(timer);
    };
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = VOICE_LANG[lang] ?? 'tr-TR';
  utterance.rate = Math.min(rate, 1);
  const voice = bestVoice(lang);
  if (voice) utterance.voice = voice;
  const backup = setTimeout(gate.finish, Math.min(60000, 4000 + text.length * 95));
  utterance.onend = () => {
    clearTimeout(backup);
    gate.finish();
  };
  utterance.onerror = (event) => {
    if (event.error === 'interrupted' || event.error === 'canceled') return;
    clearTimeout(backup);
    gate.finish();
  };
  window.speechSynthesis.speak(utterance);
  return () => {
    gate.stop();
    clearTimeout(backup);
    utterance.onend = null;
    window.speechSynthesis.cancel();
  };
}

/**
 * Metni doğal bir sesle okur. Önce sunucudaki Emel/Florian/Jenny sesini dener.
 * Dönüş fonksiyonu konuşmayı iptal eder.
 */
export function speak(text: string, lang: string, rate: number, onend: () => void): () => void {
  const gate = finishOnce(onend);
  const audio = new Audio();
  const params = new URLSearchParams({ metin: text, dil: lang, hiz: String(rate), v: '2' });
  audio.src = `/api/ogretmen/ses?${params}`;
  let fallback: (() => void) | undefined;
  const giveUp = () => {
    if (gate.done() || fallback) return;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    fallback = browserSpeak(text, lang, rate, gate.finish);
  };
  const startTimer = setTimeout(() => {
    if (audio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) giveUp();
  }, 8000);
  audio.onplaying = () => clearTimeout(startTimer);
  audio.onended = () => {
    clearTimeout(startTimer);
    gate.finish();
  };
  audio.onerror = giveUp;
  void audio.play().catch(giveUp);
  return () => {
    gate.stop();
    clearTimeout(startTimer);
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    fallback?.();
  };
}

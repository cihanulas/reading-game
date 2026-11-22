---
name: ogretmen-uygulamasi
description: Guides building the server and web UI for the Kaptan Kelime lesson teacher on top of the existing ogretmen/ agent pipeline (Cursor SDK) in the Okuma Adası React app. Use when implementing or changing the teacher HTTP API, photo upload, lesson player, board renderer, animated parrot teacher, text-to-speech, quiz or follow-up question screens.
---

# Öğretmen Uygulamasını Geliştirme

Ajanlar, talimatlar ve veri sözleşmeleri hazırdır: `ogretmen/`. Senin işin bunların üzerine
sunucu ve arayüz kurmak. Başlamadan önce `ogretmen/README.md` dosyasını baştan sona oku;
"Sunucu ve arayüz için yapılacaklar" bölümü uç noktaları ve arayüz gereksinimlerini verir.

## Değişmez kurallar

- Ajan çağrılarını yalnızca `ogretmen/src/index.ts` üzerinden yap (`createLesson`, `runLesson`,
  `makeQuiz`, `askTutor`, `listLessons`, `readMeta`). SDK'yı arayüzden veya yeni bir yerden çağırma.
- `CURSOR_API_KEY` yalnızca sunucuda (`ogretmen/.env.local`). Tarayıcıya, loglara, yanıtlara girmez.
- Arayüz tiplerini `ogretmen/src/types.ts`'den içe aktar; kopyalama. `src/` (Vite) tarafında
  `import type` kullan ki Node kodu pakete girmesin.
- Prompt davranışı değişecekse `ogretmen/prompts/*.md` düzenlenir; sunucu koduna talimat yazılmaz.
- Sözleşme (tip/şema) değişirse README "Genişletme" sırası + `npm test`.
- Mevcut okuma oyununun akışını, IndexedDB kayıtlarını ve 5173 sabit portunu bozma.
  Sunucu `127.0.0.1:5174`, Vite `/api` proxy'si; `Baslat.cmd` iki süreci birlikte başlatmalı.

## Önerilen iş sırası

```
- [ ] 1. Sunucu: uç noktalar + SSE ilerleme + tek iş kuyruğu (README tablosu)
- [ ] 2. Vite proxy, PWA navigateFallbackDenylist /api, Baslat.cmd güncellemesi
- [ ] 3. Ders oynatıcı, sahte veriyle: ogretmen/ornekler/lesson.json + sayfa-kesirler.png
- [ ] 4. Tahta bileşenleri (her BoardOp), bilinmeyen op'u atla
- [ ] 5. Kaptan Kelime animasyonu (mood/gesture, konuşurken gaga), reduced-motion
- [ ] 6. Seslendirme: speechSynthesis + onend ile adım ilerletme + yedek zamanlayıcı
- [ ] 7. Fotoğraf yükleme ekranı (capture=environment, 1600 px küçültme) + ilerleme ekranı
- [ ] 8. Kontrol sorusu, sınav ve soru-cevap ekranları
- [ ] 9. i18n anahtarları (tr/de), tablet boyutlarında elle deneme
```

3–6. adımlar API anahtarı olmadan `ogretmen/ornekler/` ile geliştirilebilir.

## Doğrulama

- `npm test`, `npm run build`, `npm run ogretmen:check`
- Gerçek uçtan uca: `npm run ogretmen -- ders --resim ogretmen/ornekler/sayfa-kesirler.png --sinif 3`
  (API anahtarı gerekir), sonra aynı dersi arayüzde oynat.

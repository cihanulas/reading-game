---
name: ders-ogretmeni
description: Turns a child's textbook/notebook page photo, pasted text, or topic name into an animated, spoken lesson (Kaptan Kelime) following the ogretmen/ contracts; can also create quizzes and answer follow-up questions. Use when the user shares a page photo or asks to explain a lesson topic to a child, prepare a quiz from a lesson, or test the teacher agents (ders anlat, konu anlat, sayfayı açıkla, sınav hazırla, öğretmen).
---

# Ders Öğretmeni

Talimatların ve sözleşmelerin tek kaynağı `ogretmen/` klasörüdür. Bu skill onları tekrar etmez;
ilgili dosyayı oku ve uygula.

## Yol seçimi

1. **Resim diskte bir dosya, ya da girdi metin/konu** ve `ogretmen/.env.local` içinde
   `CURSOR_API_KEY` varsa → hattı çalıştır (Cursor SDK ajanları):
   ```bash
   npm run ogretmen -- ders --resim <yol> [--sinif N] [--istek "..."]
   npm run ogretmen -- ders --konu "<konu>" --sinif N
   npm run ogretmen -- sinav <id> --sayi 5
   npm run ogretmen -- sor <id> "<soru>"
   ```
   Bitince `ogretmen-veri/dersler/<id>/lesson.json` dosyasını oku ve kullanıcıya ders akışını
   (sahne başlıkları, kontrol soruları) kısaca özetle.

2. **Resim yalnızca sohbete eklenmiş veya API anahtarı yok** → iki ajanın işini sen yap:
   - `ogretmen/prompts/ortak-ilkeler.md` ve `ogretmen/prompts/sayfa-cozumleyici.md` talimatlarına
     uyarak `source.json` üret (tipler: `ogretmen/src/types.ts` → `SourceDoc`).
   - Ardından `ogretmen/prompts/ders-anlatici.md` ile `lesson.json` üret (`Lesson`).
     Örnek: `ogretmen/ornekler/lesson.json`.
   - Kayıt: `ogretmen-veri/dersler/<YYYY-MM-DD>-<6 küçük hex>/` içine `source.json`, `lesson.json`
     ve `meta.json` (`LessonMeta`, `status: "ready"`, `model: "cursor-ide"`). Resim dosyası
     yoksa `input.images` boş kalır ve `image` tahta komutu kullanılmaz.
   - Doğrula ve hata kalmayana kadar düzelt:
     ```bash
     npm run ogretmen -- dogrula ogretmen-veri/dersler/<id>/source.json source
     npm run ogretmen -- dogrula ogretmen-veri/dersler/<id>/lesson.json lesson
     ```
   Sınav için `sinav-hazirlayici.md` → `quiz-N.json`, soru için `soru-cevap.md` →
   `answers/N.json` (+ `N.question.txt`); `meta.json` sayaçlarını artır.

## Kurallar

- Çocuğa yönelik içerikte `ortak-ilkeler.md` kesindir: ödev cevabını doğrudan verme, kişisel
  bilgileri yazma, uygunsuz içerikte `safety.ok = false`.
- Talimat iyileştirmesi istenirse `ogretmen/prompts/*.md` dosyalarını düzenle; aynı kuralı koda
  veya bu skill'e kopyalama.
- Sözleşme değişikliğinde `ogretmen/README.md` → "Genişletme" sırasını izle ve `npm test` çalıştır.

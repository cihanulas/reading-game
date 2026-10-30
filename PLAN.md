# Okuma Adası – Proje Planı

Çocuklar ve gençler için hazine avı temalı, oyunlaştırılmış okuma hızı geliştirme uygulaması.
Rehber karakter: papağan **Kaptan Kelime**.

## 1. Temel Kararlar

| Konu | Karar |
|---|---|
| Platform | Web (tarayıcı), tablet/telefona kurulabilir PWA, çevrimdışı çalışır |
| Dil / teknoloji | TypeScript, React, Vite |
| Veri | Sadece cihazda (IndexedDB). Sunucu, giriş ve öğretmen paneli yok |
| Yaş grupları | 10–13 ve 14–18, ayrı parkurlar (karışık değil) |
| Tema | Hazine avı / ada haritası |
| Yapay zeka | Uygulama içinde yok |
| Mikrofon | Ses hiçbir zaman kaydedilmez veya saklanmaz. Not: Web Speech tanıma tarayıcının hizmetiyle yapılır (Chrome/Edge'de bulut), bu kullanıcıya okuma öncesi söylenir |

## 2. Okuma Hızı Ölçümü ve Puanlama

- **KDK (kelime/dakika)** = kelime sayısı ÷ okuma süresi (dakika).
- Sözlüğe bakılan süre okuma süresinden düşülür.
- Okuma sonrası 3–5 anlama sorusu.
- **Etkili Okuma Hızı (EOH)** = KDK × anlama oranı (ör. 200 KDK × %80 = 160 EOH).
- **Puan** = EOH × mod çarpanı + hedefi geçme bonusu + seri (art arda gün) bonusu.
- **Uyarlama:**
  - Anlama ≥ %80 ve hedef hıza ulaşıldı → hedef +%5–10
  - Anlama < %60 → hedef −%10
  - Diğer durumlarda hedef aynı kalır
- **Yerleştirme testi:** İlk girişte 2 kısa metin ile başlangıç hedefi belirlenir. Başlangıç normları dil paketinden gelir (TR yaklaşık: 10–13 → 120–160 KDK, 14–18 → 170–220 KDK).
- **Hayalet kaptan:** Oyuncu kendi önceki rekoruyla yarışır.

## 3. Oyun Modları (Ada Türleri)

1. **Keşif Adası** – Sessiz okuma + süre + anlama soruları (temel ölçüm).
2. **Rüzgâr Adası** – Hız rehberi: metin hedef hızda satır satır vurgulanır/silinir.
3. **Şimşek Adası** – RSVP: kelimeler ekranın ortasında tek tek gösterilir.
4. **Yankı Mağarası** – Sesli okuma: Web Speech API ile canlı kelime takibi, doğru kelime/dakika ve takılmalar. Sadece Chrome/Edge; desteklemeyen tarayıcıda kilitli görünür. Hedef hız sessiz okuma içindir; sesli modda hedef bonusu ve hedef uyarlaması yoktur (mod çarpanı 1,5).

## 4. Oyunlaştırma

- Hazine haritası, ada kilitleri, sandıklar.
- Altın, harita parçaları, rozetler; sandıklardan kostüm, gemi ve rozet çıkar.
- Günlük seri.
- Animasyonlar (Framer Motion) ve ses efektleri/müzik.
- Ses efektleri şu an Web Audio ile kodda sentezlenir (harici dosya/lisans gerekmez); müzik eklenirse ses dosyaları aşağıdaki kurala uyar.
- Ada kilitleri: bir önceki adada 2 başarılı okuma (anlama ≥ %60). Her başarılı okuma 1 harita parçası; 3 parça = 1 sandık.
- Ses ve müzik ücretsiz lisanslı kaynaklardan (öncelik CC0: Kenney, Pixabay). Kaynaklar `assets/CREDITS` dosyasında ve "Hakkında" ekranında listelenir.

## 5. Çoklu Dil Mimarisi

Yeni dil eklemek oyun mantığında kod değişikliği gerektirmez. Bir dil = arayüz çevirisi + metin kütüphanesi + dil paketi.

- **Arayüz:** i18next + react-i18next, `src/locales/{tr,de,en}/`. Kodda sabit metin yok.
- **İçerik:** `content/{dil}/{yaş-grubu}/seviye-N/*.json`. Metinler çeviri değil, her dile özgü seçilir.
- **Dil paketi (LanguagePack):**

| Ayar | Türkçe | Almanca | İngilizce |
|---|---|---|---|
| Konuşma tanıma | tr-TR | de-DE | en-US |
| Normalizasyon | İ/ı, ş, ğ | ä/ö/ü, ß ↔ ss | büyük/küçük harf |
| Hız normları | yaş grubuna göre | yaş grubuna göre | yaş grubuna göre |
| Kelime ayırma | ayrı kural | bileşik kelimeler | ayrı kural |

- Hız normları ve puan eşikleri dile özgüdür (Türkçe/Almanca kelimeler daha uzun).
- Profil dil bilgisini tutar; rekorlar dile göre ayrıdır.
- Geliştirmede sahte bir "test dili" ile sabit kalmış metin kontrolü yapılır (yayına çıkmaz).

## 6. İçerik Kuralları

- **Kaynak:** Telifsiz klasikler (yazarın ölümünden 70 yıl geçmiş, 5846 sayılı Kanun).
  - Uygun: Ömer Seyfettin, Ahmet Rasim, Namık Kemal, Mehmet Akif, Sabahattin Ali, Sait Faik, Nasreddin Hoca fıkraları (halk ürünü).
  - Uygun değil: Refik Halit Karay (ö. 1965), Reşat Nuri Güntekin (ö. 1956, 2027'de serbest).
  - Modern çeviriler kullanılmaz (çevirmen telifi).
- **Sadeleştirme:** 10–13 için hafif sadeleştirme ("sadeleştirilmiştir" notu + orijinal kaynak). 14–18 orijinal.
- **Kendi metinleri:** md/txt dosyası `content-inbox/` klasörüne konur; seviyelendirme, sorular ve sözlük geliştirme sırasında yazılır. pdf desteği ileride. Uygulama içinden yükleme yok.
- **Soru tipleri:** Çoktan seçmeli, Doğru/Yanlış, olay sıralama (sürükle-bırak, dokunmatik uyumlu), kelime hatırlama.
- **Sözlük:** Zor kelimeye dokununca anlamı çıkar, okuma süresi durur.
- **Metin JSON alanları:** `id`, `lang`, `ageGroup`, `level` (0 = yerleştirme testi), `title`, `author`, `source`, `simplified`, `body`, `glossary[]`, `questions[]`. Kelime sayısı dil paketinin kelime ayırıcısıyla otomatik hesaplanır.
- **Klasör:** `content/{dil}/{yaş-grubu}/placement/` veya `content/{dil}/{yaş-grubu}/level-N/`. `npm test` tüm içerik dosyalarını doğrular.
- Her dil ve yaş grubu için 5 seviye, seviye başına en az 6 metin.

## 7. Teknoloji Yığını

| Amaç | Araç |
|---|---|
| Dil / çatı / derleme | TypeScript, React, Vite |
| Durum yönetimi | Zustand |
| Yerel veri | IndexedDB (Dexie) |
| Çok dil | i18next, react-i18next |
| Animasyon | Framer Motion |
| Grafik | Recharts |
| PWA / çevrimdışı | vite-plugin-pwa |
| Test | Vitest |
| Konuşma tanıma | Web Speech API |

## 8. Yol Haritası

- [x] **Faz 1 – İskelet:** Vite + React + TS + i18next + PWA kurulumu; dil paketi yapısı ve Türkçe paket; profil (isim, avatar, yaş grubu, dil); IndexedDB; yerleştirme testi (2 metin); metin JSON şeması ve doğrulayıcı.
- [x] **Faz 2 – Çekirdek oyun:** Keşif Adası; KDK, anlama, EOH; puan motoru; sonuç ekranı.
- [x] **Faz 3 – Hız modları:** Rüzgâr (rehber) ve Şimşek (RSVP); uyarlamalı hız algoritması.
- [x] **Faz 4 – Oyunlaştırma:** Harita, ada kilitleri, sandık, rozetler, ses efektleri, animasyonlar, günlük seri. (Faz 3 ile paralel yapılabilir.)
- [x] **Faz 5 – Sesli mod:** Web Speech API ile Türkçe kelime eşleştirme, esnek normalizasyon, desteklemeyen tarayıcı için alternatif.
- [x] **Faz 6 – İçerik ve yayın:** Metin kütüphanesi, PWA çevrimdışı, ilerleme grafiği.
  - Her yaş grubunda her seviyede (1-5) en az 2 metin var (Türkçe, 26 dosya). Seviye başına 6 metne çıkarmak sonraki içerik turlarına bırakıldı.
  - Not: Yeni içerik dosyası eklendikten sonra `npx vitest run --clearCache` gerekir; aksi halde vitest'in fs önbelleği eski glob sonucunu kullanır.
- [x] **Faz 7 – Almanca** (onaydan sonra): dil paketi, arayüz çevirisi, Almanca metinler, de-DE sesli mod testi.
  - `src/lang/de.ts` (ß→ss, th→t normalizasyonu), `src/locales/de/common.json`; arayüz dili profil diline göre değişir (`setUiLanguage`).
  - 24 Almanca metin (de.wikisource.org, kamu malı): 10-13 için Grimm, Hebel, Hauff (Kalif Storch sadeleştirilmiş); 14-18 için Hebel (Unverhofftes Wiedersehen), Hauff (Gespensterschiff), Keller (Kleider machen Leute), Kafka (Vor dem Gesetz, Eine kaiserliche Botschaft), Kleist (Das Bettelweib von Locarno), özgün yazımla.
  - de-DE sesli mod, birim testleriyle doğrulandı; Chrome/Edge'de mikrofonla elle denenmesi gerekiyor.
- [ ] **Faz 8 – İngilizce:** aynı adımlar.

### Tamamlama ve Devam Deneyimi

- [x] Bölüm ve ada tamamlanınca başarı mührü, motivasyon mesajları ve hareket azaltma tercihine uyan kısa konfeti.
- [x] Tamamlama sayacı farklı ve başarılı okunmuş ana hikâyelere dayanır (anlama en az %60). Aynı metnin tekrarı sayacı artırmaz; yerleştirme ve ek görevler ana yolculuğa dahil değildir.
- [x] Bölüm/ada mühürleri okuma moduna özeldir. Final sertifikası beş bölümdeki bütün ana metinlerin herhangi bir modda tamamlanmasıyla açılır; mikrofon zorunlu değildir.
- [x] Profil için sabit sürpriz ödülü: soslu fıstık, sakız veya lolipop. Yazdırılabilir sertifika aileye gösterilir; gerçek ödül aile onayına, alerji ve beslenme tercihlerine bağlıdır. Uygulama ödül teslimi yapmaz.
- [x] Türkçe ve Almanca, her iki yaş grubuna ikişer özgün devam metni: ipucu dedektifi ve bilim yolculuğu. `activity` alanı bulunan level-5 metinleri ayrı tutulur; eski yolculuğun tamamlanma şartı değişmez.
- [x] Haritada ilerleme, tamamlanan hikâye işaretleri ve ilk eksik bölüme otomatik geçiş.
- [x] Hazırlık, okuma ve sorulardan çıkış; yarım tur kaydedilmez. Kayıt hatasında yeniden deneme, çift gönderimi önleme ve atomik yerleştirme kaydı.

## 9. Doğrulama

- Puan ve uyarlama algoritması için birim testleri (ör. 300 kelime / 90 sn = 200 KDK).
- Rehber ve RSVP zamanlamasının kronometre ile elle kontrolü.
- Sesli modun Chrome'da Türkçe metinle denenmesi.
- Tablette yatay/dikey ekranda dokunmatik test.
- Çevrimdışı açılış kontrolü.
- Test dili ile sabit metin kontrolü.

### Otomatik Kontroller

- `npm test`: içerik, dil eşliği, puanlama ve tamamlama kuralları.
- `npx tsc --noEmit`: TypeScript kontrolü.
- Bir terminalde `npm run dev -- --host 127.0.0.1 --port 4173`, diğerinde `npm run test:ui`.
  Tarayıcı testi yalnız Vite geliştirme sunucusuyla çalışır; sunucu farklı porttaysa `OKUMA_TEST_URL` ayarlanır.
  Windows'ta kurulu Edge kullanılır; diğer sistemlerde önceden `npx playwright install chromium` gerekir.
  Yalıtılmış tarayıcı profilleri gerçek kullanıcı kayıtlarına dokunmaz; ekran görüntüleri sistemin geçici klasörüne yazılır.
- Tarayıcı kapsamı: TR/DE son hikâye, ilk final ödülü, yenilemede aynı sürpriz, yazdırma görünümü, devam görevi, kayıt hatası/tekrar deneme, bütün modlardan çıkış ve mikrofon temizliği (sahte tanıma nesnesiyle).
- Ekran boyutları: 1024×600, 1440×900, 390×844, 320×844. Gerçek mikrofonla konuşma tanımanın kalitesi ve çevrimdışı üretim/PWA akışı ayrıca elle doğrulanmalıdır.

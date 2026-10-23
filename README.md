# AI-PC Builder 🖥️

Türkiye pazarına özel, yapay zeka destekli PC bileşeni öneri platformu. Kullanıcının bütçesini ve kullanım amacını (oyun, video düzenleme, ofis işleri vb.) baz alarak güncel piyasa verileriyle uyumlu PC yapılandırmaları öneriyor.

## 🚀 Özellikler

- **AI Destekli Öneri Motoru:** Google Gemini 2.5 Flash API kullanılarak kullanıcı ihtiyaçlarına göre bileşen önerileri üretiliyor
- **Gerçek Zamanlı Fiyatlandırma:** Google Search Grounding ile Hepsiburada, Trendyol ve İtopya gibi Türkiye'deki büyük e-ticaret platformlarından canlı fiyat verisi çekiliyor
- **İki Aşamalı API Çağrısı:** İlk aşamada bileşen önerisi, ikinci aşamada fiyat doğrulama ve güncelleme yapılıyor
- **Hata Toleransı:** Quota hatalarına karşı retry (yeniden deneme) mekanizması ve negatif/boş fiyat değerlerine karşı doğrulama mantığı

## 🛠️ Kullanılan Teknolojiler

**Backend:** Node.js, Express.js, TypeScript
**Frontend:** Vanilla HTML, CSS, JavaScript
**AI/Veri:** Google Gemini 2.5 Flash API, Google Search Grounding
**Deployment:** Render.com

## 📦 Kurulum

```bash
git clone https://github.com/ihsan034/ai-gaming-store.git
cd ai-gaming-store
npm install
```

`.env` dosyasına Gemini API anahtarınızı ekleyin:

```
GEMINI_API_KEY=your_api_key_here
```

Geliştirme modunda başlatın (dosya kaydedilince sunucu yeniden başlar):

```bash
npm run dev
```

Derleyip çalıştırmak için:

```bash
npm run build
npm start
```

Sadece tip kontrolü için `npm run typecheck` kullanılabilir. Uygulama `http://localhost:5000` adresinde açılır.

> **Deployment notu:** Backend TypeScript ile yazıldığı için sunucuda derleme gerekir. Render'da Build Command `npm install && npm run build`, Start Command `npm start` olmalıdır.

## 🗂️ Proje Yapısı

```
src/
  server.ts     Express sunucusu ve API rotaları
  products.ts   Ürün kataloğu
  types.ts      Ortak tipler (Product, istek/yanıt tipleri)
public/         Arayüz (HTML, CSS, JavaScript)
dist/           Derlenmiş çıktı (npm run build ile oluşur, Git'e eklenmez)
```

## 🧩 Nasıl Çalışıyor?

1. Kullanıcı bütçe ve kullanım amacını giriyor
2. Gemini API, uygun bileşenleri (CPU, GPU, RAM, anakart vb.) öneriyor
3. Google Search Grounding ile her bileşenin güncel Türkiye pazarı fiyatı doğrulanıyor
4. Fiyat doğrulama mantığı geçersiz (negatif/boş) değerleri tespit edip düzeltiyor
5. Kullanıcıya bütçeye uygun, güncel fiyatlı tam bir PC yapılandırması sunuluyor

## 📌 Notlar

Bu proje, yapay zeka API'lerinin gerçek dünya verisiyle (canlı fiyatlandırma) nasıl entegre edilebileceğini öğrenmek amacıyla geliştirilmiştir.

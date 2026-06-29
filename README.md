# AI-PC Builder 🖥️

Türkiye pazarına özel, yapay zeka destekli PC bileşeni öneri platformu. Kullanıcının bütçesini ve kullanım amacını (oyun, video düzenleme, ofis işleri vb.) baz alarak güncel piyasa verileriyle uyumlu PC yapılandırmaları öneriyor.

## 🚀 Özellikler

- **AI Destekli Öneri Motoru:** Google Gemini 2.5 Flash API kullanılarak kullanıcı ihtiyaçlarına göre bileşen önerileri üretiliyor
- **Gerçek Zamanlı Fiyatlandırma:** Google Search Grounding ile Hepsiburada, Trendyol ve İtopya gibi Türkiye'deki büyük e-ticaret platformlarından canlı fiyat verisi çekiliyor
- **İki Aşamalı API Çağrısı:** İlk aşamada bileşen önerisi, ikinci aşamada fiyat doğrulama ve güncelleme yapılıyor
- **Hata Toleransı:** Quota hatalarına karşı retry (yeniden deneme) mekanizması ve negatif/boş fiyat değerlerine karşı doğrulama mantığı

## 🛠️ Kullanılan Teknolojiler

**Backend:** Node.js, Express.js
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

Sunucuyu başlatın:

```bash
npm start
```

## 🧩 Nasıl Çalışıyor?

1. Kullanıcı bütçe ve kullanım amacını giriyor
2. Gemini API, uygun bileşenleri (CPU, GPU, RAM, anakart vb.) öneriyor
3. Google Search Grounding ile her bileşenin güncel Türkiye pazarı fiyatı doğrulanıyor
4. Fiyat doğrulama mantığı geçersiz (negatif/boş) değerleri tespit edip düzeltiyor
5. Kullanıcıya bütçeye uygun, güncel fiyatlı tam bir PC yapılandırması sunuluyor

## 📌 Notlar

Bu proje, yapay zeka API'lerinin gerçek dünya verisiyle (canlı fiyatlandırma) nasıl entegre edilebileceğini öğrenmek amacıyla geliştirilmiştir.

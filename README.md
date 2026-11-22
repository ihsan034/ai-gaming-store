# AI-PC Builder 🖥️

Türkiye pazarına özel, yapay zeka destekli PC bileşeni öneri platformu. Kullanıcının bütçesini ve kullanım amacını (oyun, video düzenleme, ofis işleri vb.) baz alarak güncel piyasa verileriyle uyumlu PC yapılandırmaları öneriyor.

## 🚀 Özellikler

- **AI Destekli Öneri Motoru:** Google Gemini 3.8 Flash API kullanılarak kullanıcı ihtiyaçlarına göre bileşen önerileri üretiliyor
- **Gerçek Zamanlı Fiyatlandırma:** Google Search Grounding ile Akakçe, Cimri, Hepsiburada, Trendyol ve İtopya'dan canlı fiyat aranıyor; yalnızca gerçek arama sonucuna dayanan fiyatlar kabul ediliyor ve 24 saat önbellekte tutuluyor
- **İki Aşamalı API Çağrısı:** İlk aşamada bileşen önerisi, ikinci aşamada fiyat doğrulama ve güncelleme yapılıyor
- **Hata Toleransı:** Quota hatalarına karşı retry (yeniden deneme) mekanizması ve negatif/boş fiyat değerlerine karşı doğrulama mantığı

## 🛠️ Kullanılan Teknolojiler

**Backend:** Node.js, Express.js, TypeScript
**Frontend:** Vanilla HTML, CSS, JavaScript
**AI/Veri:** Google Gemini 3.8 Flash API, Google Search Grounding
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

### İsteğe bağlı ortam değişkenleri

Gemini kredisini korumak için öneri isteği sınırlandırılır. Varsayılanlar `.env` veya Render'daki ortam değişkenleriyle değiştirilebilir:

| Değişken | Varsayılan | Anlamı |
| --- | --- | --- |
| `LIMIT_PER_IP_PER_MINUTE` | 3 | Bir IP'nin dakikadaki öneri isteği |
| `LIMIT_PER_IP_PER_DAY` | 10 | Bir IP'nin günlük öneri isteği |
| `DAILY_RECOMMEND_LIMIT` | 30 | Tüm kullanıcılar için günlük toplam öneri isteği |
| `MAX_PROMPT_LENGTH` | 500 | Mesajın en fazla karakter sayısı |

> **Deployment notu:** Backend TypeScript ile yazıldığı için sunucuda derleme gerekir. Render'da Build Command `npm install && npm run build`, Start Command `npm start` olmalıdır.

## 🗂️ Proje Yapısı

```
src/
  server.ts, app.ts, composition.ts   Giriş noktası, Express uygulaması, parçaların birbirine bağlanması
  RecommendationService.ts            Öneri akışını yöneten sınıf
  ai/          Adapter, Decorator ve Abstract Factory (Gemini ve sahte sağlayıcı)
  pricing/     Strategy (katalog fiyatı / canlı fiyat)
  builder/     Builder (PCBuild, Director'lar)
  validation/  Chain of Responsibility (uyumluluk ve bütçe kuralları)
  products.ts  Ürün kataloğu
  rateLimit.ts IP başına ve günlük toplam istek sınırları
public/        Arayüz (HTML, CSS, JavaScript)
test/          Otomatik testler (npm test)
dist/          Derlenmiş çıktı (npm run build ile oluşur, Git'e eklenmez)
```

## 📚 Dokümanlar

- [KURULUM.md](KURULUM.md): kurulum, ortam değişkenleri, kredisiz (mock) mod, yayın
- [TASARIM-KALIPLARI.md](TASARIM-KALIPLARI.md): kullanılan 6 tasarım kalıbı, çözdükleri problemler ve sınıf diyagramları
- [TEST.md](TEST.md): testlerin çalıştırılması ve kapsamı

## 🧩 Nasıl Çalışıyor?

1. Kullanıcı bütçe ve kullanım amacını giriyor
2. Gemini API, uygun bileşenleri (CPU, GPU, RAM, anakart vb.) öneriyor
3. Google Search Grounding ile her bileşenin güncel Türkiye pazarı fiyatı doğrulanıyor
4. Fiyat doğrulama mantığı geçersiz (negatif/boş) değerleri tespit edip düzeltiyor
5. Sunucu, seçilen sistemi uyumluluk ve bütçe kurallarından geçirip bulduğu uyarıları bildiriyor
6. Kullanıcıya bütçeye uygun, güncel fiyatlı tam bir PC yapılandırması sunuluyor

## 📌 Notlar

Bu proje, yapay zeka API'lerinin gerçek dünya verisiyle (canlı fiyatlandırma) nasıl entegre edilebileceğini öğrenmek amacıyla geliştirilmiştir.

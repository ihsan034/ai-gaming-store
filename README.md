# AI-PC Builder 🖥️

Türkiye pazarına özel, yapay zeka destekli PC bileşeni öneri platformu. Kullanıcının bütçesini ve kullanım amacını (oyun, video düzenleme, ofis işleri vb.) baz alarak güncel piyasa verileriyle uyumlu PC yapılandırmaları öneriyor.

## 🚀 Özellikler

- **AI Destekli Öneri Motoru:** Google Gemini 3.8 Flash API kullanılarak kullanıcı ihtiyaçlarına göre bileşen önerileri üretiliyor
- **Gerçek Zamanlı Fiyatlandırma:** Google Search Grounding ile Akakçe, Cimri, Hepsiburada, Trendyol ve İtopya'dan canlı fiyat aranıyor; yalnızca gerçek arama sonucuna dayanan fiyatlar kabul ediliyor ve 24 saat önbellekte tutuluyor
- **İki Aşamalı API Çağrısı:** İlk aşamada bileşen önerisi, ikinci aşamada fiyat doğrulama ve güncelleme yapılıyor
- **Hata Toleransı:** Quota hatalarına karşı retry (yeniden deneme) mekanizması ve negatif/boş fiyat değerlerine karşı doğrulama mantığı
- **Sunucu Taraflı Doğrulama:** Önerilen sistem soket, bellek tipi, güç kaynağı, soğutucu ve bütçe kurallarından geçirilir; bulunan uyarılar kullanıcıya gösterilir

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

Uygulama `http://localhost:5000` adresinde açılır. Testleri çalıştırmak için `npm test`, tip kontrolü için `npm run typecheck` kullanılır. API anahtarı olmadan ve kredi harcamadan denemek için `.env` dosyasına `AI_PROVIDER=mock` yazılabilir (bkz. [KURULUM.md](KURULUM.md)).

### İsteğe bağlı ortam değişkenleri

Gemini kredisini korumak için öneri isteği sınırlandırılır. Varsayılanlar `.env` veya Render'daki ortam değişkenleriyle değiştirilebilir:

| Değişken | Varsayılan | Anlamı |
| --- | --- | --- |
| `AI_PROVIDER` | `gemini` | `gemini` (gerçek) veya `mock` (sahte, kredisiz) |
| `PRICING_MODE` | `live` | `live` (canlı fiyat) veya `catalog` (katalog fiyatı) |
| `LIMIT_PER_IP_PER_MINUTE` | 3 | Bir IP'nin dakikadaki öneri isteği |
| `LIMIT_PER_IP_PER_DAY` | 10 | Bir IP'nin günlük öneri isteği |
| `DAILY_RECOMMEND_LIMIT` | 30 | Tüm kullanıcılar için günlük toplam öneri isteği |
| `MAX_PROMPT_LENGTH` | 500 | Mesajın en fazla karakter sayısı |

> **Canlı sitedeki (Render) güncel ayarlar** (23.11.2026): `LIMIT_PER_IP_PER_MINUTE=6`, `LIMIT_PER_IP_PER_DAY=20`, `DAILY_RECOMMEND_LIMIT=80`. `MAX_PROMPT_LENGTH` tanımlı değildir, varsayılan 500 geçerlidir. Yukarıdaki tablo, ortam değişkeni verilmediğinde kodun kullandığı varsayılanlardır.

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

## 🏛️ Tasarım Kalıpları (EBLG443)

Proje, Tasarım Kalıpları dersinin dönem projesidir. Altı GoF kalıbı kullanılmıştır; kodda her rol `[Kalıp: ...]` yorumuyla işaretlidir. Ayrıntılar, UML diyagramları, değerlendirilen alternatifler ve bedeller [TASARIM-KALIPLARI.md](TASARIM-KALIPLARI.md) içindeki Kalıp Haritası'ndadır.

| Kalıp | Nerede | Ne için |
| --- | --- | --- |
| Abstract Factory | `src/ai/AIProviderFactory.ts` ve fabrikalar | Öneri ve fiyat istemcilerini aynı sağlayıcıdan (Gemini veya sahte) üretir |
| Builder | `src/builder/` | Seçilen parçalardan `PCBuild` kurar, "tam sistem mi?" bilgisini üretir |
| Adapter | `src/ai/GeminiClientAdapter.ts` | Gemini SDK'sını `LLMClient` arayüzüne çevirir |
| Decorator | `src/ai/RetryingLLMClient.ts`, `LoggingLLMClient.ts` | Yeniden deneme ve loglamayı iç mantığa dokunmadan ekler |
| Chain of Responsibility | `src/validation/` | Uyumluluk ve bütçe kurallarını zincirleme denetler |
| Strategy | `src/pricing/` | Fiyat kaynağını (katalog veya canlı) değiştirilebilir yapar |

## 📖 Kullanılan Kütüphaneler ve Dış Kaynaklar

| Paket | Sürüm | Ne için |
| --- | --- | --- |
| `express` | ^5.2.1 | Web sunucusu |
| `@google/genai` | ^2.7.0 | Gemini API SDK'sı (Adapter'ın uyarladığı sınıf) |
| `dotenv` | ^17.4.2 | `.env` dosyasını okuma |
| `typescript` | ^7.0.2 | Derleme ve tip kontrolü (geliştirme) |
| `tsx` | ^4.23.15 | Geliştirme modu ve test çalıştırma (geliştirme) |
| `@types/express`, `@types/node` | ^5.0.6, ^26.6.5 | Tip tanımları (geliştirme) |

- **Test çatısı:** Node.js'in yerleşik test çalıştırıcısı `node:test` (ek paket yok).
- **Dış hizmetler:** Google Gemini API ve Google Search grounding (çalışma zamanında öneri ve fiyat araması).
- **Veri:** Ürün kataloğu ve fiyatları Akakçe'den elle derlenmiştir; canlı fiyatlar Google aramasıyla Akakçe, Cimri, Hepsiburada, Trendyol ve İtopya sonuçlarından alınır.

## 🤖 Yapay Zekâ Kullanımı

Bu projenin geliştirilmesinde yapay zekâ kod asistanı **Claude** (Anthropic, Claude Code aracıyla) kullanılmıştır. Asistanla yapılan işler:

- Tasarım kalıplarının uygulanması (`src/ai/`, `src/pricing/`, `src/builder/`, `src/validation/`) ve `server.ts`'in bu yapıya göre yeniden düzenlenmesi
- Otomatik testler (`test/`)
- Dokümanlar (`TASARIM-KALIPLARI.md`, `TEST.md`, `KURULUM.md` ve bu README)
- Önceki aşamalarda hata ayıklama, ölçümler ve katalog güncellemeleri

Asistanın katkısı ilgili commit'lerde `Co-Authored-By` satırıyla işaretlenmiştir. Bunun dışında uygulamanın kendisi çalışma zamanında Google Gemini modelini kullanır (öneri ve fiyat araması); bu bir geliştirme aracı değil, uygulamanın bir parçasıdır.

## 🧩 Nasıl Çalışıyor?

1. Kullanıcı bütçe ve kullanım amacını giriyor
2. Gemini API, uygun bileşenleri (CPU, GPU, RAM, anakart vb.) öneriyor
3. Google Search Grounding ile her bileşenin güncel Türkiye pazarı fiyatı doğrulanıyor
4. Fiyat doğrulama mantığı geçersiz (negatif/boş) değerleri tespit edip düzeltiyor
5. Sunucu, seçilen sistemi uyumluluk ve bütçe kurallarından geçirip bulduğu uyarıları bildiriyor
6. Kullanıcıya bütçeye uygun, güncel fiyatlı tam bir PC yapılandırması sunuluyor

## 📌 Notlar

Bu proje, yapay zeka API'lerinin gerçek dünya verisiyle (canlı fiyatlandırma) nasıl entegre edilebileceğini öğrenmek amacıyla geliştirilmiştir.

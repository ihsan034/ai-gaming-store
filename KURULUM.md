# Kurulum

## Gereksinimler

- Node.js (geliştirme Node.js 24 ile yapıldı) ve npm
- Gerçek yapay zekâ için bir Google Gemini API anahtarı. **Anahtar olmadan da çalıştırılabilir** (aşağıda "Kredisiz mod").

## Adımlar

```bash
git clone https://github.com/ihsan034/ai-gaming-store.git
cd ai-gaming-store
npm install
```

Proje klasöründe bir `.env` dosyası oluşturun:

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

Uygulama varsayılan olarak `http://localhost:5000` adresinde açılır.

## Ortam değişkenleri

Hepsi `.env` dosyasına (ya da Render'da ortam değişkeni olarak) yazılır.

| Değişken | Varsayılan | Anlamı |
|---|---|---|
| `GEMINI_API_KEY` | yok | Gemini API anahtarı. `AI_PROVIDER=gemini` iken zorunludur, yoksa sunucu başlamaz |
| `AI_PROVIDER` | `gemini` | `gemini` (gerçek) veya `mock` (sahte, kredisiz). Abstract Factory'nin hangi fabrikayı kullanacağını seçer |
| `PRICING_MODE` | `live` | `live` (Google aramasıyla canlı fiyat) veya `catalog` (kataloğa yazılı fiyat). Strategy'yi seçer |
| `PORT` | `5000` | Sunucu portu |
| `LIMIT_PER_IP_PER_MINUTE` | `3` | Bir IP'nin dakikadaki öneri isteği |
| `LIMIT_PER_IP_PER_DAY` | `10` | Bir IP'nin günlük öneri isteği |
| `DAILY_RECOMMEND_LIMIT` | `30` | Tüm kullanıcılar için günlük toplam öneri isteği |
| `MAX_PROMPT_LENGTH` | `500` | Mesajın en fazla karakter sayısı |

## Kredisiz mod

Gerçek yapay zekâ çağrısı yapmadan (anahtar gerekmeden, ücretsiz) denemek için `.env` dosyasına şunu yazın:

```
AI_PROVIDER=mock
```

Bu modda her istek, sabit ve uyumlu 8 parçalık bir demo sistemiyle cevaplanır. Arayüzü ve sunucuyu denemek için kullanışlıdır. Ayrıca `PRICING_MODE=catalog` ile fiyat araması da kapatılabilir.

## Testler

```bash
npm test
npm run typecheck
```

Ayrıntılar için [TEST.md](TEST.md).

## Yayın (Render.com)

Backend TypeScript ile yazıldığı için sunucuda derleme gerekir:

- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Ortam değişkenleri: `GEMINI_API_KEY` ve istenirse yukarıdaki sınırlar

## Proje yapısı

```
src/
  server.ts               Giriş noktası: ortamı okur, uygulamayı başlatır
  app.ts                  Express uygulaması ve rotalar
  composition.ts          Kalıpların birbirine bağlandığı yer (Strategy ve fabrika seçimi)
  RecommendationService.ts  Öneri akışını yöneten sınıf
  prompt.ts               Yapay zekâya giden sistem talimatı
  products.ts             Ürün kataloğu
  rateLimit.ts            IP başına ve günlük toplam istek sınırları
  ai/                     Adapter, Decorator, Abstract Factory
  pricing/                Strategy
  builder/                Builder
  validation/             Chain of Responsibility
public/                   Arayüz (HTML, CSS, JavaScript)
test/                     Otomatik testler
```

Her kalıbın hangi sınıflarla uygulandığı için [TASARIM-KALIPLARI.md](TASARIM-KALIPLARI.md) dosyasına bakın.

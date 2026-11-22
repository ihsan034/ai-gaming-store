# Test Dokümanı

## Çalıştırma

```bash
npm test            # tüm testler
npm run typecheck   # kaynak ve test dosyaları için tip kontrolü
```

Tek bir test dosyasını çalıştırmak için:

```bash
npx tsx --test test/pricing.test.ts
```

Testler Node.js'in yerleşik test çalıştırıcısını (`node:test`) ve `tsx`'i kullanır; ek bir test kütüphanesi gerekmez. **Hiçbir test gerçek yapay zekâya bağlanmaz ve kredi harcamaz.** Gemini yerine `MockProviderFactory`'nin (bkz. [TASARIM-KALIPLARI.md](TASARIM-KALIPLARI.md), Abstract Factory) sahte istemcileri kullanılır.

## Kapsam

Toplam 83 test, 8 dosya:

| Dosya | Test | Neyi doğrular |
|---|---|---|
| [`adapter.test.ts`](test/adapter.test.ts) | 4 | Adapter: SDK istek ve yanıt biçiminin `LLMClient` arayüzüne çevrilmesi, arama ve düşünme ayarlarının yalnızca istenince eklenmesi |
| [`decorators.test.ts`](test/decorators.test.ts) | 7 | Decorator: 503'te ikiye katlanan bekleme ile yeniden deneme (2 sn, 4 sn, 8 sn), deneme hakkı bitince hatanın iletilmesi, 503 dışı hataların denenmemesi, loglamanın yanıtı değiştirmemesi, iki dekoratörün birlikte çalışması |
| [`factory.test.ts`](test/factory.test.ts) | 8 | Abstract Factory: fabrikaların iki ayrı istemci üretmesi, `AI_PROVIDER` ile seçim, anahtarsız mock, bilinmeyen sağlayıcının reddi |
| [`pricing.test.ts`](test/pricing.test.ts) | 14 | Strategy: katalog fiyatı; canlı fiyatta kaynak doğrulaması, uydurma kaynağın reddi, yarıdan düşük fiyatın reddi, üst sınır olmaması, 24 saatlik önbellek, ikinci deneme, hata ve JSON'suz yanıtta yedek fiyat; yanıt ayrıştırma fonksiyonları |
| [`builder.test.ts`](test/builder.test.ts) | 9 | Builder: tekrar eden ürünün atılması, toplam fiyat, tam sistem ve eksik kategori tespiti, dahili grafik istisnası, Director seçimi, `PCBuild`'in değişmezliği |
| [`validation.test.ts`](test/validation.test.ts) | 14 | Chain of Responsibility: her kuralın ayrı testi (soket, bellek tipi, güç kaynağı, soğutucu kademeleri, bütçe), zincirin ihlalleri birlikte toplaması, yeni halka eklenebilmesi |
| [`recommendation.test.ts`](test/recommendation.test.ts) | 22 | Kalıpların birlikte çalıştığı servis ve HTTP testleri: yanıt alanları, geçersiz ID'ler, bütçe ve uyumluluk uyarıları, bozuk JSON, kod bloğuna sarılı JSON, fiyat araması çökünce yedek, hata kodu çevirisi (429, 503, 400, 500), gerçek Express uygulamasına istek |
| [`rateLimit.test.ts`](test/rateLimit.test.ts) | 5 | İstek sınırlayıcı: geçersiz mesajın günlük hakkı tüketmemesi, uzun mesaj, dakikalık sınır, IP'lerin birbirini etkilememesi |

## Testlerin gerçekten bir şeyi denetlediğinin kontrolü

Geliştirme sırasında üç davranış bilerek bozuldu ve ilgili testlerin başarısız olduğu görüldü, sonra kod geri yüklendi:

| Bozulan davranış | Başarısız olan test |
|---|---|
| Soğutucu kuralında 65W sınırının kaldırılması | `CoolerRule: 125W işlemci çift kule ya da sıvı ister, tek kule yetmez` |
| Fiyat kaynağı doğrulamasının kapatılması | `LivePricing: kaynağı arama sonucu olmayan (uydurma) fiyatı reddedip katalog fiyatına düşer` |
| Dahili grafik istisnasının kaldırılması | `FullSystemDirector: dahili grafikli işlemcide ekran kartı zorunlu değildir` |

## Uçtan uca elle kontrol (kredisiz)

Sunucu sahte sağlayıcıyla, API anahtarı olmadan çalıştırılabilir ve arayüz denenebilir:

```bash
# .env dosyasına AI_PROVIDER=mock yazın, sonra:
npm run dev
```

`http://localhost:5000` açılıp bir mesaj gönderildiğinde sabit, uyumlu 8 parçalık demo sistemi gelir; 8 ürün kartı ve toplam fiyat görünür. Bu kontrol 22 Kasım 2026'da yapıldı (sunucu derlenmiş hâliyle çalıştırıldı, tarayıcıda 8 kart ve toplam fiyat doğrulandı).

## Kapsam dışı olanlar

- **Gerçek Gemini çağrısı:** `GeminiClientAdapter` yalnızca sahte bir SDK nesnesiyle test edilir. SDK'nın gerçek davranışı (ör. arama kaynaklarının biçimi) otomatik testlerle denetlenmez; yayına almadan önce tek bir gerçek istekle (yaklaşık 4 TL) elle denenmelidir.
- **Tarayıcı arayüzü:** `public/script.js` için otomatik test yoktur; arayüz elle denenmiştir.
- **Yük ve performans:** Yanıt süresi ve maliyet ölçümleri gerçek isteklerle elle yapılmıştır, otomatik test değildir.

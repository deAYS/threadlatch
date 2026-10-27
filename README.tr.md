# ThreadLatch

**Coding agent ve AI sohbetleri arasında kararları, düzeltmeleri ve açık soruları kaynaklarıyla taşı.**

[English](README.md) · [Uygulama durumu](docs/IMPLEMENTATION-STATUS.md) · [Test kanıtları](docs/evaluations/compatibility.md)

**v0.1 önizleme.** Ortak bellek çekirdeği, Node CLI, Codex/Claude Code için proje içi skill kurulumu ve EN/TR web inceleme arayüzü uygulandı. Gerçek sağlayıcı değerlendirmeleri ve ilk kullanıcı denemeleri sürüm koşuludur. npm paketi **yayınlanmadı**. Tanıtım sayfası uygulamadan ayrıdır.

## Kaynaktan başla

**Node.js 22.x (en az 22.12.0)** ve npm gerekir. ThreadLatch hesabı veya ek API anahtarı istenmez.

```sh
git clone https://github.com/deAYS/threadlatch.git
cd threadlatch
npm ci
npm run build:cli
node dist-cli/cli/index.js setup --project /projenin/yolu --agent both
```

Yolu kendi projenle değiştir; boşluk varsa tırnak kullan. Tek ajan için codex veya claude-code seç. Kurulum mevcut belleği, AGENTS.md / CLAUDE.md dosyalarını ve ilgisiz skill'leri korur. Özel veri içeren .threadlatch/ varsayılan olarak Git dışında tutulur.

Skill'in CLI'a erişmesi gerekir. `npm pack` ile yerel paket oluşturup hedef projede `npm install --save-dev /paketin/yolu/threadlatch-0.1.0-preview.1.tgz` kullanabilirsin. Skill `node node_modules/threadlatch/dist-cli/cli/index.js` üzerinden çalışır. Ya da normal npm kurulumunla CLI'ı PATH'e ekle. Registry'de yayınlanmış sürüm varsayılmıyor. [Kurulum ve kaldırma](docs/ONBOARDING.md).

Codex'te **$threadlatch**, Claude Code'da **/threadlatch** çağır. Sonra “kaldığımız yerden devam et”, “bu kararı hatırla”, “son değişiklikleri göster” veya “başka ajana devretmek için hazırla” diyebilirsin. Skill kaynak dosyalarını, JSON'u ve proposal kimliklerini yönetir; tek bir kısa değişiklik özeti sunar ve seçilen grubu doğrulanmış CLI ile kaydeder. Doğal dilde seçilmesi ajana bağlıdır; açık çağrı yedek yoldur. Gizli sohbet geçmişine erişmez.

## İsteğe bağlı web arayüzü

`npm run dev` çalıştır, gösterilen yerel URL'nin /threadlatch/ yolunu aç. Örneği aç veya proje oluştur. Sohbet getir → rolleri ve mesaj seçimini incele → analizi hazırla → isteği kullandığın AI'a gönder → JSON cevabını getir → kaynaklı farkı incele → seçilenleri kaydet. Otomatik sağlayıcı gönderimi yoktur; web akışında kopyala/yapıştır vardır.

Markdown sınırlı güncel bağlamı; JSON bütün kaynakları, revision geçmişini ve bekleyen analizleri taşır. Aynı tarayıcı yedeği tekrar getirilirse ayrı proje açılır. CLI yedeği yalnız boş bellek dizinine geri yükler. İki depo kendiliğinden senkronize olmaz.

## Doğrulama ve sınırlar

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:package
npx --no-install playwright install chromium
npm run test:e2e
```

Windows/Node 22 paket döngüsü ve gerçek Chromium akışları yerelde sınandı. Kayıt, reload, düzeltme, yedek, geçmiş, iki sekme yarışı, kota hatası, EN/TR, mobil düzen ve erişilebilirlik testleri var. Linux/macOS kontrolleri CI üzerinde çalışır; tam sağlayıcı eval'leri ve beş ilk kullanıcı denemesi bekliyor. Otomatik kaynak testleri modelin anlamı doğru çıkardığını kanıtlamaz. [Güncel sonuçlar](docs/evaluations/compatibility.md).

Bellek .threadlatch/ veya IndexedDB'de **şifresiz** saklanır. Yedek ya da cihazlar arası sync değildir. Tarayıcı verisini temizlemeden/origin değiştirmeden JSON aktar. Alıntı eşleşmesi anlam doğruluğu demek değildir. Örnek, asistan önerisi, varsayım ve belirsiz onay kendiliğinden kullanıcı kararına dönüşmez. Elle düzenleme açıkça işaretlenir; eski kaynak yeni metni doğrulamaz.

Otomatik geçmiş toplama, doğrudan provider API'ı, hook ve MCP yoktur. [Manuel Pages akışı](docs/GITHUB-PAGES.md) korundu; eksik kontroller bitmeden uygulama yayını veya kararlı sürüm etiketi yok. [Gizlilik](docs/PRIVACY.md) · [Katkı](CONTRIBUTING.md) · [Güvenlik](SECURITY.md) · [MIT](LICENSE).

Public raporlarda sentetik veri kullan; özel sohbet, token veya anahtar paylaşma. Bağımsız projedir; sağlayıcı onayı ima edilmez.

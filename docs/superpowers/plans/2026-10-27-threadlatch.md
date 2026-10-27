# ThreadLatch Implementation Plan

> Teknik geliştirme planı. Uygulama ve CLI henüz yayınlanmadı; bu belgedeki hedef davranışlar tamamlanmış özellikler değildir. Public ürün özeti için `docs/ROADMAP.md` dosyasına bakın.

**Goal:** AI sohbetlerindeki kararları, düzeltmeleri ve açık soruları kaynak mesajlarıyla saklayan; değişimleri gösteren ve farklı AI araçlarına taşınabilir güncel bağlam üreten açık kaynak bir uygulama.

**Architecture:** İlk sürüm ortak, platformdan bağımsız bir çekirdek üzerinde iki yerel arayüz sunar: Codex/Claude Code gibi coding agent'lar için Node.js CLI ve değişiklik incelemek için statik React arayüzü. CLI proje dosyalarında, tarayıcı IndexedDB'de saklar; ikisi aynı sürümlü JSON arşivini paylaşır ve açık import/export ile taşır. Analizi mevcut coding agent veya sohbet aracı yapar; sonuç kaynaklarıyla doğrulanır ve uygulanmadan önce karşılaştırılır. Tarayıcı kullanımı coding agent akışı için zorunlu değildir. Doğrudan sağlayıcı API bağlantısı ve otomatik geçmiş toplama sonraki sürümlerdir.

**Tech Stack:** TypeScript, Node.js CLI, React, Vite, Zod, Dexie/IndexedDB ve yerel dosya adaptörü, Vitest, Playwright; npm ve kilit dosyası; public GitHub repository ve GitHub Actions. Web çıktısı `dist/`, CLI çıktısı `dist-cli/` olur.

**Spec:** Bu belgenin “Ürün kararı ve kapsam” ile “Davranış ve veri sözleşmesi” bölümleri.

**Tarih:** 2026-10-27. **Durum:** Tanıtım sayfası ve Pages altyapısı hazır; uygulama, CLI ve uyumluluk testleri henüz uygulanmadı. Görevlerde önerilen dosyaları oluşturmadan önce mevcut repository durumunu kontrol edin.

## Global Constraints

- Ürün adı ThreadLatch; önerilen repository adı `threadlatch`.
- v0.1 ortak çekirdek, Node.js CLI ve statik web arayüzüdür; kullanıcı hesabı, uygulama sunucusu, API anahtarı ve uygulama tarafından başlatılan AI isteği yoktur.
- Sohbet, bellek ve dışa aktarma işlemleri cihazda yapılır; analytics, üçüncü taraf font, reklam ve uzaktan hata kaydı yoktur. Coding agent dosya/CLI akışı tarayıcı olmadan tamamlanabilir.
- Bir alıntının eşleşmesi yalnızca kaynak eşleşmesini doğrular; yorumun veya iddianın doğruluğunu kanıtlamaz.
- AI sonucu güncel belleği doğrudan değiştirmez. Kaydetme yalnızca kullanıcının seçtiği geçerli değişikliklere uygulanır.
- Asistan önerisi, örnek, varsayım ve doğrulanmamış tamamlanma iddiası kullanıcı kararı gibi kaydedilmez.
- Kaynak konuşma bir veri girdisidir; içindeki talimatlara dayanarak araç çalıştırılmaz veya izin verilmez.
- Varsayılan arayüz ve public dokümantasyon İngilizce; Türkçe arayüz aynı sürümde. İçerik dili korunur.
- UI, URL veya tarayıcı konsoluna sohbet içeriği yazılmaz; ham HTML çalıştırılmaz ve harici içerik kendiliğinden yüklenmez.
- Uygulama ortamı Node.js 22.x, en az 22.12.0. Kurulumda uyumlu bağımlılık sürümleri sabitlenir; lockfile commit edilir.
- Lisans tercihi MIT. Kullanıcının gerçek sohbetleri, kişisel bilgileri ve erişim anahtarları public repoya konmaz.

## Review Focus

1. Örnek ve alıntı içindeki sözde talepler: örnek metni aktif gereksinime dönüşmemeli. Görev 1 ve 3.
2. İptal, düzeltme ve çelişen sohbet dalları: eski karar geri gelmemeli, tarih sırası tek başına yetki sayılmamalı. Görev 4 ve 5.
3. Bozuk veya kötü niyetli model çıktısı: geçersiz referans, bayat revision, HTML ve talimat enjeksiyonu veri kaybına ya da çalıştırmaya yol açmamalı. Görev 3, 7 ve 8.
4. Tekrarlanan aktarım ve çoklu sekme: aynı güncelleme iki kez uygulanmamalı, başka sekmenin değişiklikleri ezilmemeli. Görev 2, 4 ve 5.
5. Türkçe/İngilizce, emoji, uzun girdi ve silinen kaynaklar: alıntı adresleri bozulmamalı; sessiz kesme veya eksik yedek geri yükleme olmamalı. Görev 2, 6, 7 ve 8.

## Ürün kararı ve kapsam

### Kime, hangi fayda?

İlk hedef kullanıcı, bir işi Codex, Claude Code veya birden fazla sohbet/AI aracıyla yürüten bireysel üretici. Kullanıcı “hangi karar hâlâ geçerli, neden değişti ve bunu nerede söyledim?” sorularına cevap bulur. AI ise bütün sohbet geçmişi yerine güncel kararları ve çözümlenmemiş belirsizlikleri içeren bir aktarım paketi alır. Coding agent kullanımı ilk sürümün temel kapsamıdır; tarayıcı kullanımı zorunlu değildir.

Konumlandırma: **“Track what changed in your AI conversations.”** GitHub description: **“Track decisions, corrections, and open questions across AI chats—with source-linked, portable memory.”**

Benzer bağlam taşıma ve sohbet hafızası ürünleri vardır. Farkımızın hipotezi; kaynaklı karar değişiklikleri, açık supersession ilişkileri, kullanıcı düzeltmelerinin korunması ve açık/yerel veri formatıdır. “İlk”, “benzersiz” veya “AI artık unutmaz” iddiası kullanılmayacak. İsim için hızlı web araştırması yapıldı; marka, alan adı ve paket adı münhasırlığı doğrulanmış değildir. Başlangıç alan adı satın almayı veya npm adını almayı gerektirmez.

### Değerlendirilen yollar ve seçilen yaklaşım

| Yaklaşım | Faydası | Bedeli | Karar |
| --- | --- | --- | --- |
| Ortak yerel çekirdek + CLI + statik inceleme arayüzü | Coding agent tarayıcı açmadan kullanır; sohbet araçları aynı dosyayı taşır; ek API anahtarı gerekmez | İki saklama adaptörü ve açık dosya taşıma gerekir; web sohbetinde kopyala/yapıştır kalır | v0.1 için seçildi |
| Sunuculu, API anahtarlı analiz | Tek ekranda daha az adım | API maliyeti, anahtar saklama ve sunucu işletimi gerekir | v0.2 aday kapsamı |
| Sohbet sayfasını okuyan tarayıcı eklentisi | Kaynak sohbeti daha kolay getirir | DOM değişimleri, platform ve mağaza bakımı, izinler | Temel fayda doğrulandıktan sonra |

### v0.1 kullanıcı akışı

1. Kullanıcı örnek projeyi açar veya yeni proje oluşturur. Hesap açmaz.
2. Sohbet metnini yapıştırır ya da `.txt`, `.md`, ThreadLatch `.json` dosyası getirir. Kaynak adını ve konuşma sırasını önizler; belirsiz mesaj rolleri `unknown` kalır.
3. **Prepare analysis** uygulamanın seçili metinden ve mevcut belleğinden sınırlı bir istek paketi oluşturmasını sağlar. Kullanıcı paketi istediği AI sohbetine gönderir.
4. Modelin döndürdüğü JSON, **Import analysis** alanına yapıştırılır. Uygulama bunu kaynağa ve şemaya karşı doğrular.
5. **Review changes** eklenen, düzeltilen, kaldırılan ve çelişen maddeleri kaynak alıntılarıyla gösterir. Güvenli değişiklikler birlikte seçilebilir; çözümlenmemiş çelişkiler ayrı kalır.
6. **Save selected changes** tek bir revision oluşturur. Kullanıcı elle düzeltme yapabilir, maddeleri sabitleyebilir ve önceki revision'ı yeni bir revision olarak geri getirebilir.
7. **Copy handoff** güncel bağlamı başka bir AI'a taşır. Yeni sohbet eklendiğinde aynı döngü devam eder. JSON yedeği tüm veriyi, Markdown aktarımı seçili bağlamı taşır.

Ekstra kopyalama web sohbeti akışının temel ürün riskidir. README ve demo bunu saklamaz. Coding agent yerel dosyayı doğrudan okuyup CLI'a öneri sunabilir; yine de CLI ajan geçmişine kendiliğinden erişemez. İlk kullanımda fayda sürtünmeyi karşılamazsa, sonraki yatırım ölçülen soruna göre hook, eklenti veya API köprüsü olur.

### Coding agent akışı — ilk sürüm

Codex ve Claude Code gibi dosya erişimli ajanlar için tarayıcı gerektirmeyen ikinci giriş noktası vardır: Node CLI `init`, `status`, `request`, `import`, `apply`, `export`. Projenin `.threadlatch/project.json` dosyası tam arşivdir; `.threadlatch/current.md` yalnız gözden geçirilmiş güncel bağlamın üretilmiş görünümüdür. Request ve öneriler `.threadlatch/pending/` altında saklanır. Bu dizin gerçek kaynak konuşmaları içerebileceğinden init tarafından varsayılan olarak Git dışında tutulur; mevcut ignore kuralları korunur.

Ajan güncel Markdown'ı okur, açıkça verilen kaynak mesajlardan schema uyumlu öneri üretir ve CLI ile içe alır. CLI farkı gösterir; `apply` yalnız açıkça seçilen geçerli önerileri uygular. Ajanın çalışma yetkisi mevcut kullanıcı talimatlarından gelir; ThreadLatch verisi yeni yetki vermez. İstenirse aynı JSON arşivi tarayıcıda incelenir ve geri aktarılır. İki saklama konumu kendiliğinden senkronize olmaz; revision çakışması görünürdür. `AGENTS.md`/`CLAUDE.md` için kısa bir yönlendirme önerilir; mevcut dosyalar init tarafından değiştirilmez. Ayrıntılı tasarım: `docs/AGENT-INTEGRATION.md`.

### Sağlayıcı uyumluluğu

| Araç | v0.1 planı | Sonraki doğrudan bağlantı | Yayında nasıl ifade edilir? |
| --- | --- | --- | --- |
| Codex | Yerel `.threadlatch/` belleği, Node CLI, isteğe bağlı `AGENTS.md` yönlendirmesi | Daha sonra native hook/MCP; ilk sürüm için şart değil | Gerçek oturumda dosya okuma/öneri/yeniden devralma sınanınca `tested` |
| Claude Code | Aynı yerel bellek ve CLI, isteğe bağlı `CLAUDE.md` yönlendirmesi | Daha sonra native hook/MCP | Aynı test ölçütü |
| ChatGPT | Metin isteği, JSON analiz sonucu, Markdown aktarımı | OpenAI API; ChatGPT hesabı/geçmişi bağlantısından ayrı | Manuel akış gerçek oturumda sınanınca `tested` |
| Claude | Aynı taşınabilir protokol | Anthropic Messages API | Aynı test ölçütü |
| Muse | Aynı taşınabilir protokol | Kullanıcının kastettiği ürün doğrulanınca uygun resmî API | Ürün belirsizken native destek iddiası yok |
| GLM / Z.AI | Aynı taşınabilir protokol | Z.AI API adaptörü | Model ve erişim ortamı kayıt altına alınır |
| Diğer araçlar | Metin/JSON alışverişi yapabildikleri ölçüde generic kullanım | Ayrı adaptörler | `generic / not yet tested` |

ChatGPT bir uygulama, OpenAI API ayrı bir arayüzdür; GLM ise farklı uygulamalar üzerinden sunulabilecek bir model ailesidir. Bunlar tek bir “bağlantı” olarak sunulmayacak. Sağlayıcının JSON üretmesi tek başına anlamsal güvenilirlik sağlamaz. Erişim/hesap/bölge şartları ilgili sağlayıcıya aittir.

Muse adı için Meta'nın Muse ürününü çalışma varsayımı olarak alıyoruz; adın başka ürünlerde de kullanılması nedeniyle gerçek hedef doğrulanmadan ürüne özel bağlantı yazılmayacak. Bu belirsizlik genel metin aktarımı özelliğini durdurmaz.

### Kapsam dışı

v0.1: otomatik sohbet izleme, platform hesabına giriş, resmî olmayan özel endpoint'ler, bütün platform export formatlarını destekleme iddiası, web'de iddia doğrulama, vektör veritabanı, ekip hesabı, cihazlar arası senkronizasyon, ödeme, mobil uygulama ve tarayıcı eklentisi içermez. Dosya veya görsel içindeki içeriği çözümlemez; yalnızca metin alır. Uygulama bütün kör noktaları bulduğunu veya AI davranışını zorunlu olarak değiştirdiğini iddia etmez.

## Davranış ve veri sözleşmesi

### Temel tipler

`src/core/schema.ts` Zod tanımlarının tek kaynağıdır; TypeScript tipleri buradan türetilir. Paylaşılan şema `schemaVersion: 1` kullanır. Taşınabilir isteğin/satıra ait bütün kimlikleri uygulama üretir; model yalnızca kendisine verilen kimlikleri referanslayabilir.

- `Message`: `id`, `conversationId`, `ordinal`, `role` (`user | assistant | unknown`), `text`. Görülen zaman bilgisi isteğe bağlı metadata'dır, karar yetkisi değildir.
- `Conversation`: `id`, `projectId`, `title`, `parentRevisionId`, `importFingerprint`, `messages`. Kaynak içe alındıktan sonra metni değişmez; düzeltme ayrı import oluşturur.
- `Evidence`: `messageId`, `quote`. Uygulama eşleşen konumları türetir. Aynı alıntı birden çok yerdeyse kullanıcıya hepsi gösterilir; modelin karakter offset'ine güvenilmez.
- `MemoryItem`: `id`, `kind` (`decision | constraint | assumption | open_question | context`), `text`, `status` (`active | proposed | superseded | rejected | resolved`), `origin` (`user_statement | assistant_suggestion | inference | manual`), `evidence`, `supersedesItemId`, `pinned`.
- `Revision`: `id`, `parentRevisionId`, `projectId`, `items`, `createdAt`, `actor` (`reviewed_ai | manual | restore`). Snapshot'lar önceki revision'ı değiştirmez.
- `AnalysisRequest`: `schemaVersion`, `requestId`, `projectId`, `baseRevisionId`, `selectedMessages`, `currentItems`. Yalnızca kullanıcının seçtiği metin girer.
- `ProposalBatch`: `schemaVersion`, `requestId`, `baseRevisionId`, `changes`.
- `ProposedChange`: `proposalId`, `operation` (`add | supersede | resolve | reject | conflict`), `targetItemId` (eklemede null), `item` (yeni içerik gerektirmiyorsa null), `evidence`, `note`. Model iç nesneleri veya ek alanları keyfî biçimde genişletemez.
- `Conflict`: hedefler, alıntılar ve kısa açıklama. Çözümlenmeden önceki güncel kararı silmez; handoff'ta çözümlenmemiş olarak gösterilir.
- `ProjectArchive`: `schemaVersion`, proje metadata'sı (`currentRevisionId` dahil), konuşmalar, revision'lar ve pending request/proposal'lar. CLI ve web aynı şemayı kullanır. Geri yükleme ID çakışması durumunda yeni proje olarak açılır ve iç referanslar tutarlı biçimde yeniden eşlenir.

### İşleme kuralları

- Rol işaretleri açıkça desteklenen biçimdeyse ayrıştırılır; kod bloğundaki `User:` gibi metinler rol sınırı sayılmaz. Belirsizlikte rol tahmin edilmez. Önizlemede kullanıcı bölebilir ve rol atayabilir.
- `importFingerprint` proje, kaynak metin ve seçilen başlangıç revision'ına bağlıdır. Aynı import ikinci kez eklenmez. Tek bir metin içinde tekrar edilen aynı cümleler korunur; cümle hash'iyle mesaj silinmez.
- Model çıktısında bir adet JSON nesnesi veya bunu çevreleyen tek JSON code fence kabul edilir. Kesilmiş veri otomatik tamamlanmaz, `eval` kullanılmaz. Şema, boyut, request kimliği, hedef madde ve kaynak referansları doğrulanır.
- Kaynağı bulunamayan değişiklik uygulanabilir listeye girmez. Eşleşen alıntı bulunması anlamın doğru çıkarıldığını garanti etmez; arayüz buna “source matched” der.
- Asistanın teklifi veya bilinmeyen role ait bir ifade varsayılan olarak `proposed` olur. `active` karara terfi için açık kullanıcı dayanağı veya görünür manuel düzenleme gerekir. “Tamam” gibi bağlama bağlı onay kesin bir hedefe bağlanamıyorsa açık soru kalır.
- Bir şeyin örnek olduğu açıkça söylendiğinde örnekteki ayrıntılar aktif karar olmamalıdır. Bir varsayımın tekrarlanması onu doğrulanmış bilgi yapmaz. “Yaptım” ifadesi bağımsız doğrulama sayılmaz; durum raporu olarak ele alınır.
- Son konuşulan şey otomatik olarak kazanmaz. Aynı dalda açık düzeltme `supersede` önerisi olabilir; farklı dallarda çelişki kullanıcıya kalır. Kullanıcı düzeltmesi ve `pinned` madde sessizce ezilmez.
- Ekleme, supersede ve çözümleme bir seçili değişiklik grubu olarak atomik kaydedilir. Aynı `requestId + proposalId` tekrar uygulanamaz. Bayat `baseRevisionId` ile gelen paket yeniden analiz gerektirir.
- Elle değiştirilen metnin eski alıntısı yeni metnin doğrulaması diye sunulmaz; kaynak geçmişi saklanır ve yeni kayıt `manual` olarak işaretlenir.
- Girdi sınırı dosya veya yapıştırma başına UTF-8 olarak 1 MiB; analiz isteği en fazla 24.000 Unicode code point. Daha uzun içerik kesilmez: kullanıcı bölüm seçer ve kalan bölüm sayısı görünür. JSON yedek sınırı 10 MiB. Bunlar ürün sınırlarıdır; model token limitleri hakkında iddia değildir.
- Aktarım bütçesi 8.000 veya 24.000 Unicode code point. Güncel kısıtlar, kararlar ve açık çatışmalar önceliklidir. Zorunlu içerik bütçeyi aşarsa export durur ve kapsam daraltma ister. Diğer atlanan maddelerin sayısı ve kimliği gösterilir. İçerik sessizce düşürülmez.

### Gizlilik, dayanıklılık ve güvenlik

IndexedDB yerel saklamadır; şifreleme veya cihazlar arası yedek değildir. Private mode, tarayıcı temizliği ve origin değişimi veri kaybına yol açabilir; export görünür bir işlemdir. GitHub Pages proje yolları aynı kullanıcı alan adı altında ortak origin kullanabilir; bu nedenle depo başına IndexedDB adı kullanılsa da origin izolasyonu iddia edilmez. Ciddi kullanım için localhost veya ayrı origin önerilir.

Clipboard işlemi yalnızca tıklamayla başlar; izin verilmezse seçilebilir metin/download sunulur. Kaynak içerik plain text render edilir. Handoff Markdown dosyasında HTML kaçışlanır ve kaynak alıntıları “reference data” bölümünde tutulur. Uygulama hiçbir ithal talimatı çalıştırmaz; başka bir modelin prompt injection'a bağışıklığı garanti edilmez.

Şema doğrulaması recursive derinliği, metin ve liste boyutlarını sınırlar. Bilinmeyen sürüm ve eksik referanslar importtan önce reddedilir. IndexedDB kota veya transaction hatasında mevcut revision korunur. Çoklu sekmede revision karşılaştırması aynı transaction içinde yapılır. Proje silme konuşmaları, revision'ları ve pending analizleri kapsar; daha önce dışa aktarılan dosyaları silemez.

CLI dosya adaptörü bütün yazmaları seçilen proje sınırında tutar; path traversal ve dışarı çıkan symlink'leri reddeder. Güncelleme exclusive lock, expected revision karşılaştırması ve aynı dizinde geçici dosya üzerinden atomic replacement ile yapılır. Lock zaman aşımında mevcut veri değiştirilmez; stale lock otomatik silinmez, açık kurtarma yönergesi verilir. JSON kanonik kaynaktır; `current.md` hash/revision bilgili türetilmiş görünüm olur. İkincil görünüm üretimi kesilirse sonraki açılış bunu saptayıp kanonik arşivden yeniden üretir. Mevcut `AGENTS.md`/`CLAUDE.md` asla otomatik değiştirilmez. Tarayıcı ve Node import/export testleri aynı fixture'da eşit durumu üretmelidir.

### Arayüz ve erişilebilirlik

Üç ana görünüm: **Current memory**, **Review changes**, **Sources & history**. Başlangıç ekranı kaynaklı örnek proje ve tek bir import çağrısı sunar. Değişiklikler yalnız renklerle değil etiketlerle anlatılır. Klavye ile bütün akış tamamlanabilir; dialog focus yönetimi, erişilebilir form etiketleri, görünür hata mesajları ve küçük ekran düzeni gerekir. İngilizce/Türkçe metinler ayrı dosyalardadır; kullanıcının içeriği otomatik çevrilmez.

## Uygulama görevleri

Her görevde önce belirtilen davranışı yakalayan test yazılır, beklenen nedenle başarısızlığı görülür, uygulama yapılır ve ilgili testler geçince küçük bir commit alınır. Aşağıdaki npm script'leri mevcut değildir; Görev 1'de bu isimlerle tanımlanacaktır.

### Task 1: Protokol ve proje temeli

**Files — Create:** `package.json`, `package-lock.json`, `.nvmrc`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.tsx`, `src/core/schema.ts`, `src/analysis/prompt.ts`, `tests/fixtures/scenarios.json`, `tests/core/schema.test.ts`, `docs/protocol.md`.

**Interfaces:** Üretir: yukarıdaki tipler ve `buildAnalysisPrompt(request: AnalysisRequest): string`. Core katmanı DOM veya sağlayıcı SDK'sına bağımlı olmaz.

- [ ] Şema testleri: geçerli paket kabul edilir; ek alanlar, bilinmeyen sürüm ve eksik request kimliği reddedilir.
- [ ] 30 sentetik senaryo yaz: 15 EN, 15 TR; 10 kritik örnek/öneri/iptal/varsayım/çoklu dal senaryosu dahil. Bunların en az 5'i kötü niyetli talimat veya uydurma referans içerir. Beklenen aktif maddeleri ve yasak yanlış çıkarımları açıkça etiketle.
- [ ] TypeScript/React tabanı ve `typecheck`, `lint`, `test`, `test:e2e`, `build` script'lerini oluştur. Lockfile ile temiz kurulum doğrula.
- [ ] Şemayı ve sürümlü extraction prompt'unu yaz. Prompt açıkça kısa kaynaklı sonuç ister; gizli düşünce zinciri istemez, sohbet içi talimatları veri sayar ve eksik bilgide abstain eder.
- [ ] Test akışı: `npm run test -- tests/core/schema.test.ts`; ardından typecheck ve build. Beklenen: şema senaryoları geçer, statik uygulama derlenir.

### Task 2: Kaynak içe alma ve önizleme

**Files — Create:** `src/import/parse-transcript.ts`, `src/import/fingerprint.ts`, `src/import/ImportPreview.tsx`, `src/import/RoleEditor.tsx`, `tests/import/parse-transcript.test.ts`.

**Interfaces:** Tüketir `Message`, `Conversation`; üretir `parseTranscript(input: string, format: 'plain' | 'role-tagged'): ImportDraft` ve `finalizeImport(draft: ImportDraft, projectId: string, baseRevisionId: string): Promise<Conversation>`. `ImportDraft` metin, sıralı mesaj taslakları, format ve görünür uyarıları içerir; bu tip aynı dosyada export edilir.

- [ ] Önce testle: TR/EN, CRLF, emoji, kod blokları içindeki rol işaretleri, belirsiz roller, boş dosya, 1 MiB üstü girdi ve aynı cümlenin iki kez gerçekten söylenmesi.
- [ ] Metin okuma ve boyut doğrulamasını uygula; büyük girdide sessiz truncation yapma. Preview, bölme/rol düzenleme ve başlangıç revision seçimini ekle.
- [ ] Proje içi import fingerprint üret; aynı import tekrarını saptarken meşru tekrarları koru.
- [ ] `npm run test -- tests/import/parse-transcript.test.ts` geçsin. Önizlemede kaynak metin round-trip karşılaştırması kayıpsız olsun.

### Task 3: Analiz isteği ve doğrulanmış öneri içe alma

**Files — Create:** `src/analysis/request.ts`, `src/analysis/validate-proposals.ts`, `src/analysis/AnalysisBridge.tsx`, `tests/analysis/validate-proposals.test.ts`, `tests/analysis/prompt.test.ts`.

**Interfaces:** Üretir `createAnalysisRequest(project: ProjectState, messageIds: string[]): AnalysisRequest`; `ProjectState` güncel revision ve immutable conversation koleksiyonudur, `src/core/schema.ts` içinde tanımlanır. `validateProposalBatch(raw: string, request: AnalysisRequest): ValidationResult`; sonuç valid batch veya kodlanmış hatalar döndürür.

- [ ] Testle: yanlış request, yanlış revision, bilinmeyen hedef, bulunmayan alıntı, çoklu JSON, tek code fence, kesilmiş JSON, derin nesne, boş model cevabı/refusal ve HTML girdisi.
- [ ] Şema ile alıntı/ref doğrulamasını ayrı yap. Modelin user origin/active iddiasını kaynak rolüyle karşılaştır; yalnız asistan dayanaklı aktif kararları engelle.
- [ ] İstek önizlemesi, kopyala, cevap yapıştır ve anlaşılır düzeltme hatalarını ekle. Kopyalama fallback'i ve bölüm seçimi çalışsın.
- [ ] Senaryo fixture'ları üzerinden prompt'un örnek/öneri/varsayım ayrımını istemesini test et; prompt metni testinin model davranışını kanıtlamadığını eval notunda belirt.
- [ ] `npm run test -- tests/analysis` geçsin. Hata durumunda hiçbir revision oluşmasın.

### Task 4: Karar değişimi ve kontrollü birleştirme

**Files — Create:** `src/core/propose-diff.ts`, `src/core/apply-changes.ts`, `src/memory/ReviewChanges.tsx`, `src/memory/MemoryBoard.tsx`, `src/memory/SourceExcerpt.tsx`, `tests/core/apply-changes.test.ts`.

**Interfaces:** `proposeDiff(current: Revision, batch: ProposalBatch): ReviewDiff`; `applyChanges(current: Revision, batch: ProposalBatch, selectedProposalIds: string[]): Revision`. `ReviewDiff` added/changed/superseded/resolved/conflicts/blocked koleksiyonları ve kaynak referanslarını taşır; core şemasında tanımlanır.

- [ ] Kritik testler: örnek gereksinim olamaz; assistant önerisi kabul sayılmaz; açık iptal eski maddeyi supersede eder; dallar arası çelişki newest-wins olmaz; pinned madde ezilmez; aynı proposal iki kez uygulanmaz; belirsiz onay öneri kalır.
- [ ] Geçerli seçimleri yeni revision'a dönüştür; bağımlı supersession değişiklikleri eksik seçilirse işlem reddedilsin. Önceki revision değişmesin.
- [ ] Önce/sonra ve alıntıları göster; toplu seçime yalnız geçerli ve çelişkisiz değişiklikler girsin. Hata ve çatışmalar kaybolmasın.
- [ ] Manuel düzeltme, pin/unpin ve kaynak geçmişini ekle. Elle yapılan değişiklik `manual` provenance taşır.
- [ ] `npm run test -- tests/core/apply-changes.test.ts` geçsin; kaynak bağlantıları doğru mesaja gitsin.

### Task 5: Yerel kalıcılık, tarihçe ve veri kurtarma

**Files — Create:** `src/storage/db.ts`, `src/storage/projects.ts`, `src/history/HistoryView.tsx`, `src/storage/archive.ts`, `tests/storage/projects.test.ts`, `tests/storage/archive.test.ts`.

**Interfaces:** `saveRevision(projectId: string, expectedRevisionId: string, revision: Revision): Promise<void>`; `restoreRevision(projectId: string, selectedRevisionId: string, expectedRevisionId: string): Promise<Revision>`; `exportArchive(projectId: string): Promise<ProjectArchive>`; `importArchive(raw: string): Promise<string>`.

- [ ] Testle: kalıcı kaydet/yükle; eski revision geri getirme; kota/transaction hatasında rollback; iki sekmede optimistic revision çakışması; aynı update tekrarının reddi.
- [ ] Revizyonları, kaynakları, request'leri ve uygulanmış proposal kimliklerini atomik transaction ile sakla. Silme ve history restore işlemlerini uygula.
- [ ] Yedekleri önce tamamen doğrula; kısmi geri yükleme yapma. Bilinmeyen sürümü reddet; aynı projeyi tekrar getirince ayrı bir projede ID referanslarını koru.
- [ ] `npm run test -- tests/storage` ve gerçek tarayıcıda reload testi geçsin. Fake IndexedDB testleri gerçek tarayıcı testinin yerine geçmesin.

### Task 6: Handoff ve global kullanım

**Files — Create:** `src/export/handoff.ts`, `src/export/ExportPreview.tsx`, `src/i18n/en.ts`, `src/i18n/tr.ts`, `src/i18n/index.ts`, `tests/export/handoff.test.ts`, `tests/i18n/keys.test.ts`.

**Interfaces:** `buildHandoff(revision: Revision, options: { maxCodePoints: 8000 | 24000; includeEvidence: boolean }): HandoffResult`; sonuç `text`, dahil/atlanan item kimlikleri veya bütçe hatasıdır. Kaynak alıntıları referans verisi olarak sınırlandırılır; otomatik talimat yetkisi kazanmaz.

- [ ] Testle: superseded/rejected maddeler aktif listede yok; unresolved conflict açık; TR/emoji kesilmez; zorunlu içerik bütçeye sığmıyorsa export başarısız; isteğe bağlı eksiltme görünür; Markdown/HTML kaçışları güvenli.
- [ ] Kaynak kimlikleri ve kısa alıntılarla aktarım oluştur. Tam geçmiş yalnız JSON backup'tadır; küçük handoff tam yedek diye sunulmasın.
- [ ] EN/TR UI anahtar eşitliği, dil tercihi, clipboard fallback ve dosya indirmeyi ekle. Kullanıcı içeriğinin dilini koru.
- [ ] `npm run test -- tests/export tests/i18n` geçsin. Başka bir sohbete aktarılabilir metin manuel incelensin.

### Task 7: Node CLI ve coding-agent dosya akışı

**Files — Create:** `src/cli/index.ts`, `src/cli/commands.ts`, `src/storage/file-projects.ts`, `src/agents/instruction-hints.ts`, `tsconfig.cli.json`, `tests/cli/commands.test.ts`, `tests/storage/file-projects.test.ts`, `tests/agents/roundtrip.test.ts`. **Modify:** `package.json`, `docs/AGENT-INTEGRATION.md`.

**Interfaces:** `runCli(argv: string[], io: CliIO): Promise<number>`; `CliIO` giriş/çıkış/hata stream'leri ve `cwd` içerir. `FileProjectRepository.load(projectDir: string): Promise<ProjectArchive>`; `save(projectDir: string, expectedRevisionId: string, archive: ProjectArchive): Promise<void>`. Aynı Görev 1–6 şema, parser, validator, merge ve export fonksiyonları kullanılır; CLI bunların ikinci uygulamasını yazmaz.

- [ ] Önce testle: boş dizinde init, var olan bellekte ikinci init'in reddi, status'un yazmaması; Unicode/boşluklu Windows ve Unix yolları; var olan ignore/agent dosyalarının korunması; symlink/path escape, lock çakışması, bozuk JSON ve eski revision'da mevcut arşivin korunması.
- [ ] `init --project <dir>` başlangıç arşivi/current görünümü yaratır; hedef repo kökündeki `.gitignore` kurallarını koruyarak yalnız `.threadlatch/` ignore satırını güvenli biçimde ekler. `AGENTS.md` ve `CLAUDE.md` için yalnız isteğe bağlı metin önerisi yazdırır. Yeni proje dışına dosya yazılmaz.
- [ ] `status --project <dir>` güncel revision ve sayıları gösterir. `request --project <dir> --input <path> --format plain|role-tagged` açık kaynak girdisinden request'i kaydeder ve model prompt'unu stdout'a verir; ağ isteği yapmaz.
- [ ] `import --project <dir> --request <id> --input <path>` proposal'ı doğrular, pending olarak kaydeder ve farkı gösterir. `apply --project <dir> --request <id> --select <proposal-id,...>` yalnız açık seçimleri lock/revision kontrolüyle uygular; belirsiz/boş seçim hiçbir şeyi değiştirmez.
- [ ] `export --project <dir> --format markdown|json` çıktıyı stdout'a verir. CLI success `0`, doğrulama/kullanım hatası `2`, IO/lock hatası `3` döndürür. Hiçbir komut shell/eval veya uzak provider erişimi açmaz; hata logları kaynak metni basmaz.
- [ ] `build:cli` çıktısını `dist-cli/` altına üret; package `bin.threadlatch` buraya işaret etsin. `build` CLI build'inden sonra Vite web build'ini çalıştırsın ve `--base` parametresini web build'ine aktarsın. `dist/` yalnız web asset'leri içersin.
- [ ] `npm run test -- tests/cli tests/storage/file-projects.test.ts tests/agents` geçsin. Tam akışı spawned Node process üzerinden test et: init → request → fixture proposal import → seçili apply → export → browser archive import/export → CLI'da aynı revision/madde kümesini doğrula. Paralel iki process'te tek kazanan, diğerinde görünür revision/lock hatası olsun.
- [ ] Gerçek Codex ve Claude Code oturumlarında mevcut yetkili erişimle tarayıcısız okuma → öneri → doğrulanmış apply → sonraki oturuma devir testini yap; sürüm/tarih/sonuçları kaydet. Erişim yoksa pending ve untested olarak bırak; komutların yerel process testi yine zorunludur.

### Task 8: Gerçek kullanım, güvenlik ve erişilebilirlik doğrulaması

**Files — Create:** `playwright.config.ts`, `tests/e2e/roundtrip.spec.ts`, `tests/e2e/privacy.spec.ts`, `tests/e2e/recovery.spec.ts`, `tests/e2e/accessibility.spec.ts`, `docs/evaluations/compatibility.md`.

**Interfaces:** Önceki görevlerin kullanıcı akışını gerçek tarayıcı üzerinden sınar; yeni provider bağımlılığı eklemez.

- [ ] E2E: proje oluştur → transcript getir → fixture model cevabını yapıştır → review → save → reload → yeni konuşmadan düzelt → farkı kaydet → handoff → yedek → sil → geri yükle.
- [ ] E2E: iki sekme yarışı, kota hatası, bozuk yedek, silinen kaynak, büyük girdi ve history restore. Hiçbiri eski belleği sessizce ezmesin.
- [ ] Network testi: statik dosyalar yüklendikten sonra import/review/export sırasında beklenmeyen ağ isteği olmasın. XSS örnekleri metin olarak kalsın; dış resim yüklenmesin.
- [ ] Klavye, focus, kontrast ve 390px/1280px düzen kontrolü; EN/TR kritik akışları gerçek browser'da dene. Otomatik erişilebilirlik denetimi ve manuel klavye kontrolünü birlikte yap.
- [ ] Erişim olan sağlayıcılarda 30 senaryoyu üçer kez dene. Sıra: ChatGPT, Claude, Muse, GLM. Yalnız mevcut ve yetkili erişimi kullan; yeni üyelik veya ödeme gerektiren testleri pending bırak. Tarih, araç/model, prompt sürümü, geçerli JSON oranı, kanıt geçerliliği ve kritik yanlış terfileri kaydet; sentetik veri kullan.
- [ ] Canlı testte 30 senaryodan en az 27'sinde beklenen madde kümesi doğru; 10 kritik senaryoda üç tekrarda da hatalı aktif-karar terfisi yok; tüm otomatik kaynak/şema güvenlik testleri geçiyor ise provider `tested` olabilir. Bunlar release eşikleridir, evrensel doğruluk oranı değildir. Başaramayan provider `experimental` kalır.
- [ ] En az iki araç arasında handoff dene: alıcıdan yalnız güncel kararları ve açık soruları listelemesini iste; eski kararları geri getirmesin. Erişim yoksa README açıkça `not yet tested` desin.
- [ ] `npm run test:e2e` geçsin; kalan manuel test ve erişim eksikleri uyumluluk matrisinde açıkça yer alsın. Sınanmayan kullanım sınanmış diye yayınlanmasın.

### Task 9: Public GitHub hazırlığı ve v0.1 çıkışı

**Mevcut durum:** Tanıtım sayfası, README'ler, MIT lisansı ve manuel Pages workflow'u hazırlanmıştır. Aşağıdaki kalan uygulama yayın işlerini mevcut dosyalarla birleştirin; tamamlanmış altyapıyı yeniden oluşturmayın.

**Files — Create:** `README.md`, `README.tr.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`, `.gitignore`, `.github/ISSUE_TEMPLATE/bug.yml`, `.github/ISSUE_TEMPLATE/feature.yml`, `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, `docs/PRIVACY.md`, `docs/ROADMAP.md`, `public/demo-project.json`.

**Interfaces:** Sürüm verilmiş kaynak kodu, statik demo ve açık destek matrisi. Demo yalnız sentetik proje verisi kullanır. Security contact için mevcut repo sahibinin güvenli bildirim kanalı doğrulanır; uydurma e-posta yazılmaz.

- [ ] README: bir cümle değer önerisi, kısa demo, gerçek kopyala/yapıştır adımları, lokal kurulum, destek seviyesi, saklama/yedek bilgisi, sınırlamalar, lisans ve katkı rehberi. İngilizce ana belge, Türkçe karşılık.
- [ ] Kurulum script'lerini ve CI'ı temiz checkout üzerinde sınanabilir hale getir. CI: `npm ci`, `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`, `npm run test:e2e`. Actions bağımlılıklarını doğrulanmış SHA'ya sabitle; PR workflow'unda en az izin, secrets yok.
- [ ] Vite base path ve asset URL'lerini gerçek repo adına göre ayarla. GitHub Pages public statik demo için seçildi; bu uygulama ticari SaaS olursa farklı hosting seç. Tarayıcı path yenilemesini hash navigation veya tek route ile sorunsuz yap.
- [ ] Deploy workflow'u varsayılan olarak manuel olsun. PR CI yayın yapmaz. Yayın öncesi hedef remote ve yayın kapsamını doğrula; eksik repository ayarı veya erişim bağımlılığını raporla. Canlı demo için Pages kullanılabilirliği ayrıca kontrol edilir.
- [ ] Gerçek sohbet, secret, kişisel dosya ve makine yolu sızıntısı açısından commit kapsamını incele. Demo ekran kaydında sentetik veri kullan.
- [ ] Yayın öncesi Definition of Done'u değerlendir. Etiket `v0.1.0`; release notes kapsamı, sınırlamaları ve sınanan provider'ları belirtir. Kodun public olması tek başına ürünün test edildiği anlamına gelmez.

## Definition of Done

- Temiz clone'dan belgelenmiş komutlarla kurulur; CI geçer ve statik build çalışır.
- Sentetik bir projenin kararları çıkarılabilir, kaynakları incelenebilir, sonraki değişiklikler karşılaştırılabilir ve yeni AI sohbetine aktarılabilir.
- Codex/Claude Code için Node CLI ve dosya akışı tarayıcı açmadan kullanılabilir; gerçek ajan testlerinin yapılma durumu ayrı raporlanır. CLI ve web aynı archive şemasını, kaynak kontrolünü ve merge semantiğini kullanır.
- İptal edilen karar aktif listeden kalkar; örnekler ve asistan önerileri kendiliğinden aktif kullanıcı kararına dönüşmez.
- Aktif, superseded, proposed ve unresolved ayrımı UI ve export'ta aynıdır; manuel düzeltmeler korunur.
- Kaynak/ref doğrulaması, yedek round-trip, çoklu sekme yarışı ve veri kaybı testleri geçer.
- EN/TR arayüz, gerçek klavye akışı ve mobil genişlik çalışır.
- Ana akış uygulama sunucusuna veya uygulamaya özel API anahtarına ihtiyaç duymaz; AI sağlayıcısına kullanıcının gönderdiği içerik ayrıca görünür.
- Uyumluluk matrisi test edilen ve yalnız hedeflenen araçları ayırır. En az ChatGPT gerçek akış testi yapılmadan ChatGPT-tested iddiası yoktur. Erişim yoksa sürüm `preview` olarak etiketlenir.
- MIT lisansı, public dokümantasyon, katkı rehberi ve sentetik demo hazırdır. Doğrudan provider bağlantısı veya otomatik sohbet izleme iddiası yoktur.

## Sonraki sürümler ve karar eşikleri

1. **v0.2 — daha az kopyalama:** En az 5 dış kullanıcıdan kullanım gözlemi al. Bir haftada en az 3 kişinin aynı projede ikinci güncelleme yapması değer hipotezini destekleyen ilk işarettir; istatistiksel doğrulama sayılmaz. En büyük sürtünme analiz döngüsüyse OpenAI/Anthropic/Z.AI ve doğrulanmış Muse hedefi için yerel BYOK köprüsü araştır. Anahtarlar statik frontend'e gömülmez; CORS veya endpoint uyumsuzluğu için keyfi açık proxy kurulmaz. Anahtar yalnız local süreçte, request body/log/repo dışında tutulur. Maliyet önizlemesi ve bilinçli gönderim gerekir. Model ID'leri implementasyon gününde belgelerle doğrulanır, konfigüre edilir.
2. **v0.3 — daha kolay sohbet getirme:** İhtiyaca göre kullanıcı tıklamasıyla çalışan eklenti; ilk iki adaptör ChatGPT ve Claude. Yalnız active tab, minimum izin, DOM değişimine fixture ve seçili metin fallback'i. Otomatik arka plan toplama varsayılan değildir. Gerçek export formatı desteği örnek fixture ve format testinden sonra eklenir.
3. **v0.4 — otomatik ajan bağlantıları:** v0.1'deki dosya/CLI akışının üzerine, istemci uyumluluğu doğrulanınca MCP veya native hook ile kaynaklı bellek okuma ve öneri gönderme. Okuma/yazma yetkisi, proje kapsamı ve audit açık olur. MCP desteği bütün ürünlerde varmış gibi sunulmaz. Model belleği sessizce değiştiremez.
4. **Daha sonra:** Şifreli yedek, cihazlar arası sync ve ekip özellikleri ancak gerçek taleple. Bunlar mevcut local storage'ın şifreli olduğu anlamına gelmez.

Global tanıtım için ilk teslim İngilizce README, kısa sentetik demo ve gerçek uyumluluk tablosudur. Geri bildirim GitHub Issues/Discussions üzerinden gönüllü gelir; sohbet içeriği toplanmaz.

## Şimdi bilinen bağımlılıklar ve belirsizlikler

| Konu | Çözüm / durum |
| --- | --- |
| Repo URL'si | `https://github.com/deAYS/threadlatch`; geliştirmeye başlamadan önce en güncel varsayılan dal okunmalıdır. |
| Muse'un hangi ürünü olduğu | Genel aktarımı etkilemez. Native adaptör öncesinde ürün kimliği doğrulanacak. |
| API ve hosting maliyeti | v0.1 uygulaması API çağırmaz. Kullanıcının kullandığı AI servisinin şartları/limitleri devam eder. Statik hosting sınırları aşılırsa plan yeniden değerlendirilir. |
| Ürün değeri | Özellikle manuel köprünün sürtünmesi henüz sınanmadı. Önce en küçük tam döngü, ardından entegrasyon yatırımı. |
| Model çıkarım doğruluğu | Kaynak kontrolü ve kullanıcı incelemesi hataları sınırlar; anlam doğruluğunu garanti etmez. Fixture/eval raporu gerekir. |
| Saklama ve taşıma | Yerel veri otomatik yedeklenmez. Origin değişiminden önce JSON export gerekir. |
| İsim ve marka | `threadlatch` öneridir; domain/marka/paket adı hakkı iddiası yok. Başlangıçta domain veya package name bağımlılığı yok. |

## Araştırma dayanağı

Bu kaynaklar 2026-10-27 tarihinde incelendi. Aşağıdaki bilgiler tasarımın uygulanabilirliğini destekler; entegrasyonların çalıştığına dair canlı test değildir.

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs): JSON Schema tabanlı çıktı ve refusal/incomplete durumları. Gelecekteki OpenAI adaptörü için; ChatGPT sohbet geçmişi erişimi sağlamaz.
- [Codex AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md) ve [Claude Code memory](https://code.claude.com/docs/en/memory): repo talimat dosyaları üzerinden dosya tabanlı ajan akışının dayanağı. Bu talimatlar erişim yetkisi veya davranış garantisi değildir; gerçek entegrasyon testinin yerini tutmaz.
- [Claude Structured Outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs): şemalı çıktı ve sınırları. Native adaptör API sözleşmesini ayrıca ele almalıdır.
- [Z.AI Quick Start](https://docs.z.ai/guides/overview/quick-start): OpenAI SDK ile Z.AI endpoint kullanımını belgeliyor. Bu, tüm özelliklerin birebir uyumlu olduğu anlamına gelmez.
- [Meta Model API models](https://dev.meta.ai/docs/models): Muse model ailesi için resmî model/API bilgileri. Kullanıcının kastettiği ürün kimliğinin ayrıca belirlenmesi gerekir.
- [Vite Getting Started](https://vite.dev/guide/): Node.js uyumluluk gereksinimleri ve statik uygulama tabanı.
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): statik public demo seçimi ve hosting sınırları. Ticari SaaS hosting'i olarak kullanılmaması gerekir.
- [ThreadKeep help](https://getthreadkeep.io/threadkeep/help): benzer ürünlerde bağlam paketi, manuel import ve değişiklik karşılaştırmasının bulunduğuna dair birincil kaynak. Bu plan özgünlük iddiasında bulunmaz; ayrışma hipotezi gerçek kullanıcılarla sınanır.

## Plan özdenetimi

- Ürün kapsamı Görev 1–9'a dağıtıldı; core kontrat, kaynak doğrulama ve revision semantiği UI'dan önce gelir. Codex/Claude Code için v0.1 CLI kapsamı entegrasyon belgesinde tanımlıdır.
- Review Focus'taki beş risk ilgili test görevlerine bağlandı. Otomatik test, manuel UX kontrolü ve gerçek model eval'i ayrı tutuldu.
- Uygulama dosyaları önerilen yollardır; tamamlanan tanıtım/yayın altyapısı ayrıca belirtilmiştir. Henüz uygulanmayan script veya entegrasyonların çalıştığı iddia edilmez.
- Şema/proposal, revision, import, export ve storage arabirim adları görevler arasında tutarlıdır.
- Gerçek provider erişimi ve uyumluluk testi sonuçları, uygulama sırasında doğrulanacak dış bağımlılıklardır.

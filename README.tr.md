# ThreadLatch

**AI sohbetlerindeki kararları, düzeltmeleri ve açık soruları kaynaklarıyla takip et; güncel bağlamı yanında taşı.**

[Proje sayfası](https://deays.github.io/threadlatch/) · [Yol haritası](docs/ROADMAP.md) · [English](README.md)

> **Durum: geliştirme aşamasında.** Şu an repoda proje tanıtımı, uygulama planı ve yayın altyapısı bulunuyor. Uygulama ve sağlayıcı uyumluluk testleri henüz tamamlanmadı.

ThreadLatch; değişen kararları, iptal edilen talepleri, önerileri ve açık soruları birbirinden ayırmak için tasarlanıyor. Her kaydın hangi mesaja dayandığı ve sonraki konuşmalarda nasıl değiştiği görülebilecek.

İlk sürümün akışı: sohbet getir → analiz isteğini kullandığın AI'a gönder → dönen JSON'u getir → değişiklikleri kaynaklarıyla incele → kaydet → güncel bağlamı Markdown, tam yedeği JSON olarak aktar.

Veriler kullanılan arayüze göre yerel proje dosyalarında veya tarayıcıda saklanacak; ilk sürüm uygulamaya özel API anahtarı veya hesap gerektirmeyecek. Analizi yaptırdığın AI servisinin kendi hesap, ücret ve kullanım şartları devam eder. Yerel saklama şifreli yedek veya cihazlar arası senkronizasyon anlamına gelmez.

Ürün yalnızca tarayıcı için değildir. İlk sürümde ortak bir çekirdek üzerinde Codex ve Claude Code için yerel proje dosyaları ve Node.js CLI; sohbet uygulamaları için de tarayıcı arayüzü ve ortak metin/JSON alışverişi planlanıyor. Coding agent belleği dosyadan okuyup güncelleme önerebilecek; tarayıcı açmak zorunlu olmayacak. CLI ve uygulama henüz uygulanmadı.

İlk sürüm kapsamına **Codex ve Claude Code skill'leri ile yönlendirmeli kurulum** da dahildir. Kullanıcı “bu kararı hatırla”, “kaldığımız yerden devam et” veya “son değişiklikleri göster” diyebilecek; dosya ve CLI adımlarını skill yönetecek. Kullanıcının JSON düzenlemesi gerekmeyecek. [Kolay başlangıç tasarımı](docs/ONBOARDING.md) bu hedefin kurulum ve test ölçütlerini açıklar. Skill ve kurulum aracı henüz yayınlanmadı.

Öncelikli hedefler Codex, Claude Code ve ChatGPT; ardından Claude, Muse ve GLM. Bunlar henüz doğrulanmış entegrasyonlar değildir. Otomatik sohbet okuma, hook, MCP ve native API bağlantıları sonraki aşamalardır. [Coding-agent tasarımı](docs/AGENT-INTEGRATION.md) aynı bellek formatının nasıl paylaşılacağını açıklar.

## Belgeler

- [Ayrıntılı uygulama planı](docs/superpowers/plans/2026-10-27-threadlatch.md)
- [Diğer geliştirme oturumu için devir notu](docs/SESSION-HANDOFF.md)
- [Pages yayın rehberi](docs/GITHUB-PAGES.md)
- [Gizlilik sınırları](docs/PRIVACY.md)

Proje tanıtımını yerelde açmak için: `python -m http.server 4173 --directory site`, ardından `http://localhost:4173`.

Public issue'larda sentetik örnekler kullan. Gerçek özel sohbetleri, token'ları veya anahtarları paylaşma.

[MIT lisansı](LICENSE). Bağımsız projedir; adı geçen sağlayıcıların sponsorluk veya onayı ima edilmez.

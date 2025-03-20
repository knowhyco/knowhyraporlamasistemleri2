# Knowhy Raporlama Sistemleri Kurulum ve Geliştirme Kontrol Listesi

## 1. Ön Hazırlık ve Ortam Kurulumu

- [ ] Proje klasör yapısı oluşturuldu (backend/, frontend/, docs/ vb.)
- [ ] Docker ve Docker Compose kurulumu yapıldı
- [ ] Node.js veya Python kurulumu yapıldı (seçilen backend teknolojisine göre)
- [ ] Gerekli geliştirme araçları kuruldu (npm/yarn/pip vb.)
- [ ] Supabase erişim bilgileri alındı SUPABASE_URL=postgresql://postgres.zvplfjuvhzrrnhhmqcmw:5KrMqLpAeUUIPXjm@aws-0-us-west-1.pooler.supabase.com:6543/postgres
- [ ] `.env` dosyası oluşturuldu ve örnek değerler eklendi

## 2. Veritabanı (Supabase) Yapılandırması

- [ ] Supabase bağlantı bilgisi: SUPABASE_URL=postgresql://postgres.zvplfjuvhzrrnhhmqcmw:5KrMqLpAeUUIPXjm@aws-0-us-west-1.pooler.supabase.com:6543/postgres
- [ ] Supabase tabloları ve yapısı "/home/ubuntu/scriptler/sql_bilgiler/21_sql_tablo_yapisi.md " dosyasından supabase de ki tablo bilgileri okundu.
- [ ] PostgreSQL tabloları tanımlandı:
  - [ ] Sistem tabloları (`knowhy_config`, `knowhy_users`, `knowhy_reports`, `knowhy_logs` vb.)
  - [ ] Mesaj/chat tablosu (örnek `customer_denizmuzesi` veya parametre ile belirlenecek tablo. bu tablo kullanıcı tarafından yazılacak ve supabase de böyle bir tablo varsa çekmeye başlayacak. Eğer tablo supabase de yoksa "böyle bir tablo yok" uyarısı verecek. Kullanıcının yazacağı tablo isminden yalnızca veriler çekilecek)
- [ ] Veritabanı erişim rolleri ve izinleri ayarlandı (sadece backend okuma izni)
- [ ] Veritabanı indeksleri oluşturuldu (performans için)
- [ ] SQL dosyaları `scriptler/sql_bilgiler` klasöründen alındı ve ve tüm sql scriptleri incelendi. Bu scriptler raporlama için önemli.

## 3. Backend Geliştirmesi

### 3.1. Temel Yapılandırma

- [ ] Backend framework seçildi (Flask veya Node.js/Express)
- [ ] Proje dosya yapısı oluşturuldu:
  - [ ] `controllers/` (route işleyicileri)
  - [ ] `services/` (iş mantığı)
  - [ ] `utils/` (yardımcı fonksiyonlar)
  - [ ] `sql_scripts/` (SQL sorguları)
  - [ ] `migrations/` (veritabanı geçişleri)
- [ ] Bağımlılıklar kuruldu ve yapılandırıldı (`requirements.txt` veya `package.json`)
- [ ] Ortam değişkenleri yapılandırması (`.env`)
- [ ] API middleware'leri yapılandırıldı (CORS)

### 3.2. Veritabanı Bağlantısı

- [ ] Veritabanı bağlantı istemcisi yapılandırıldı
- [ ] Bağlantı havuzu (connection pool) optimize edildi
- [ ] Veritabanı modellerini veya SQL sorgularını yükleme mekanizması kuruldu
- [ ] SQL dosyalarını okuma ve parametreleri değiştirme fonksiyonları yazıldı. sql scriptlerinin TAMAMI ALINDI. "/home/ubuntu/scriptler/sql_bilgiler" ve yeni sql scriptleri oluşturularak değişkenler eklendi.
- [ ] Örnek sorgu testleri yapıldı

### 3.3. Kurulum Sihirbazı

- [ ] Kurulum durumunu kontrol eden mekanizma yazıldı (`knowhy_config` tablosunda "IS_SETUP_DONE")
- [ ] Kurulum endpoint'leri oluşturuldu (`/api/setup`)
- [ ] Varsayılan admin hesabı (admin/admin123) ve sihirbaz ekranına yönlendirme mantığı yazıldı
- [ ] Sistem tabloları oluşturma SQL komutları hazırlandı
- [ ] Kurulum tamamlandığında normal moda geçiş mekanizması yapıldı

### 3.4. Kullanıcı Yönetimi

- [ ] Kimlik doğrulama (authentication) sistemi kuruldu (JWT/Session based)
- [ ] Kullanıcı kaydı, girişi, çıkışı endpoint'leri oluşturuldu
- [ ] Rol tabanlı yetkilendirme sistemi kuruldu (admin/user)
- [ ] Parola hashleme ve güvenlik önlemleri alındı (bcrypt/Argon2)
- [ ] Kullanıcı ban/pasif/aktif etme fonksiyonları yazıldı


### 3.5. Rapor Yönetimi

- [ ] Rapor listesi endpoint'i oluşturuldu (`GET /api/reports`)
- [ ] Rapor detayı ve parametreleri endpoint'i oluşturuldu (`GET /api/reports/:reportName`)
- [ ] Rapor çalıştırma endpoint'i oluşturuldu (`POST /api/reports/:reportName/run`)
- [ ] SQL dosyalarını okuma ve parametreleri değiştirme fonksiyonları yazıldı
- [ ] Rapor sonuçlarını JSON formatında döndürme fonksiyonları yazıldı
- [ ] Rapor ekleme/düzenleme/silme endpoint'leri oluşturuldu (admin için)
- [ ] SQL sorgu dosyalarını yükleme ve yönetme mekanizması yazıldı

### 3.6. Admin Fonksiyonları

- [ ] Tablo adı tanımlama ve güncelleme endpoint'i oluşturuldu
- [ ] Kullanıcı yönetimi endpoint'leri oluşturuldu (listeleme, ekleme, düzenleme, silme)
- [ ] Rapor yönetimi endpoint'leri oluşturuldu (listeleme, ekleme, düzenleme, silme)
- [ ] Log görüntüleme endpoint'i oluşturuldu
- [ ] Sistem ayarları yönetimi endpoint'leri oluşturuldu

### 3.7. Loglama Sistemi

- [ ] Uygulama logları yapılandırıldı (dosya/konsol)
- [ ] Kullanıcı eylemlerini loglama sistemi kuruldu
- [ ] Rapor çalıştırma logları yazıldı (kim, ne zaman, hangi parametrelerle)
- [ ] Admin eylemlerini loglama (kullanıcı ban, rapor ekleme vb.)
- [ ] Hata loglaması ve izleme mekanizmaları kuruldu

### 3.8. Gerçek Zamanlı Analiz

- [ ] WebSocket entegrasyonu yapıldı
- [ ] Gerçek zamanlı güncelleme kanalları tasarlandı
- [ ] Yeni mesaj geldiğinde ilgili rapor kanallarına bildirim gönderme sistemi kuruldu
- [ ] Socket bağlantı yönetimi ve ölçeklendirme (birden fazla sunucu için) yapıldı

## 4. Frontend Geliştirmesi

### 4.1. Temel Yapılandırma

- [ ] Frontend framework seçildi (React)
- [ ] Proje yapısı oluşturuldu:
  - [ ] `components/` (UI bileşenleri)
  - [ ] `pages/` (sayfa bileşenleri)
  - [ ] `services/` (API istemcileri)
  - [ ] `context/` veya `store/` (durum yönetimi)
  - [ ] `hooks/` (özel React hook'ları)
  - [ ] `utils/` (yardımcı fonksiyonlar)
- [ ] Bağımlılıklar kuruldu (`package.json`)
- [ ] Stil kütüphanesi seçildi ve yapılandırıldı (Tailwind/Material UI/Bootstrap)
- [ ] Grafik kütüphanesi seçildi ve yapılandırıldı (Chart.js/Recharts/ECharts)
- [ ] Routing yapılandırması yapıldı
- [ ] API istemcisi oluşturuldu (axios/fetch)
- [ ] Ortam değişkenleri yapılandırıldı (`.env.development`, `.env.production`)

### 4.2. Yetkilendirme ve Oturum Yönetimi

- [ ] Login formu oluşturuldu
- [ ] Kayıt formu oluşturuldu
- [ ] JWT token saklama ve API isteklerine ekleme mekanizması yazıldı
- [ ] Yetkisiz erişim koruması için Route Guard oluşturuldu
- [ ] Rol bazlı bileşen gösterimi yapıldı (admin/user)
- [ ] Token süresi dolduğunda yenileme mekanizması yazıldı
- [ ] Çıkış yapma işlevi eklendi

### 4.3. Kurulum Sihirbazı Arayüzü

- [ ] Kurulum durumunu kontrol eden mekanizma yazıldı
- [ ] Adım adım sihirbaz arayüzü tasarlandı:
  - [ ] Admin bilgileri formu
  - [ ] Tablo adı formu
  - [ ] Varsayılan raporlar seçimi
- [ ] Kurulum tamamlandığında raporlar çekilip, gerekli scriptlere yazılan tablo adını tanımlandı ve ilk sorgulamalar çalıştır ardından kullanıcı dashboard'a yönlendirme yapıldı

### 4.4. Admin Paneli

- [ ] Admin dashboard arayüzü tasarlandı
- [ ] Kullanıcı yönetimi arayüzü oluşturuldu:
  - [ ] Kullanıcı listeleme
  - [ ] Kullanıcı ekleme/düzenleme
  - [ ] Kullanıcı ban/pasif etme
- [ ] Rapor yönetimi arayüzü oluşturuldu:
  - [ ] Rapor listeleme
  - [ ] Rapor ekleme/düzenleme
  - [ ] Rapor parametrelerini yönetme
- [ ] Tablo adı tanımlama arayüzü oluşturuldu
- [ ] Log görüntüleme arayüzü oluşturuldu

### 4.5. Kullanıcı Paneli

- [ ] Kullanıcı dashboard arayüzü tasarlandı (mini kartlar/grafikler/kullanıcı yönetimi)
- [ ] Rapor listesi sayfası oluşturuldu
- [ ] Rapor detay sayfası oluşturuldu:
  - [ ] Dinamik filtre formu oluşturma
  - [ ] Sorgu çalıştırma ve sonuçları gösterme
  - [ ] Tablo görünümü
  - [ ] Grafik görünümü (bar/line/pie vb.)
- [ ] İndirme seçenekleri eklendi (CSV/PDF/Excel)
- [ ] Sık kullanılanlar/favoriler özelliği eklendi (opsiyonel)

### 4.6. Görsel Tasarım ve UX

- [ ] Renk paleti ve tema oluşturuldu (koyu/açık mod desteği)
- [ ] Responsive tasarım yapıldı (mobil/tablet/masaüstü)
- [ ] Animasyonlar eklendi (Framer Motion/CSS transitions)
- [ ] Loading spinner/skeleton ekranları oluşturuldu
- [ ] Hata durumu gösterimleri tasarlandı
- [ ] Kullanıcı geri bildirimi için toast/notification bileşenleri eklendi
- [ ] Erişilebilirlik (a11y) kontrolleri yapıldı

### 4.7. Gerçek Zamanlı Güncelleme

- [ ] WebSocket veya SSE istemcisi kuruldu
- [ ] Gerçek zamanlı kanal aboneliği mekanizması yazıldı
- [ ] Tablo ve grafiklerin canlı güncellenmesi sağlandı
- [ ] Bildirim gösterimi için animasyonlar eklendi
- [ ] Bağlantı kopma/yeniden bağlanma durumları yönetildi

## 5. API Entegrasyonu ve Test

- [ ] Backend ve frontend API endpoint'leri eşleştirildi
- [ ] Test senaryoları oluşturuldu (birim testleri, entegrasyon testleri)
- [ ] API yanıt sürelerinin optimizasyonu yapıldı
- [ ] Hata yakalama ve işleme mekanizmaları test edildi
- [ ] Backend SQL sorgularının performans testleri yapıldı
- [ ] Yüksek yük testleri yapıldı (yüksek veri hacmi, çoklu istek vb.)
- [ ] Browser uyumluluğu testleri yapıldı

## 6. Güvenlik Önlemleri

- [ ] SQL injection koruması kontrol edildi
- [ ] XSS koruması kontrol edildi
- [ ] CSRF koruması kontrol edildi
- [ ] Rate limiting uygulandı
- [ ] Hassas bilgilerin (Supabase bağlantı bilgileri) güvenliği sağlandı
- [ ] JWT token güvenliği kontrol edildi
- [ ] HTTP güvenlik başlıkları eklendi (Helmet vb.)
- [ ] HTTPS yapılandırması kontrol edildi

## 7. Dağıtım (Deployment)

- [ ] Docker imajları oluşturuldu
- [ ] Docker Compose yapılandırması test edildi
- [ ] Üretim ortamı için ortam değişkenleri yapılandırıldı
- [ ] Sunucu güvenlik duvarı yapılandırıldı

## 8. Dokümantasyon

- [ ] API dokümantasyonu oluşturuldu (Swagger/OpenAPI)
- [ ] Kurulum ve yapılandırma rehberi yazıldı
- [ ] Kullanıcı rehberi hazırlandı
- [ ] Admin rehberi hazırlandı
- [ ] Geliştirici dokümantasyonu hazırlandı
- [ ] SQL sorgu açıklamaları eklendi
- [ ] Hata çözümleri ve troubleshooting rehberi eklendi

## 9. SQL Sorguları ve Raporlar

Eklemeniz gereken raporların tam listesi: 10_Konusma_Akisi_Analizi.md,11_Konusma_Derinligi_Analizi.md,12_Konusma_uzunluguna_gore_en_aktif_oturumlar.md,13_ornek_bir_oturum_konusma_takibi.md,14_Saatlik_Aktivite_Analizi.md,15_Secilen_oturumdaki_tüm_mesajlari_kronolojik_sirayla_listele.md,16_Session_Uzunlugu_ve_Kullanici_Sorulari_Arasindaki_İliski.md,17_Sistemin_Genel_ozeti.md,18_Son_24_saatteki_aktif_oturumlar.md,19_Son_bir_saatte_gelen_yeni_konusmalar.md,1_belirli_bir_gundeki_konusma_oturumlarini_listele.md,20_Soru-Cevap_ciftleri_Analizi.md,21_sql_tablo_yapisi.md,22_sql.md,23_Trend_Analizi_Konularin_Zaman_İcinde_Degisimi.md,24_Yanit_Suresi_Analizi.md,25_Yanit_verme_suresine_gore_oturumlar.md,26_Zaman_ve_Konu_İliskisi.md,27_Aylik_Trend_Analizi.md,28_Son_Istatistikler.md,2_Context_kullanan_yanitlar_dahil_detayli_oturum_gorunumu.md,3_Context_kullanim_istatistikleri.md,4_En_Sik_Sorulan_Sorular_Konular.md,5_Gunluk_Aktivite_ve_Etkin_Konusma_Saatleri.md,6_Gunluk_konusma_istatistikleri.md,7_Haftanin_Gunlerine_Gore_Aktivite_Dagilimi.md,8_Kelime_Kullanim_Matriksi.md,9_kelimeler.md,
TÜM SCRİPTLERİ İNCELEYİN VE RAPORLAMAYA EKLEYİN. EKSİKSİZ OLMALI.

### 9.1. Zaman Bazlı Analizler

- [ ] Son 24 saat aktif oturumlar raporu eklendi
- [ ] Son 1 saatteki yeni konuşmalar raporu eklendi
- [ ] Günlük/haftalık aktivite dağılımı raporu eklendi
- [ ] Saatlik aktivite analizi raporu eklendi

### 9.2. İçerik Analizleri

- [ ] Kelime kullanım matrisi raporu eklendi
- [ ] En sık sorulan sorular/konular raporu eklendi
- [ ] Context kullanım istatistikleri raporu eklendi
- [ ] Soru-Cevap çiftleri analizi raporu eklendi

### 9.3. Performans Metrikleri

- [ ] Yanıt süresi analizi raporu eklendi
- [ ] Oturum uzunluğu analizi raporu eklendi
- [ ] Konuşma derinliği analizi raporu eklendi
- [ ] Trend analizi raporu eklendi

### 9.4. Detaylı Görünümler

- [ ] Seçilen oturumdaki tüm mesajlar raporu eklendi
- [ ] Context kullanan yanıtlar raporu eklendi
- [ ] Örnek oturum takibi raporu eklendi
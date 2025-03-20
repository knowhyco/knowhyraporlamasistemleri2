# Knowhy Raporlama Sistemi

Knowhy Raporlama Sistemi, Supabase üzerinde saklanan mesajlaşma verilerini analiz etmek ve görselleştirmek için tasarlanmış bir araçtır.

## Özellikler

- Supabase veritabanı entegrasyonu
- Dinamik SQL sorguları
- Otomatik rapor oluşturma
- Görsel grafikler ve tablolar
- Duyarlı arayüz tasarımı
- Docker ile kolay kurulum

## Kurulum

### Gereksinimler

- Docker ve Docker Compose
- Supabase erişim bilgileri

### Adımlar

1. Projeyi klonlayın:
```bash
git clone https://github.com/kurumsalanaliz/knowhy-raporlama.git
cd knowhy-raporlama
```

2. Ortam değişkenlerini ayarlayın:
```bash
cp .env.example .env
```

3. `.env` dosyasını Supabase bağlantı bilgilerinizle düzenleyin.

4. Sistemi başlatın:
```bash
make setup
```

## Kullanım

Kurulum tamamlandıktan sonra, tarayıcınızdan `http://localhost:3000` adresini ziyaret edin.

### Raporlar

- Zaman Bazlı Analizler
- İçerik Analizleri
- Performans Metrikleri
- Detaylı Görünümler

## Komutlar

Sistem yönetimi için aşağıdaki komutları kullanabilirsiniz:

```bash
make start      # Sistemi başlatır
make stop       # Sistemi durdurur
make restart    # Sistemi yeniden başlatır
make build      # Sistemi yeniden oluşturur
make logs       # Logları görüntüler
make clean      # Tüm docker imajlarını ve hacimleri temizler
```

## Mimari

Sistem iki ana bileşenden oluşur:

1. **Backend (Flask)**
   - REST API
   - SQL sorgu işleme
   - Veritabanı bağlantısı

2. **Frontend (React)**
   - Kullanıcı arayüzü
   - Veri görselleştirme
   - Filtreleme ve raporlama

## Desteklenen Raporlar

Sistem, çeşitli analiz türlerini destekler:

- Son 24 saatteki aktif oturumlar
- Saatlik aktivite analizi
- Kelime kullanım analizi
- Konuşma derinliği analizi
- Yanıt süresi analizi
- Context kullanım istatistikleri
- Ve daha fazlası...

## Sorun Giderme

Genel sorunlar ve çözümleri için:

1. Bağlantı hataları: `.env` dosyasındaki Supabase bağlantı bilgilerini kontrol edin.
2. Docker sorunları: `docker-compose logs` ile logları inceleyin.
3. API hataları: Backend loglarını kontrol edin.

## Katkıda Bulunma

Geliştirme ortamı kurulumu:

1. Projeyi klonlayın
2. Bağımlılıkları yükleyin
3. Değişikliklerinizi yapın
4. Testleri çalıştırın
5. Pull request gönderin 
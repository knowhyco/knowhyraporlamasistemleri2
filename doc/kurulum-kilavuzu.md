# Kurulum Kılavuzu

Bu belge, Knowhy Raporlama Sistemi'nin kurulumunu adım adım açıklar.

## Ön Gereksinimler

Kuruluma başlamadan önce aşağıdaki yazılımlara ihtiyacınız olacak:

- Docker (>= 19.03.0)
- Docker Compose (>= 1.25.0)
- Git (>= 2.20.0)

## Kurulum Adımları

### 1. Projeyi İndirme

```bash
git clone https://github.com/kurumsalanaliz/knowhy-raporlama.git
cd knowhy-raporlama
```

### 2. Ortam Değişkenlerini Ayarlama

```bash
cp .env.example .env
```

`.env` dosyasını bir metin editörü ile açın ve gerekli değişkenleri ayarlayın:

```ini
# Supabase/PostgreSQL Bağlantı Bilgileri
SUPABASE_URL=postgresql://postgres.xxxxxxxxxxxx:password@aws-0-xx-xxxx.pooler.supabase.com:6543/postgres
SUPABASE_HOST=aws-0-xx-xxxx.pooler.supabase.com
SUPABASE_PORT=6543
SUPABASE_DATABASE=postgres
SUPABASE_USER=postgres.xxxxxxxxxxxx
SUPABASE_PASSWORD=your_password

# JWT ve Güvenlik
SECRET_KEY=your_secret_key
JWT_SECRET=your_jwt_secret

# Uygulama Ayarları
FLASK_ENV=development
REACT_APP_API_URL=http://localhost:8000/api
```

### 3. Docker İmajlarını Oluşturma ve Servisleri Başlatma

Makefile kullanarak tüm servisleri kurabilir ve başlatabilirsiniz:

```bash
make setup
```

Bu komut aşağıdaki işlemleri gerçekleştirir:
- Gerekli klasörleri oluşturur
- `.env` dosyasının varlığını kontrol eder
- Docker imajlarını oluşturur ve servisleri başlatır

### 4. Manuel Kurulum (Makefile Olmadan)

Makefile kullanmak istemiyorsanız, aşağıdaki komutları sırasıyla çalıştırabilirsiniz:

```bash
# Docker imajlarını oluşturma
docker-compose build

# Servisleri başlatma
docker-compose up -d
```

### 5. Kurulumu Doğrulama

Kurulumun başarılı olduğunu doğrulamak için aşağıdaki URL'leri ziyaret edin:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/health

## Sistem Yönetimi

### Servisleri Başlatma ve Durdurma

```bash
# Servisleri başlatma
make start

# Servisleri durdurma
make stop

# Servisleri yeniden başlatma
make restart
```

### Logları Görüntüleme

```bash
make logs
```

### Sistemi Temizleme

Tüm Docker kaynakları temizlemek için:

```bash
make clean
```

## Sorun Giderme

### Bağlantı Sorunları

Supabase bağlantı hatası alıyorsanız:

1. `.env` dosyasındaki bağlantı bilgilerini kontrol edin
2. Supabase'in erişilebilir olduğundan emin olun
3. Docker container'larını yeniden başlatın: `make restart`

### Docker Sorunları

Docker ile ilgili sorunlar için:

1. Docker servisinin çalıştığını kontrol edin: `docker info`
2. Docker imajlarını yeniden oluşturun: `make build`
3. Docker sistem bilgilerini kontrol edin: `docker system info`

### Backend Sorunları

Backend servisi çalışmıyorsa:

1. Backend loglarını kontrol edin: `docker-compose logs backend`
2. Python bağımlılıklarını kontrol edin
3. Flask uygulamasının çalıştığını doğrulayın

### Frontend Sorunları

Frontend servisi çalışmıyorsa:

1. Frontend loglarını kontrol edin: `docker-compose logs frontend`
2. React uygulamasının build sürecini kontrol edin
3. API URL'sinin doğru yapılandırıldığından emin olun

## Güvenlik Notları

- Üretim ortamı için `.env` dosyasını güvenli bir şekilde saklayın
- JWT secret ve diğer hassas bilgileri güçlü, rastgele değerlerle değiştirin
- Docker container'larının dış ağlara gereksiz erişimi olmadığından emin olun
- Üretim ortamında HTTPS kullanın 
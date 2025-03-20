# Proje Yapısı

Knowhy Raporlama Sistemi'nin dosya ve klasör yapısı aşağıdaki gibidir:

```
knowhy-raporlama/
├── backend/                  # Flask Backend
│   ├── app.py                # Ana uygulama 
│   ├── controllers/          # API endpoint kontrolörleri
│   ├── db.py                 # Veritabanı bağlantı yönetimi
│   ├── Dockerfile            # Backend Docker yapılandırması
│   ├── requirements.txt      # Python bağımlılıkları
│   ├── sql_helper.py         # SQL dosyalarını işleme fonksiyonları
│   ├── sql_scripts/          # SQL sorgu dosyaları
│   └── utils/                # Yardımcı fonksiyonlar
│
├── frontend/                 # React Frontend
│   ├── public/               # Statik dosyalar
│   ├── src/                  # Kaynak kodları
│   │   ├── components/       # Yeniden kullanılabilir bileşenler
│   │   │   ├── ReportSelector.jsx  # Rapor seçim bileşeni
│   │   │   └── ReportViewer.jsx    # Rapor görüntüleme bileşeni
│   │   ├── pages/            # Sayfa bileşenleri
│   │   │   └── ReportsPage.jsx     # Raporlar sayfası
│   │   ├── services/         # API bağlantıları
│   │   ├── context/          # React Context API
│   │   ├── hooks/            # Özel React hook'ları
│   │   └── utils/            # Yardımcı fonksiyonlar
│   ├── Dockerfile            # Frontend Docker yapılandırması
│   └── package.json          # NPM bağımlılıkları
│
├── docker-compose.yml        # Docker Compose yapılandırması
├── Makefile                  # Sistem yönetim komutları
├── .env                      # Ortam değişkenleri (gizli)
├── .env.example              # Örnek ortam değişkenleri
└── doc/                      # Dokümantasyon
    └── README.md             # Ana dokümantasyon
```

## Backend Yapısı

Backend, Flask framework'ü kullanılarak geliştirilmiştir ve aşağıdaki bileşenlerden oluşur:

- **app.py**: Ana uygulama giriş noktası, Flask uygulamasını yapılandırır ve API endpoint'lerini tanımlar.
- **db.py**: PostgreSQL/Supabase bağlantılarını yönetir.
- **sql_helper.py**: Markdown formatındaki SQL sorgularını işler ve parametreleri değiştirir.
- **controllers/**: API endpoint'lerinin işlevlerini içerir.
- **sql_scripts/**: SQL sorgu dosyalarını saklar.

## Frontend Yapısı

Frontend, React library'si kullanılarak geliştirilmiştir ve aşağıdaki bileşenlerden oluşur:

- **components/**: Yeniden kullanılabilir UI bileşenleri:
  - **ReportSelector.jsx**: Kullanıcıların raporları listeleyen ve seçmelerini sağlayan bileşen.
  - **ReportViewer.jsx**: Seçilen raporu görüntüleyen, filtreleme ve grafik seçenekleri sunan bileşen.
- **pages/**: Tam sayfa bileşenleri.
- **services/**: Backend API ile iletişim kuran servisler.
- **context/**: Uygulama genelinde durum yönetimi.
- **hooks/**: Özel React hook'ları.

## Docker Yapılandırması

Sistem, Docker ve Docker Compose kullanılarak konteynerize edilmiştir:

- **backend/Dockerfile**: Flask backend'i için Docker imajı yapılandırması.
- **frontend/Dockerfile**: React frontend'i için Docker imajı yapılandırması.
- **docker-compose.yml**: Backend ve frontend servislerini birleştiren yapılandırma.

## Makefile Komutları

Makefile, sık kullanılan Docker Compose komutlarını basitleştirmek için kullanılır:

- **start**: Tüm servisleri başlatır.
- **stop**: Tüm servisleri durdurur.
- **build**: Servisleri yeniden oluşturur.
- **restart**: Servisleri yeniden başlatır.
- **clean**: Tüm Docker kaynakları temizler.
- **logs**: Servis loglarını görüntüler.
- **setup**: İlk kurulum için gerekli adımları gerçekleştirir. 
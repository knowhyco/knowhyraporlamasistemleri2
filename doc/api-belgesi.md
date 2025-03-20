# API Dokümantasyonu

Bu belge, Knowhy Raporlama Sistemi'nin API'sini açıklar.

## Genel Bilgiler

- **Base URL**: `http://localhost:8000/api` (veya sunucu adresiniz)
- **Format**: Tüm yanıtlar JSON formatındadır
- **Auth**: JWT tabanlı kimlik doğrulama (`Authorization: Bearer <token>` header'ı)

## Endpoints

### Sağlık Kontrolü

```
GET /health
```

Sistemin çalışıp çalışmadığını kontrol eder.

**Yanıt**

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### Kimlik Doğrulama

#### Giriş Yap

```
POST /auth/login
```

**Gövde**

```json
{
  "username": "admin",
  "password": "password"
}
```

**Yanıt**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### Raporlar

#### Rapor Listesi

```
GET /reports
```

Tüm raporları listeler.

**Yanıt**

```json
{
  "reports": [
    {
      "id": "son_24_saat",
      "name": "Son 24 Saatteki Aktif Oturumlar",
      "description": "Son 24 saat içinde aktif olan oturumları listeler",
      "category": "Zaman Bazlı Analizler",
      "parameters": [
        {
          "name": "start_date",
          "type": "datetime",
          "default": "NOW() - INTERVAL '24 HOURS'",
          "description": "Başlangıç tarihi"
        },
        {
          "name": "end_date",
          "type": "datetime",
          "default": "NOW()",
          "description": "Bitiş tarihi"
        }
      ]
    }
  ]
}
```

#### Rapor Detayı

```
GET /reports/:reportId
```

Belirli bir raporun detaylarını gösterir.

**Yanıt**

```json
{
  "id": "son_24_saat",
  "name": "Son 24 Saatteki Aktif Oturumlar",
  "description": "Son 24 saat içinde aktif olan oturumları listeler",
  "category": "Zaman Bazlı Analizler",
  "sql": "SELECT session_id, MIN(created_at) as first_message...",
  "parameters": [
    {
      "name": "start_date",
      "type": "datetime",
      "default": "NOW() - INTERVAL '24 HOURS'",
      "description": "Başlangıç tarihi"
    },
    {
      "name": "end_date",
      "type": "datetime",
      "default": "NOW()",
      "description": "Bitiş tarihi"
    }
  ],
  "visualization": {
    "primary": "table",
    "options": ["table", "bar", "line"]
  }
}
```

#### Rapor Çalıştırma

```
POST /reports/:reportId/run
```

Belirli bir raporu çalıştırır ve sonuçlarını döndürür.

**Gövde**

```json
{
  "parameters": {
    "start_date": "2023-03-01T00:00:00",
    "end_date": "2023-03-02T00:00:00",
    "min_messages": 3
  }
}
```

**Yanıt**

```json
{
  "metadata": {
    "reportId": "son_24_saat",
    "executionTime": "0.524s",
    "rowCount": 15
  },
  "columns": [
    {
      "name": "session_id",
      "type": "string"
    },
    {
      "name": "first_message",
      "type": "datetime"
    },
    {
      "name": "last_message",
      "type": "datetime"
    },
    {
      "name": "message_count",
      "type": "integer"
    },
    {
      "name": "session_duration",
      "type": "interval"
    }
  ],
  "data": [
    {
      "session_id": "5f7d3a2e-9c8b-4a1d-8e6f-7b5a4c3d2e1f",
      "first_message": "2023-03-01T10:15:30",
      "last_message": "2023-03-01T10:45:20",
      "message_count": 12,
      "session_duration": "00:29:50"
    },
    // ... diğer satırlar
  ],
  "visualization": {
    "recommended": "table",
    "chartOptions": {
      "x": "session_id",
      "y": "message_count"
    }
  }
}
```

### Sistem Yönetimi

#### Sistem Durumu

```
GET /system/status
```

Sistem durumunu gösterir (sadece admin kullanıcıları için).

**Yanıt**

```json
{
  "status": "ok",
  "database": {
    "status": "connected",
    "version": "PostgreSQL 14.5"
  },
  "table": "customer_messages",
  "messageCount": 125890,
  "activeUsers": 3,
  "lastSync": "2023-03-01T14:30:00Z"
}
```

#### Tablo Adı Yapılandırma

```
POST /system/table
```

Raporlarda kullanılacak tablo adını ayarlar (sadece admin kullanıcıları için).

**Gövde**

```json
{
  "tableName": "customer_messages"
}
```

**Yanıt**

```json
{
  "success": true,
  "message": "Tablo adı başarıyla güncellendi",
  "tableName": "customer_messages"
}
```

### Kullanıcı Yönetimi

#### Kullanıcı Listesi

```
GET /users
```

Tüm kullanıcıları listeler (sadece admin kullanıcıları için).

**Yanıt**

```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "role": "admin",
      "status": "active",
      "lastLogin": "2023-03-01T14:30:00Z"
    },
    {
      "id": 2,
      "username": "user1",
      "email": "user1@example.com",
      "role": "user",
      "status": "active",
      "lastLogin": "2023-03-01T10:15:00Z"
    }
  ]
}
```

#### Kullanıcı Ekleme

```
POST /users
```

Yeni bir kullanıcı ekler (sadece admin kullanıcıları için).

**Gövde**

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "user"
}
```

**Yanıt**

```json
{
  "success": true,
  "message": "Kullanıcı başarıyla oluşturuldu",
  "user": {
    "id": 3,
    "username": "newuser",
    "email": "newuser@example.com",
    "role": "user",
    "status": "active"
  }
}
```

### Hata Kodları

| Kod | Açıklama |
|-----|----------|
| 200 | OK - İstek başarılı |
| 400 | Bad Request - İstek formatı hatalı |
| 401 | Unauthorized - Kimlik doğrulama başarısız |
| 403 | Forbidden - Yetkisiz erişim |
| 404 | Not Found - Kaynak bulunamadı |
| 500 | Internal Server Error - Sunucu hatası |

### Örnek Kullanım

#### cURL ile Rapor Çalıştırma

```bash
curl -X POST \
  http://localhost:8000/api/reports/son_24_saat/run \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "parameters": {
      "start_date": "2023-03-01T00:00:00",
      "end_date": "2023-03-02T00:00:00"
    }
  }'
```

#### JavaScript (Fetch API) ile Rapor Listesini Alma

```javascript
fetch('http://localhost:8000/api/reports', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
``` 
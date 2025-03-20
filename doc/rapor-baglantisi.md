# SQL Raporları ve Parametreleri

Bu doküman, Knowhy Raporlama Sistemi'ndeki SQL raporlarını ve kullanılan parametreleri açıklar.

## Rapor Yapısı

Sistem, Markdown formatında SQL sorguları kullanır. Her rapor dosyası şu bölümlerden oluşur:

1. **Başlık**: Raporun adı ve açıklaması
2. **Parametreler**: Kullanıcının sağlayabileceği parametreler
3. **SQL Sorgusu**: Parametrelerle değiştirilebilen SQL sorgusu
4. **Görselleştirme**: Rapor için önerilen görselleştirme türleri

## Parametre Değiştirme

SQL sorgularında parametreler `{{parametre_adı}}` formatında tanımlanır. Sistem, çalışma zamanında bu parametreleri kullanıcının sağladığı değerlerle değiştirir.

## Örnek Rapor Dosyası

```markdown
# Son 24 Saatteki Aktif Oturumlar

Bu rapor, son 24 saat içinde aktif olan tüm oturumları listeler.

## Parametreler

- start_date: Başlangıç tarihi (varsayılan: 24 saat önce)
- end_date: Bitiş tarihi (varsayılan: şimdi)
- min_messages: Minimum mesaj sayısı (varsayılan: 2)

## SQL

```sql
SELECT 
  session_id, 
  MIN(created_at) as first_message, 
  MAX(created_at) as last_message,
  COUNT(*) as message_count,
  MAX(created_at) - MIN(created_at) as session_duration
FROM 
  {{table_name}}
WHERE 
  created_at BETWEEN '{{start_date}}' AND '{{end_date}}'
GROUP BY 
  session_id
HAVING 
  COUNT(*) >= {{min_messages}}
ORDER BY 
  last_message DESC;
```

## Görselleştirme

- Tablo: session_id, first_message, last_message, message_count, session_duration
- Çizgi Grafik: message_count by session_id
- Çubuk Grafik: session_duration by session_id
```

## Parametre Türleri

Raporlarda kullanılan parametre türleri:

| Tür | Açıklama | Örnek |
|-----|----------|-------|
| string | Metin değeri | `customer_name` |
| date | Tarih değeri (ISO format) | `2023-03-01` |
| datetime | Tarih ve saat (ISO format) | `2023-03-01T14:30:00` |
| integer | Tam sayı | `5` |
| float | Ondalıklı sayı | `3.14` |
| boolean | Mantıksal değer | `true`, `false` |
| array | Dizi değeri (virgülle ayrılmış) | `'value1','value2','value3'` |

## Temel Raporlar

### 1. Zaman Bazlı Analizler

#### Son 24 Saatteki Aktif Oturumlar
- **Dosya**: `18_Son_24_saatteki_aktif_oturumlar.md`
- **Parametreler**: `start_date`, `end_date`, `min_messages`
- **Açıklama**: Son 24 saat içindeki oturumları ve mesaj sayılarını listeler.

#### Saatlik Aktivite Analizi
- **Dosya**: `14_Saatlik_Aktivite_Analizi.md`
- **Parametreler**: `start_date`, `end_date`
- **Açıklama**: Saatlere göre mesaj sayılarını gösterir.

#### Günlük Aktivite ve Etkin Konuşma Saatleri
- **Dosya**: `5_Gunluk_Aktivite_ve_Etkin_Konusma_Saatleri.md`
- **Parametreler**: `start_date`, `end_date`
- **Açıklama**: Gün içindeki en aktif saatleri ve mesaj yoğunluğunu gösterir.

### 2. İçerik Analizleri

#### Kelime Kullanım Matrisi
- **Dosya**: `8_Kelime_Kullanim_Matriksi.md`
- **Parametreler**: `start_date`, `end_date`, `min_count`
- **Açıklama**: En sık kullanılan kelimeleri ve frekanslarını gösterir.

#### En Sık Sorulan Sorular/Konular
- **Dosya**: `4_En_Sik_Sorulan_Sorular_Konular.md`
- **Parametreler**: `start_date`, `end_date`, `min_count`
- **Açıklama**: Tekrar eden soru kalıplarını ve konuları listeler.

#### Context Kullanım İstatistikleri
- **Dosya**: `3_Context_kullanim_istatistikleri.md`
- **Parametreler**: `start_date`, `end_date`
- **Açıklama**: Context kullanımı hakkında istatistikler gösterir.

### 3. Performans Metrikleri

#### Yanıt Süresi Analizi
- **Dosya**: `24_Yanit_Suresi_Analizi.md`
- **Parametreler**: `start_date`, `end_date`
- **Açıklama**: Kullanıcı sorularına yanıt verme sürelerini analiz eder.

#### Konuşma Derinliği Analizi
- **Dosya**: `11_Konusma_Derinligi_Analizi.md`
- **Parametreler**: `start_date`, `end_date`, `min_messages`
- **Açıklama**: Konuşmaların derinliğini ve detay seviyesini analiz eder.

#### Oturum Uzunluğu Analizi
- **Dosya**: `16_Session_Uzunlugu_ve_Kullanici_Sorulari_Arasindaki_İliski.md`
- **Parametreler**: `start_date`, `end_date`
- **Açıklama**: Oturum süreleri ve soru sayıları arasındaki ilişkiyi gösterir.

### 4. Detaylı Görünümler

#### Seçilen Oturumdaki Tüm Mesajlar
- **Dosya**: `15_Secilen_oturumdaki_tüm_mesajlari_kronolojik_sirayla_listele.md`
- **Parametreler**: `session_id`
- **Açıklama**: Belirli bir oturumdaki tüm mesajları kronolojik olarak listeler.

#### Context Kullanan Yanıtlar
- **Dosya**: `2_Context_kullanan_yanitlar_dahil_detayli_oturum_gorunumu.md`
- **Parametreler**: `session_id`, `include_context`
- **Açıklama**: Context kullanan yanıtları ve ilgili context içeriğini gösterir.

#### Trend Analizi
- **Dosya**: `23_Trend_Analizi_Konularin_Zaman_İcinde_Degisimi.md`
- **Parametreler**: `start_date`, `end_date`, `interval_type`
- **Açıklama**: Zaman içindeki konu trendlerinin değişimini gösterir.

## Özel Parametreler

### table_name

Bu parametre, Supabase veritabanındaki mesaj tablosunun adını belirtir. Tüm SQL sorgularında kullanılır ve sistem tarafından otomatik olarak eklenir.

### interval_type

Zaman aralığı tipini belirtir:
- `hour`: Saatlik analiz
- `day`: Günlük analiz
- `week`: Haftalık analiz
- `month`: Aylık analiz

### include_context

Context bilgisinin dahil edilip edilmeyeceğini belirtir:
- `true`: Context bilgisini dahil et
- `false`: Context bilgisini dahil etme 
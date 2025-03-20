# Knowhy Raporlama Sistemi SQL Dosyaları

Bu klasör, Knowhy Raporlama sistemi için kullanılan SQL sorgu dosyalarını içerir. Tüm sorgular, aşağıda açıklanan standart parametreler kullanılarak dinamik olarak çalıştırılabilir.

## Parametreler

Tüm SQL dosyaları, uygulama tarafından değiştirilebilen `{PARAMETRE}` formatında yer tutucular içerir:

- `{TABLE_NAME}`: Mesaj tablosunun adı (ör. "customer_denizmuzesi")
- Zaman aralıkları: `{DAYS_INTERVAL}`, `{MONTHS_INTERVAL}`, `{HOURS_INTERVAL}` vb.
- Filtreler: `{SESSION_ID}`, `{SELECTED_DATE}`, `{START_DATE}`, `{END_DATE}` vb.
- Sonuç limitleri: `{RESULT_LIMIT}`, `{WORD_LIMIT}` vb.
- Özel filtreler: `{TOPIC_CASE_EXPRESSION}`, `{EXCLUDED_WORDS}` vb.

## Rapor Kategorileri

### Zaman Bazlı Analizler
- `1_belirli_bir_gundeki_konusma_oturumlarini_listele.sql`: Belirli bir gündeki tüm konuşmaları listeler
- `1a_tarih_araligindaki_konusma_oturumlari.sql`: Belirli bir tarih aralığındaki konuşmaları listeler
- `5_Gunluk_Aktivite_ve_Etkin_Konusma_Saatleri.sql`: Günlük aktivite ve etkin konuşma saatlerini gösterir
- `6_Gunluk_konusma_istatistikleri.sql`: Günlük konuşma istatistiklerini çıkarır
- `7_Haftanin_Gunlerine_Gore_Aktivite_Dagilimi.sql`: Haftanın günlerine göre aktivite dağılımını analiz eder
- `14_Saatlik_Aktivite_Analizi.sql`: Günün hangi saatlerinde aktivitenin yoğunlaştığını gösterir
- `18_Son_24_saatteki_aktif_oturumlar.sql`: Son 24 saatteki aktif oturumları listeler
- `19_Son_bir_saatte_gelen_yeni_konusmalar.sql`: Son bir saatte gelen yeni konuşmaları listeler
- `27_Aylik_Trend_Analizi.sql`: Aylık trend analizini gösterir
- `28_Son_Istatistikler.sql`: Belirli bir zaman aralığındaki genel istatistikleri gösterir

### İçerik Analizleri
- `3_Context_kullanim_istatistikleri.sql`: Context kullanım istatistiklerini analiz eder
- `4_En_Sik_Sorulan_Sorular_Konular.sql`: En sık sorulan sorular/konuları kategorizeler
- `8_Kelime_Kullanim_Matriksi.sql`: Kelime kullanım matriksini oluşturur (kelime bulutu için)
- `9_kelimeler.sql`: Kullanıcı mesajlarındaki kelime sıklığını analiz eder
- `23_Trend_Analizi_Konularin_Zaman_Icinde_Degisimi.sql`: Konuların zaman içindeki değişimini analiz eder
- `26_Zaman_ve_Konu_Iliskisi.sql`: Zaman ve konu ilişkisini analiz eder (hangi saatte hangi konular soruluyor)

### Performans Metrikleri
- `10_Konusma_Akisi_Analizi.sql`: Konuşma akışı ve yanıtlama sürelerini analiz eder
- `11_Konusma_Derinligi_Analizi.sql`: Konuşma derinliğini mesaj sayısına göre analiz eder
- `16_Session_Uzunlugu_ve_Kullanici_Sorulari_Arasindaki_Iliski.sql`: Oturum uzunluğu ve kullanıcı soruları arasındaki ilişkiyi analiz eder
- `24_Yanit_Suresi_Analizi.sql`: Yanıt sürelerini detaylı analiz eder
- `25_Yanit_verme_suresine_gore_oturumlar.sql`: Yanıt verme süresine göre oturumları listeler

### Detaylı Görünümler
- `2_Context_kullanan_yanitlar_dahil_detayli_oturum_gorunumu.sql`: Context kullanan yanıtlarla beraber detaylı oturum görünümü sağlar
- `12_Konusma_uzunluguna_gore_en_aktif_oturumlar.sql`: Konuşma uzunluğuna göre en aktif oturumları listeler
- `13_ornek_bir_oturum_konusma_takibi.sql`: Belirli bir oturumdaki tüm mesajları kronolojik sırayla listeler
- `15_Secilen_oturumdaki_tum_mesajlari_kronolojik_sirayla_listele.sql`: Seçilen oturumdaki tüm mesajları detaylı olarak listeler
- `17_Sistemin_Genel_ozeti.sql`: Sistemin genel özetini çıkarır (temel metrikler)
- `20_Soru-Cevap_ciftleri_Analizi.sql`: Soru-Cevap çiftlerini detaylı analiz eder

## Kullanım

Bu SQL dosyaları, backend tarafından `sql_helper.py` aracılığıyla parametreleri değiştirilerek çalıştırılır. Örneğin:

```python
from utils.sql_helper import execute_sql_from_file

# SQL dosyasını oku ve parametreleri değiştir
results = execute_sql_from_file(
    "18_Son_24_saatteki_aktif_oturumlar.sql",
    {
        "TABLE_NAME": "customer_denizmuzesi",
        "MIN_MESSAGE_COUNT": "2"
    }
) 
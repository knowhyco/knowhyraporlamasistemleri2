# Kullanıcı Kılavuzu

Bu belge, Knowhy Raporlama Sistemi kullanıcıları için hazırlanmış bir rehberdir.

## Giriş

Knowhy Raporlama Sistemi, Supabase veritabanında saklanan mesajlaşma verilerini analiz etmenize ve görselleştirmenize olanak tanır. Bu kılavuz, sistemin temel özelliklerini ve kullanımını açıklar.

## Başlarken

1. Tarayıcınızdan `http://localhost:3000` adresine gidin (veya sistem yöneticinizin belirttiği URL).
2. Sistem ilk kez kullanılıyorsa, setup ekranıyla karşılaşabilirsiniz. Bu durumda yönetici talimatlarını takip edin.
3. Giriş ekranında kullanıcı adı ve şifrenizi girin.

## Ana Ekran

Ana ekran, aşağıdaki bölümlerden oluşur:

- **Gezinme Çubuğu**: Sistemin farklı bölümlerine erişim sağlar.
- **Rapor Listesi**: Mevcut raporları görüntüler.
- **Dashboard**: Önemli metrikleri özet olarak gösterir.

## Raporları Görüntüleme

1. Sol menüden "Raporlar" seçeneğine tıklayın.
2. Rapor listesinden incelemek istediğiniz raporu seçin.
3. Rapor detay sayfasında filtreleme seçeneklerini kullanabilirsiniz:
   - Tarih aralığı
   - Oturum ID
   - Kullanıcı bilgileri
   - Diğer özel filtreler
4. "Raporu Çalıştır" düğmesine tıklayarak sonuçları görüntüleyin.

## Rapor Görünümleri

Her rapor, farklı görünüm seçenekleri sunar:

1. **Tablo Görünümü**: Verileri tablo formatında gösterir.
2. **Grafik Görünümü**: Verileri çeşitli grafik türlerinde görselleştirir:
   - Çubuk grafik
   - Çizgi grafik
   - Pasta grafik
   - Dağılım grafik

Görünümü değiştirmek için rapor üst kısmındaki görünüm seçeneklerini kullanın.

## Raporları Kaydetme ve Dışa Aktarma

1. Rapor sonuçlarını kaydetmek için "Kaydet" düğmesine tıklayın.
2. Dışa aktarmak için "Dışa Aktar" düğmesini kullanın ve istediğiniz formatı seçin:
   - CSV
   - Excel
   - PDF

## Raporlar ve Analizler

### Zaman Bazlı Analizler

- **Son 24 Saat Aktif Oturumlar**: Son 24 saat içinde aktif olan oturumları listeler.
- **Saatlik Aktivite Analizi**: Saatlere göre sistem kullanımını gösterir.
- **Günlük/Haftalık Aktivite**: Günlere ve haftalara göre aktivite dağılımını gösterir.

### İçerik Analizleri

- **Kelime Kullanım Matrisi**: En sık kullanılan kelimeleri ve kombinasyonları gösterir.
- **En Sık Sorulan Sorular**: Tekrar eden soru kalıplarını ve konuları listeler.
- **Context Kullanım İstatistikleri**: Context kullanımı ile ilgili metrikleri gösterir.

### Performans Metrikleri

- **Yanıt Süresi Analizi**: Ortalama yanıt sürelerini ve dağılımını gösterir.
- **Konuşma Derinliği**: Konuşmaların detay seviyesini analiz eder.
- **Oturum Uzunluğu**: Oturum sürelerini ve mesaj sayılarını gösterir.

### Detaylı Görünümler

- **Oturum Detayları**: Belirli bir oturumun tüm mesajlarını kronolojik sırayla gösterir.
- **Context Kullanan Yanıtlar**: Context kullanılan yanıtları ve ilgili verileri listeler.
- **Trend Analizi**: Zaman içinde değişen trendleri gösterir.

## Sorun Giderme

Genel sorunlar ve çözümleri:

1. **Sayfa Yüklenmiyor**: Tarayıcınızı yenileyin veya cache'i temizleyin.
2. **Rapor Sonuçları Gelmiyor**: Filtreleri kontrol edin veya zaman aralığını genişletin.
3. **Grafik Görünmüyor**: Farklı bir tarayıcı deneyin veya JavaScript'in etkin olduğundan emin olun.
4. **Hata Mesajları**: Ekranda görünen hata mesajlarını not alın ve sistem yöneticinize bildirin.

## Yardım ve Destek

Daha fazla yardım için:

- Sistem yöneticinizle iletişime geçin.
- Bilgi tabanında arama yapın.
- Sorun raporu gönderin. 
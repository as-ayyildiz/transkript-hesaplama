# Düzce Üniversitesi Bilgisayar Mühendisliği Sanal Transkript

Düzce Üniversitesi Bilgisayar Mühendisliği öğrencileri için özel olarak geliştirilmiş, öğrenci transkript bilgilerini girerek not ortalaması (GANO / YANO) simülasyonu yapmalarını sağlayan modern, premium tasarımlı ve **%100 yerel (local)** çalışan bir web uygulamasıdır.

---

## 🌟 Öne Çıkan Özellikler

- 🎓 **Resmi GANO Katsayıları Uyumlaması:** Düzce Üniversitesi senatosunun belirlediği resmi katsayılar (AA=4.00, BA=3.50, BB=3.25, CB=3.00, CC=2.50, DC=2.25, DD=2.00, FD=1.50, FF=0.00) ile kuruşu kuruşuna resmi transkriptlerle birebir eşleşen ortalama hesaplama motoru.
- 📊 **AKTS Ağırlıklı Hesaplama:** Düzce Üniversitesi yönetmeliğine uygun olarak, dönem ve genel ortalamayı tamamen derslerin AKTS (ECTS) yüklerine göre hesaplar.
- 📑 **Bologna Giriş Yılı Seçimi:** 2022-2023, 2023-2024, 2024-2025 ve 2025-2026 girişli öğrencilerin kendi yıllarına ait resmi müfredatları otomatik olarak yüklenir.
- ⚡ **OBS'den Tek Tıkla Otomatik Not Aktarımı:** Öğrenci bilgi sisteminden (OBS) kopyalanan transkript metninin yapıştırılmasıyla saniyeler içinde tüm derslerin ve notların otomatik olarak doldurulması.
- 🧠 **Akıllı Seçmeli Ders Eşleştiricisi:** Ders kodunun ilk basamağına göre (`US2xx`, `US3xx` vb.) seçmeli dersleri otomatik olarak ait oldukları yarıyıllara dağıtır ve `US225` gibi kodlar için otomatik temiz Türkçe isim ataması yapar.
- 🔄 **OBS Verilerine Geri Dön (Undo):** Kullanıcı notlar üzerinde manuel denemeler (gelecek dönem simülasyonları) yaptıktan sonra tek tıkla OBS'den aktarılan orijinal transkript durumuna geri dönebilir.
- 💾 **Yerel Veri Depolama:** Yapılan tüm hesaplamalar ve simülasyonlar her Bologna yılı için ayrı ayrı tarayıcı belleğinde (`localStorage`) güvenle saklanır.

---

## 🔒 Güvenlik ve Gizlilik Garantisi

Öğrencilerin kişisel bilgilerinin güvenliği en üst seviyede tutulmuştur:
- **Otomatik Maskeleme:** Kopyalanıp yapıştırılan metin içerisindeki **11 haneli T.C. Kimlik Numarası** ve **9-10 haneli Öğrenci Numarası** gibi hassas kişisel veriler, daha tarayıcı belleğine dahi kaydedilmeden anında Regex filtreleri ile temizlenir ve `***********` haline getirilerek maskelenir.
- **Sunucusuz Çalışma Yapısı:** Uygulamanın herhangi bir veritabanı veya sunucu bağlantısı yoktur. Girilen veya aktarılan hiçbir veri internet üzerinden başka bir adrese gönderilmez, tamamen kullanıcının bilgisayarında/tarayıcısında işlenir. %100 gizlilik ve güvenlik garantilidir.

---

## 💻 Yerel Kurulum

Projeyi yerel bilgisayarınızda çalıştırmak için:

1. Bağımlılıkları yükleyin:
```bash
npm install
```

2. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

3. Tarayıcınızdan `http://localhost:3000` adresine giderek uygulamayı açın.

---

## 🚀 GitHub Pages ile Yayına Alma

Proje, Next.js statik export (`output: "export"`) ve GitHub Actions için dinamik `basePath` özellikleri ile tam uyumludur.

1. Projeyi GitHub üzerinde oluşturduğunuz boş bir repository'e yükleyin:
```bash
git init
git add .
git commit -m "sanal transkript uygulamasi hazir"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ISMINIZ.git
git push -u origin main
```

2. GitHub repository ayarlarınızda (`Settings > Pages`), deployment kaynağı olarak **`GitHub Actions`** seçeneğini seçin.

3. Kodlarınızı push ettiğinizde, `.github/workflows/deploy.yml` dosyası otomatik olarak tetiklenerek uygulamanızı ücretsiz olarak yayına alacaktır.

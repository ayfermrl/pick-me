# Pick Me

Modern, mobil uyumlu, üyelikli quiz odaları oluşturan React web uygulaması.

## Teknoloji

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form
- lucide-react
- Recharts
- Supabase Auth, Database ve Realtime

## Çalıştırma

Bağımlılıkları kur:

```bash
npm install
```

Geliştirme sunucusunu aç:

```bash
npm run dev
```

Üretim çıktısı almak için:

```bash
npm run build
```

## Özellikler

- Hazır quiz şablonları
- Sıfırdan quiz oluşturma
- Kaydol / giriş yap ekranı
- Üyelik gerektiren quiz oluşturma
- Katılımcı adı zorunlu veya isteğe bağlı oda ayarı
- Anonim sonuç ayarı
- Link ile katılım
- Oy verme ekranı
- Recharts ile soru bazlı grafik
- Yüzde ve oy sayısı istatistikleri
- İsimli modda kimin neyi seçtiğini gösterme
- Mobil uyumlu tasarım

## Supabase

`.env.example` dosyasını `.env` olarak kopyalayıp Supabase bilgilerini ekle:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Supabase SQL Editor içinde `supabase/schema.sql` dosyasındaki SQL'i çalıştır.

Uygulama artık Supabase Auth ve `rooms` tablosu üzerinden çalışır.

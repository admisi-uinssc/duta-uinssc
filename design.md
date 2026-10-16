# Dokumen Desain (Design System) - Duta Kampus UINSSC

Dokumen ini merangkum sistem desain (*Design System*), palet warna, tipografi, serta pedoman antarmuka pengguna (UI) yang digunakan dalam pengembangan website **Duta Kampus UIN Siber Syekh Nurjati Cirebon**. 

Tujuan dari sistem desain ini adalah untuk memberikan nuansa yang **Premium, Profesional, dan Modern** tanpa menghilangkan unsur akademis.

---

## 1. Palet Warna (Color Palette)

Website ini menggunakan pendekatan desain yang bersih (*clean design*) dengan sorotan warna emas elegan untuk memberikan kesan eksklusif dan "berkelas" (khas ajang pencarian bakat/duta).

| Nama | CSS Variable | Penggunaan Utama |
| :--- | :--- | :--- |
| **Navy (Primary Dark)** | `var(--navy)` | Digunakan untuk teks judul (Headings), teks tebal, dan elemen penekanan yang membutuhkan kontras tinggi. |
| **Gold (Accent)** | `var(--gold)` | Warna aksen utama. Digunakan untuk tombol utama (CTA), garis bawah interaktif, lencana (*badges*), dan ikon. Memberikan kesan premium. |
| **White (Background)** | `var(--bg)` | Warna dasar untuk sebagian besar halaman. Memberikan ruang napas (*white space*) yang luas. |
| **Off-White (Alt BG)** | `var(--bg-alt)` | Warna latar alternatif (biasanya abu-abu sangat muda/krem muda) untuk memisahkan antar-seksi konten tanpa garis yang kaku. |
| **Text Mid** | `var(--text-mid)` | Digunakan untuk teks paragraf, deskripsi, agar mata pengguna tidak cepat lelah saat membaca (tidak hitam pekat). |

---

## 2. Tipografi (Typography)

Sistem tipografi dirancang agar mudah dibaca (*legible*) di berbagai ukuran layar sekaligus memberikan kesan modern.

- **Keluarga Font**: **Sora** — font sans-serif modern dari Google Fonts, dimuat secara langsung melalui Google Fonts CDN di `index.html` dan `globals.css` sehingga tampil instan, tajam, dan seragam di semua browser.
- **Heading (H1 - H3)**: Menggunakan ketebalan (Weight) **800 - 900**. Teks judul sangat tebal (*bold*) untuk memberikan hierarki informasi yang sangat tegas.
- **Body / Paragraf**: Menggunakan ketebalan **400 - 500**.
- **Gaya Khusus**: 
  - Seringkali terdapat rentang teks tebal dengan warna *Gold* di dalam judul utama (contoh: `<h1>Profil <span style="color: var(--gold)">Duta Kampus</span></h1>`).
  - Tidak menggunakan label *eyebrow* (teks kecil di atas judul utama) untuk menghindari kesan templat otomatis yang murah/terlihat seperti buatan AI (*AI slop*).

---

## 3. Komponen Utama (UI Components)

### A. Navigasi & App Hub
- **Desktop**: Bilah navigasi atas (Navbar) tradisional dengan menu *Dropdown* melayang berbayang halus pada menu "Tentang".
- **Mobile (Smartphone)**:
  - Menu navigasi dipadatkan ke dalam ikon *hamburger*.
  - Menghadirkan **App Hub Grid**: Deretan ikon menu berbentuk kotak (*card grid*) dengan ikon garis (*stroke icon*) di atas halaman Beranda. Ini meniru UX/UI dari aplikasi populer seperti Gojek/Grab sehingga pengguna HP sangat familier.

### B. Promo Banner Slider
- Desain *slider* horizontal yang responsif.
- **Rasio Aspek**:
  - Desktop: `4:1` (Sangat lebar, tidak memakan tempat ke bawah). Lebar maksimal `95%` dari layar.
  - Mobile: `2.5:1` (Sedikit lebih tinggi).
- **Interaksi**: Auto-slide setiap 4 detik, indikator titik di bawah, dan mendukung *swipe* manual di layar sentuh (menggunakan CSS *Scroll-Snap*).

### C. Kartu Profil Duta Kampus
- Tampilan Grid Kartu (Card).
- Ujung kartu melengkung (*border-radius: 16px*).
- **Efek Hover**: Saat kursor diarahkan, kartu akan terangkat ke atas (*translateY(-8px)*) disertai efek bayangan bercahaya warna emas pudar.
- **Adaptif**: Di HP, layout berubah menjadi horizontal (Gambar di kiri, Teks di kanan) untuk menghemat ruang *scroll* vertikal.

### D. Sistem Alert (Toast Notification)
- Menggantikan *pop-up browser default* (`window.alert`) dengan notifikasi *Toast* kustom yang muncul melayang dari pojok/atas layar dengan animasi memudar yang modern.

---

## 4. Struktur Halaman & Layout

Layout secara umum dibatasi dalam sebuah `.container` (maksimal lebar sekitar `1200px` - `1440px`) agar konten tidak meluber ke tepi pada monitor beresolusi raksasa, namun tetap padat (*padding*) di layar ponsel.

- **Pendekatan Responsif**: Selalu mengutamakan kenyamanan layar HP (*Mobile First principles* yang diimplementasikan via *Media Queries* `@media (max-width: 768px)`).
- **Halaman Error (404)**: Dirancang khusus menyesuaikan *branding*, alih-alih layar kosong putih bawaan server, untuk menjaga kualitas UX (*User Experience*).

---

## 5. Administrasi (CMS Lokal)

- Aplikasi ini menerapkan sistem panel kendali (`/admin`) dengan pendekatan **Single Page App Tabs**.
- Data disimpan di `localStorage` peramban (dengan nama tabel `dutauinssc_cms_v2`). 
- Antarmuka Admin memisahkan panel untuk *Galeri*, *Promo Banner*, dan *Profil Duta* dalam *card settings* berpenampilan modern dengan formulir _input_ yang terstruktur dan responsif (Card dengan latar abu-abu halus dan garis batas lembut).

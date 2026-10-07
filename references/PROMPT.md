### OBJECTIVE

Rombak total tampilan UI/UX frontsite portfolio saya menjadi tema "cozy workspace" yang hangat dan eye-catching, mengikuti referensi di bawah. JANGAN mengubah key atau struktur `data/portfolio.json`, dan pertahankan fitur bilingual `en` / `id`. Yang berubah hanya tampilan (komponen, JSX, CSS).

### TECH STACK

- Next.js (Pages Router), Tailwind CSS + Vanilla CSS, Framer Motion
- `LanguageContext` (`lang` = 'en' | 'id')
- Data: `data/portfolio.json`
- Ikon: Iconify

### REFERENSI (path relatif dari root project)

1. `references/design/target-layout.jpg`
   Target visual seluruh halaman: urutan section, layout, warna, gaya komponen. WAJIB diikuti. Kalau ragu soal warna atau ukuran, ambil dari gambar ini.
2. `references/hero/` (Hero.jsx, hero.css, assets/)
   Komponen Hero FINAL. Jangan ubah ilustrasi, animasi, proporsi, atau asetnya.
3. `references/hero-preview/index.html`
   Preview standalone hero. Buka di browser, hasil di Next.js harus identik. Tes scene: tambah `?scene=hujan` (pagi/siang/sore/malam/hujan).
4. `references/vectors/` (SVG siap pakai: sticky note, binder, macbook, stiker tech, amplop, segel, perangko, postcard)
   Pakai file ini sebagai gambar dekoratif. JANGAN dibuat ulang dengan CSS. Baca `references/vectors/README.md` untuk ukuran dan titik posisi, dan `references/vectors/index.html` untuk contoh susunannya. Salin ke `public/vectors/` lalu panggil via `<img src="/vectors/...">`. Teks (judul sticky note, isi notebook, label perangko, postcard) ditulis di HTML di atas gambar.
5. `references/current-site/current-portfolio.pdf`
   Tampilan website sekarang. Hanya untuk melihat konten, gayanya dibuang. Sumber data tetap `portfolio.json`.

### DATA CONTRACT (semua teks dari JSON, jangan hardcode)

1. Header & Hero
   - `data.name`, `data.nav[lang].*` (home, project, about, contact, resume)
   - `data.headerTaglineOne[lang]` = badge ketersediaan
   - `data.headerTaglineTwo[lang]` = judul besar hero
   - `data.headerTaglineThree[lang]` + `data.headerTaglineThreeRotations[lang]` = kalimat utama, rotasi teksnya jadi animasi fade halus (Framer Motion), bukan typewriter
   - `data.headerTaglineFour[lang]` = subjudul hero
   - `data.heroButtons` `[{ id, labelEn, labelId, href }]` = tombol hero (tombol pertama gaya filled teal, sisanya outline)
   - `data.statusCard` `[{ id, labelEn, labelId, status }]` = tidak ada di target. Tampilkan sebagai chip kecil di bawah tombol hero, atau lewati kalau mengganggu layout
   - `data.flags.showCursor` diabaikan karena tidak ada typewriter
2. Projects: `data.projects.filter(p => p.published).sort((a,b) => a.order - b.order)`; properti `id, title, description[lang], image, url, technologies, live, repo, featured, details`
3. Services: `data.services.filter(s => s.published).sort(order)`; properti `id, title[lang], description[lang]`
4. How I Work: `data.howIWork.title[lang]`, `.description[lang]`, `.steps` (`order, title[lang], description[lang]`)
5. About: `data.aboutpara[lang]`
6. Tech Stack: `data.techstack.title[lang]`, `.description[lang]`, `.categories` `[{ id, name[lang], items: [{ id, name, level }] }]` (level 'main' | 'familiar')
7. Socials: `data.socials_section.title[lang]`, `.description[lang]`; `data.socials.filter(s => s.placement === "connect_grid" && s.published)` (`title, link, actionEn/actionId`)
8. SEO: `data.seo` (titleEn/Id, descriptionEn/Id, keywords, canonicalUrl, ogImage) tetap dipakai di `<Head>`

Aturan data: jumlah item mengikuti JSON, bukan gambar. Kalau JSON punya 4 services, tampilkan 4 sticky note (layout menyesuaikan). Kalau punya 9, tampilkan 9. Jangan tambah, hapus, atau ganti isi data. Kalau sebuah elemen di target tidak punya data di JSON (misalnya foto profil, jam cuaca di footer), buat sebagai teks statis di komponen lewat objek `lang` lokal, bukan mengubah JSON.

### LANGKAH KERJA

0. Baca dulu struktur project (pages, components, styles, LanguageContext, portfolio.json). Ikuti konvensi yang ada. Jangan menambah library berat.
   Catatan Pages Router: import CSS global hanya boleh dari `pages/_app`. Komponen dengan useState/useEffect biasa saja (tanpa "use client"), tapi hapus baris `"use client"` di Hero.jsx kalau error.

1. Fondasi global
   - Font self-host (@fontsource): Nunito 700/800 (judul, nav), Raleway 500/600 (subjudul), Kalam 400/700 (tulisan tangan). Hapus baris `@import` Google Fonts di hero.css.
   - Tokens (CSS variables / tailwind.config): ink #1f2a37, teal #2f5d56, cream #f8f3e8, band-services #f3e9db, band-about #fcf9f3, page-bg #f1e4d0. Warna lain ambil dari gambar referensi.
   - LAYOUT FULL LAYAR, TANPA "page card" dan tanpa frame beige di luar. Setiap section (nav+hero, Projects, Services+How I Work, About+Tech Stack+Contact, Footer) adalah band yang membentang 100% lebar viewport (full-bleed), dengan warna background band masing-masing (lihat target-layout.jpg). Jangan pakai max-width, radius, shadow, atau margin di level halaman/band.
   - Isi tiap band dijaga rata dengan container yang sama: `padding-left/right: max(24px, calc((100vw - 1320px) / 2 + 12px))` (sama seperti `.hero-wrap` di references/hero/hero.css), supaya teks tidak melebar berlebihan di monitor besar, tapi background tetap full layar.
   - Hero: ilustrasi menempel ke tepi kanan VIEWPORT (bukan tepi card), dasar ilustrasi rata dengan batas bawah band hero. Pakai `.hero-wrap` dan ukuran stage dari hero.css apa adanya, jangan diubah ke padding card.
   - Hero tinggi minimal `100vh` dikurangi tinggi navbar, jadi hero mengisi satu layar penuh di desktop.

2. Navbar
   - Logo teks dari `data.name`, link dari `data.nav[lang]` (Projects, About, Contact, Resume), toggle EN / ID berbentuk pill yang memakai `LanguageContext`.
   - Navbar berada di dalam wrapper hero supaya ikut berubah warna saat scene Malam dan Hujan.

3. Hero
   - Salin `Hero.jsx` dan `hero.css` ke `components/hero/`, dan isi `references/hero/assets/` ke `public/hero/`. Hero.jsx sudah memakai path `/hero/...`.
   - Hero.jsx menerima props `available`, `title`, `subtitle`, `projectsHref`, `contactHref`. Sesuaikan agar teks, badge, dan tombol diisi dari JSON (lihat Data Contract), dengan `lang`.
   - Scene SEPENUHNYA OTOMATIS, TIDAK ADA tombol ganti scene (sudah dihapus di Hero.jsx, jangan ditambah lagi):
     - Jam dari `new Date().getHours()`: Pagi 05.00-10.00, Siang 10.00-15.00, Sore 15.00-18.00, Malam 18.00-05.00.
     - Cuaca dari `https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&current_weather=true`. Kalau `current_weather.weathercode` hujan (51-67, 80-82, 95-99), scene jadi Hujan dan mengalahkan scene jam.
     - Kalau fetch gagal, scene tetap mengikuti jam.
   - Penempatan: hero full-bleed, ilustrasi menempel ke tepi kanan viewport, dasar ilustrasi rata dengan batas bawah hero. Biarkan `.hero-wrap` berbasis lebar viewport seperti aslinya (jangan diganti padding card).
   - Tema gelap (Malam) dan abu-abu (Hujan) hanya untuk wrapper nav + hero, bukan seluruh halaman.
   - Typewriter dan panel "~/dev status" lama dihapus.

4. Projects (tidak ada di target tapi wajib ada)
   - Semua project published dari JSON, tepat setelah hero (id anchor tetap, target tombol hero).
   - Card krem, border tipis hangat, shadow lembut, hover sedikit naik (Framer Motion), tag teknologi chip bulat, tombol live/repo pill teal. Tanpa label gaya terminal. `featured` boleh dibuat card lebih besar.

5. Services + How I Work (dua kolom, band #f3e9db)
   - Services: sticky note berwarna (pink, biru, hijau, putih, oranye, ungu, diulang kalau lebih dari 6), sedikit miring, sudut kanan bawah terlipat. Judul dari `title[lang]`, `description[lang]` jadi teks hover atau tooltip. Hover: miring berkurang dan naik sedikit.
   - How I Work: notebook berspiral, langkah dari `steps` diurutkan `order` sebagai checklist tulisan tangan (Kalam). Judul dan deskripsi dari `howIWork`.

6. About + Tech Stack (kolom kiri, band #fcf9f3)
   - About: card putih dengan foto profil, `data.name`, dan baris pendidikan serta pekerjaan, plus logo UNPAM dan Univerz. `aboutpara[lang]` tampil kecil di bawah card. Baris pendidikan dan pekerjaan ambil dari JSON kalau ada, kalau tidak pakai teks statis dwibahasa: "Information Systems, Pamulang University" dan "Full-Stack Developer at PT Univerz Teknologi Utama".
   - Tech Stack: tampilan BIASA dan rapi (bukan konsep stiker). Judul dan deskripsi dari `techstack`, lalu tiap kategori dari `categories` (nama kategori[lang]) berisi item sebagai chip/badge bulat dengan ikon Iconify kecil di kiri nama. Item `level: 'main'` dibuat lebih menonjol (chip teal/krem solid, font lebih tebal), `level: 'familiar'` lebih ringan (chip outline). Semua item JSON harus tampil, tidak ada yang hilang. Hover: naik sedikit.
   - Dekorasi estetika (tambahan, bukan isi utama): `vectors/macbook/macbook-lid.png` dengan `vectors/tech-stickers/*.svg` ditempel di atasnya (posisi dan rotasi kecil acak, lihat `vectors/index.html`). Taruh di samping atau di bawah daftar tech stack sebagai ilustrasi saja: `aria-hidden="true"`, tidak interaktif, tidak menggantikan daftar chip. Di mobile boleh diperkecil atau disembunyikan kalau mengganggu. Stiker yang tersedia: react, laravel, react-native, mysql, apple, php, nextjs, typescript, postgresql, docker, git (sebagai hiasan, tidak harus cocok 1:1 dengan isi JSON).

7. Contact (kolom kanan)
   - Judul dan subjudul dari `socials_section`. Amplop dengan segel lilin teal di tengah, perangko bergerigi di sekelilingnya dari `socials` placement `connect_grid` (title, link, aksi sesuai `lang`). Semua link dari JSON. Pakai `contact/envelope.svg`, `wax-seal.svg`, dan `stamp-*.svg` (GitHub, LinkedIn, WhatsApp, Email). Sosmed lain di JSON tampil sebagai chip teks.
   - Di bawahnya card postcard "Need an internal system?" dengan tombol Email, FastWork, Projects.co.id memakai `heroButtons` atau `socials` yang relevan. Kalau datanya tidak ada di JSON, pakai teks statis dwibahasa dengan link yang sudah ada di project.

8. Footer
   - Garis teal tipis. Kiri: "Jakarta HH:MM" (Intl.DateTimeFormat, Asia/Jakarta, update tiap menit) dan kondisi cuaca dengan ikon. Fetch Open-Meteo SEKALI lalu bagikan ke hero dan footer (context atau hook kecil) supaya tidak double request. Kanan: "© 2026 {data.name}".

### INTERAKSI (Framer Motion)

Entrance fade-up saat section masuk viewport (`whileInView`, once), hover naik pada card/stiker/sticky note, transisi halus saat ganti bahasa. Ilustrasi hero sudah beranimasi sendiri (CSS di dalam SVG), jangan diganggu. Hormati `prefers-reduced-motion` (`useReducedMotion`).

### ATURAN

- Sticky note, notebook, macbook, stiker tech, amplop, segel, perangko, postcard memakai SVG dari `references/vectors/`, bukan dibuat ulang. Tampilan section harus mirip `references/vectors/index.html`.
- Aset dari saya di `public/portfolio/` (atau `src/assets` sesuai konvensi): `profile.jpg`, `unpam-logo.png`, `univerz-logo.png`. Kalau belum ada, pakai placeholder dan beri komentar TODO.
- Bundel ikon (`@iconify-json/logos`, `@iconify-json/mdi`) agar tidak bergantung API runtime.
- Responsif sempurna di mobile, tablet, desktop: mobile semua kolom jadi satu, sticky note 2 kolom, notebook dan amplop 100% lebar.
- Kontras teks minimal AA, ikon tombol punya aria-label.
- Jangan ubah `portfolio.json`, LanguageContext, routing, dan link.

### HASIL YANG DISERAHKAN

- `npm run build` lolos tanpa error.
- Screenshot desktop (1440px) dan mobile (390px) semua section, plus hero di scene Pagi, Malam, Hujan (pakai `?scene=` di preview atau mock jam dan cuaca).
- Daftar file dibuat atau diubah, dan daftar TODO aset placeholder.
- Perbandingan singkat dengan `references/design/target-layout.jpg`: mana yang sudah sama, mana yang beda.

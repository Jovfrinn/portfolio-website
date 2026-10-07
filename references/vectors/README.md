# Vectors (SVG, tanpa teks, siap dipakai)

Semua file SVG murni vector, tanpa teks bawaan (teks ditulis di HTML pakai font Kalam/Nunito) kecuali stiker React Native.
Lihat `index.html` untuk contoh pemakaian dan susunan.

| Folder         | File                                                                                              | Catatan                                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| sticky-notes/  | note-{pink,blue,green,white,orange,purple}.svg                                                    | 180x170, sudut kanan bawah terlipat. Teks ditumpuk di atas (area aman: x 14-158, y 18-130)                                                            |
| notebook/      | binder.svg, checkbox.svg                                                                          | 520x330. Pusat baris ke-i (0-6): y = 60 + 36\*i. Margin merah di x=160, checkbox di x~178                                                             |
| macbook/       | macbook-lid.png                                                                                   | 580x430. Tutup laptop kosong, area aman stiker x 30-550, y 24-370                                                                                     |
| tech-stickers/ | react, laravel, react-native, mysql, apple, php, nextjs, typescript, postgresql, docker, git .svg | Outline putih tebal + shadow sudah di dalam SVG (SVG filter). Rotasi dan posisi diatur lewat CSS                                                      |
| contact/       | envelope.svg, wax-seal.svg, stamp-{github,linkedin,whatsapp,email}.svg, postcard.svg              | Segel di titik (220,178) pada envelope (440x290). Label perangko ditulis di HTML (area y 104-130). Postcard hanya background, teks dan tombol di HTML |

Pemakaian: `<img src="/vectors/tech-stickers/react.svg" />` (salin folder ke `public/vectors/`).
Kalau mau warna diubah, edit nilai hex di file SVG-nya.
Logo tech berasal dari koleksi Iconify `logos` (logo milik masing-masing brand), ikon email dari `mdi`.

# Amplop terbuka (layer terpisah untuk animasi)

Semua layer memakai canvas SAMA: viewBox 0 0 440 470, jadi cukup ditumpuk `position:absolute; inset:0` tanpa offset.

Urutan z-index (bawah ke atas):
1. `1-envelope-back.svg` bagian dalam amplop
2. `2-flap-open.svg` flap terbuka (muncul setelah flap tertutup menghilang)
3. `4-envelope-front.svg` saku depan
4. `2-flap-closed.svg` flap tertutup (animasi: scaleY 1 ke 0, origin 50% 39.15%)
5. `5-seal-half-a.svg` dan `5-seal-half-b.svg` segel pecah, 120x120, ditaruh di left 36.36%, top 60.85%, width 27.27%

Urutan animasi: segel pecah (0s) -> flap tertutup mengempis (0.45s) -> flap terbuka muncul (0.7s). Tutup = kebalikannya.
`open-envelope.svg` = versi statis (terbuka). `demo.html` = contoh CSS, bisa jadi acuan untuk Framer Motion (transformOrigin: "50% 39.15%" untuk flap).

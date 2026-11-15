# Praktik Versi Pertama

Microsite praktik untuk Session 3 "Building the First Version" (belajarlagi x Robina). Satu halaman HTML, tanpa server, tanpa dependency.

Peserta memilih satu kasus perhotelan (fiktif), mengikuti alur yang sama dengan deck, lalu menghasilkan dashboard HTML yang bisa diunduh dan dipakai offline.

## Fitur
- 5 kasus fiktif: reservasi, okupansi, rekonsiliasi, forecast, keluhan
- Tiap langkah menghasilkan output sesuai kasus yang dipilih
- Data sendiri lewat tempel CSV/TSV, upload CSV atau xlsx, atau Google Sheets (jika tersedia)
- Data hanya tersimpan di browser peserta (localStorage)
- Unduh dashboard offline (satu file HTML)

## Pakai
Buka `index.html` di browser. Untuk hosting, taruh di GitHub Pages atau host statis apa pun.

## Edit
Ubah file di `src/`, lalu jalankan `./build.sh` untuk membuat ulang `index.html`.

## Catatan
Semua data contoh fiktif. Tidak ada data asesmen peserta di repo ini.

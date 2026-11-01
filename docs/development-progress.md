# Checklist pengembangan Kantongin

Audit awal: dashboard, fitur transaksi, detail transaksi, kantong, detail kantong, SQLite, dan tema sistem sudah tersedia di project. Item tersebut belum dicentang ulang dalam rencana penuh sampai alur terkait diregresi pada batch integrasi.

## Target aplikasi

- [ ] **01 — Splash Screen:** splash memakai branding Kantongin dan Mochi, diuji pada build Android.
- [ ] **02 — Onboarding:** tiga langkah, lewati/lanjut, dan status tersimpan tanpa mengubah data finansial.
- [ ] **03 — Beranda:** mengikuti desain referensi dan menampilkan ringkasan aktual.
- [ ] **04 — Kantong dan filter kantong:** daftar, saldo, filter, dan riwayat terhubung.
- [ ] **05 — Transaksi dan detail transaksi:** daftar, filter, detail, dan pengelompokan berjalan.
- [ ] **06 — Laporan dengan grafik:** grafik berasal dari transaksi aktual dan dapat difilter.
- [ ] **07 — Anggaran per kategori:** tambah/edit/hapus dan progres dihitung dari transaksi.
- [ ] **08 — Profil / Lainnya:** menu dan pengaturan yang tersedia berfungsi.
- [ ] **09 — Tambah/edit transaksi:** validasi, relasi, saldo, dan persistensi lolos uji aplikasi.
- [ ] **10 — Buat/edit kantong:** validasi, saldo awal, dan persistensi lolos uji aplikasi.
- [ ] **11 — Detail kantong:** saldo dan riwayat cocok dengan transaksi.
- [ ] **12 — Target tabungan:** buat/edit/hapus dan progres dari setoran aktual.
- [ ] **13 — Transaksi berulang:** jadwal, status, dan pencatatan tidak menggandakan transaksi.
- [ ] **14 — Insight / AI:** insight dihitung dari data aktual; tanpa angka contoh.
- [ ] **15 — Bottom navigation lima posisi:** empat tujuan dan tombol tambah di tengah tersedia di Android.
- [ ] **16 — Light mode:** seluruh layar konsisten dalam mode terang.
- [ ] **17 — Dark mode:** seluruh layar konsisten dalam mode gelap.
- [ ] **18 — Mochi:** maskot lokal digunakan pada layar relevan dengan layout yang sesuai.
- [ ] **19 — SQLite satu sumber data:** seluruh ringkasan finansial memakai repository yang sama.
- [ ] **20 — Navigasi:** setiap alur dan tombol utama membuka tujuan yang benar.
- [ ] **21 — Widget:** ditunda sesuai instruksi; belum dikerjakan.

## Batch

- [ ] **Batch 1:** fondasi, navigasi, splash, onboarding, tema. Implementasi dan typecheck/lint/bundling Android+web lolos; interaksi dan splash belum diuji pada perangkat Android.
- [ ] **Batch 2:** audit/regresi kantong, transaksi, detail, dan SQLite yang sudah ada.
- [ ] **Batch 3:** anggaran, target tabungan, transaksi berulang. Migrasi/repository/CRUD/schedule diuji lewat SQLite dan ekspor Android/web lolos; interaksi layar di perangkat Android masih belum diuji.
- [ ] **Batch 4:** laporan/grafik, insight, profil, ekspor data. Query SQLite, tema tersimpan, serialisasi CSV, typecheck/lint, dan bundling lolos; uji interaksi Android masih tertunda.
- [ ] **Batch 5:** integrasi Mochi pada dashboard, onboarding, dan header halaman; warna ikon Android diselaraskan; profil tema tersimpan dan konfigurasi profil EAS APK ditambahkan. Typecheck/lint/bundling lolos. Uji perangkat dan APK belum dijalankan.

## Catatan verifikasi 2026-10-30

- **Batch 1:** v2→v3 SQLite migration test memastikan transaksi lama tidak berubah; onboarding preference bertahan setelah reopen. TypeScript, lint, ekspor Android, dan ekspor web lolos. Pengujian visual release splash dan tap UI Android masih menunggu emulator/perangkat.
- **Batch 2:** fungsi repository aplikasi diuji terhadap SQLite lokal: kantong saldo awal Rp125.000, pemasukan Rp10.000.000 kategori Gaji ke Kebutuhan pada 2026-10-30, pengeluaran Rp250.000 kategori Makan, validasi tipe kategori, edit, hapus, dan reopen. Perhitungan saldo total/kantong lolos, termasuk pengulangan tepat skenario laporan bug setelah audit terbaru. Halaman React Native belum dijalankan di emulator.
- **Batch 3:** migrasi v3→v4 aditif lolos dengan transaksi lama tetap ada. Repository menguji anggaran berbasis belanja aktual (buat/edit/hapus), target berbasis saldo kantong aktual (buat/edit/hapus), serta jadwal bulanan dengan akhir bulan, catch-up, deduplikasi, dan penghapusan. Tutup/buka ulang file SQLite mempertahankan data. `npx.cmd tsc --noEmit`, `npx.cmd expo lint`, `npx.cmd expo export --platform android`, dan `npx.cmd expo export --platform web` lolos. Tap layar dan alur visual Android belum diverifikasi karena emulator/perangkat tidak tersedia; target 07/12/13 dan Batch 3 belum dicentang sampai uji tersebut dilakukan.
- **Batch 4:** laporan per bulan, kategori/hari, insight (perbandingan bulan dan anggaran terlampaui), serta tema tersimpan diuji lewat SQLite; CSV diuji termasuk escaping kutip/koma. Grafik harian kini dapat digeser horizontal pada layar sempit. TypeScript/lint dan ekspor Android/web lolos. Tombol UI belum diuji di Android. Ekspor web mengunduh berkas CSV; Android membagikan isi CSV melalui share sheet teks. `expo-sharing` belum terpasang karena `npx.cmd expo install expo-sharing` gagal mengakses registry (`EACCES`); tidak ada dependency yang dipasang manual. Target 06/08/14 tetap belum dicentang hingga alur UI diuji.
- **Batch 5:** Mochi tampil melalui header utama dan semua halaman yang memakai `PageShell` (termasuk detail transaksi/kantong); onboarding memakai ilustrasi lokal Mochi. Android adaptive icon memakai latar cream. Profil EAS internal APK/production AAB sudah disiapkan di `eas.json`, dan `android.package` kini ditetapkan sebagai `com.kantongin.app`; `npx.cmd expo config --type public --json`, TypeScript, lint, serta ekspor Android/web lolos. APK tidak dibangun karena autentikasi/proyek EAS dan perangkat Android untuk QA belum tersedia. `expo-doctor` tidak selesai karena jaringan/timeout, dan Computer Use native pipe tidak tersedia untuk QA browser. Pemeriksaan lanjutan mengganti catch pemuatan kosong dengan log/status gagal, membuat grafik laporan dapat digeser, mengganti long-press hapus menjadi tombol eksplisit dengan konfirmasi lintas platform, dan memakai pesan yang berjalan pada Web maupun Android (React Native Web memang no-op untuk `Alert.alert`). Form transaksi kini menahan input sampai data awal selesai dimuat dan mengabaikan hasil query kategori yang sudah usang. `expo-sharing` tidak tersedia di cache lokal dan registry gagal diakses (`EACCES`); ekspor Android saat ini membagikan isi CSV sebagai teks.

Centang target hanya setelah implementasi dan pengujian untuk target tersebut berhasil. Widget sengaja tidak masuk scope pengerjaan.

## Final QA & persiapan rilis Android — 2026-10-30

### Status verifikasi

- **Implementasi:** route halaman utama dan fitur yang tercantum di atas ditemukan dalam source. Menu utama menautkan Kantong, Anggaran, Target Tabungan, Transaksi Berulang, dan Insight; tab memuat Beranda, Transaksi, Laporan, dan Lainnya. Audit fungsi tombol dan visual terhadap gambar belum dapat dituntaskan lewat source saja; tidak ada target aplikasi yang dicentang hanya berdasarkan audit source.
- **Pengujian otomatis:** `npx.cmd tsc --noEmit`, `npx.cmd expo lint`, `npx.cmd expo export --platform android`, `npx.cmd expo export --platform web`, dan `npx.cmd expo config --type public --json` lulus pada pemeriksaan ini. Pengujian repository/SQLite yang dicatat per batch sebelumnya adalah pengujian otomatis lokal, bukan uji UI Android.
- **Ekspor CSV Android:** BELUM LULUS. Android masih memakai `Share.share` dengan isi CSV sebagai teks, bukan URI file. Instalasi `expo-sharing` dan dependency langsung `expo-file-system` dicoba melalui `npx.cmd expo install expo-sharing expo-file-system`, tetapi gagal mengakses registry dengan `EACCES` sebelum dependency berubah. Implementasi yang benar perlu menulis CSV ke file lokal, lalu membagikan URI menggunakan `expo-sharing` (`Sharing.shareAsync`); dokumentasi SDK 58 menyatakan berbagi file URI didukung Android. File sharing URI tidak didukung web oleh modul tersebut, sehingga jalur web tetap unduh berkas.
- **Pengujian perangkat:** BELUM DILAKUKAN. Tidak ada folder `android/`, `adb`, atau emulator yang tersedia saat audit. Safe area, splash native, tap seluruh tombol, layout/light-dark, Share Sheet, dan persistensi sesudah force close belum diuji melalui UI Android.
- **Konfigurasi APK:** `android.package` adalah `com.kantongin.app`; `eas.json` memiliki profile `preview` internal APK dan `production` AAB. **APK build: BELUM DILAKUKAN.** Belum ada `extra.eas.projectId` yang terhubung pada konfigurasi app, dan CLI EAS/autentikasi tidak tersedia untuk membangun.

### Langkah untuk membuka hambatan rilis

1. Pulihkan akses registry npm, lalu jalankan `npx.cmd expo install expo-sharing expo-file-system`. Pastikan versi yang dipasang mengikuti Expo SDK 58.
2. Buat atau pilih proyek di akun Expo pemilik aplikasi, autentikasi CLI dengan `npx eas-cli@latest login`, lalu jalankan `npx eas-cli@latest init` dari `C:\Kantongin` agar Expo menghubungkan proyek dan menulis project ID yang sebenarnya. Jangan mengisi project ID secara manual dengan nilai contoh.
3. Pasang platform-tools/perangkat Android dengan USB debugging atau siapkan emulator; lakukan smoke test semua route, transaksi CRUD/saldo, tema, safe area, ekspor file CSV, dan persistensi setelah aplikasi dihentikan paksa.
4. Setelah autentikasi dan project link benar, jalankan `npx eas-cli@latest build --platform android --profile preview`. Status APK hanya boleh diubah menjadi lulus setelah EAS memberi artefak build APK yang dapat diunduh.

Tidak ada perubahan database pengguna atau reset database dalam final QA ini. Implementasi file CSV Android tetap tertunda karena dependency resmi Expo belum dapat diambil dari registry; jangan menyebut ekspor tersebut berhasil sebelum uji Share Sheet dengan file URI pada perangkat Android.

## Navigasi referensi, target kantong, dan transfer — 2026-11-01

- **Bottom nav** mengikuti referensi: Beranda, Kantong, ＋, Transaksi, Lainnya. Laporan dipindah ke `src/app/reports.tsx` dan dibuka dari menu Lainnya.
- **Migrasi v5 (aditif):** `wallets.kind` (`spending`/`saving`, kantong `type='Simpanan'` lama menjadi `saving`), `wallets.target_amount` opsional, dan tabel `transfers`. Target kantong pengeluaran = batas belanja bulan berjalan; target kantong tabungan = target saldo.
- **Transfer** antar kantong (`/transfer-form`) menolak kantong yang sama dan saldo asal yang tidak cukup. Transfer tidak dihitung sebagai pemasukan/pengeluaran, sehingga laporan, anggaran, dan total saldo tidak berubah. Saldo kantong dan target tabungan memakai `walletBalanceSql` yang sama.
- Transfer tampil dan dapat dihapus di detail kantong; belum tampil di tab Transaksi maupun ekspor CSV.
- Verifikasi: `tsc --noEmit`, `expo lint`, ekspor Android dan web lolos; SQL migrasi v5 dan saldo dengan transfer diuji pada SQLite dari data v4. Belum diuji di perangkat Android.

## Penyesuaian tampilan dengan referensi — 2026-11-01

- **Aset Mochi** dari `C:\Asset Mochi` dipotong ke batas gambar dan diperkecil ke `assets/mochi/` (22 MB → 6,3 MB); daftar dan rasio ada di `src/constants/mochi.ts`. Splash native memakai `mochi-coin.png` dengan latar terang/gelap.
- **Ikon** memakai `expo-symbols` (sudah terpasang; Material Symbols di Android/web, font dibundel paket) lewat `src/components/app-icon.tsx`. Ikon teks lama pada kategori/kantong dipetakan saat render; tidak ada migrasi data.
- **Komponen bersama** di `finance-ui.tsx`: `Screen` (safe area, header halaman/form, ruang tab bar), `Segmented`, `Choice`, `Field` (prefix Rp, format ribuan), `ListRow`, `MonthSwitcher`, `EmptyState`, `MochiImage`. Semua layar memakai header kustom; header native stack dimatikan.
- **Layar yang dirombak:** splash, onboarding, Beranda, Kantong, Transaksi, Laporan, Anggaran, Profil/Lainnya, Tambah/Edit Transaksi, Buat/Edit Kantong, Detail Kantong (tab Transaksi/Statistik), Target Tabungan + form, Transaksi Berulang + form, Insight, Detail Transaksi, Transfer.
- **Perubahan perilaku kecil:** nama panggilan tersimpan di `app_settings.user_name`; tombol hapus anggaran/target/jadwal pindah ke form edit; periode default memakai bulan lokal (sebelumnya UTC); laporan menampilkan perbandingan pengeluaran dengan bulan lalu.
- Verifikasi: `tsc --noEmit`, `expo lint`, ekspor Android dan web lolos. **Tampilan belum dilihat di perangkat/emulator/browser.**
- Sengaja tidak dibuat: tombol Mingguan/Tahunan di Laporan, Akun & Keamanan, Bahasa, Bantuan, notifikasi, widget — belum ada fitur di baliknya.

## Perbaikan setelah uji tampilan — 2026-11-01

- **Ikon tidak center / tombol + miring:** `expo-symbols` di Android menggambar glyph sebagai teks dalam kotak tetap tanpa perataan tengah dan tetap mengikuti skala font sistem, sehingga glyph bergeser. `AppIcon` kini menggambar glyph Material Symbols sendiri (`allowFontScaling={false}`, `includeFontPadding: false`, rata tengah) di semua platform. Font dari `@expo-google-fonts/material-symbols` (dependency langsung, dipasang lewat `expo install`) dimuat di root layout sebelum aplikasi dirender.
- **Tanggal:** semua input tanggal memakai `DateField` (`src/components/date-field.tsx`), kalender modal berbasis JS dengan navigasi bulan/tahun dan tombol "Hari ini"; tanggal opsional bisa dikosongkan.
- **Splash:** bar loading terisi perlahan 2,4 detik, lalu overlay memudar 0,6 detik.
- Verifikasi: `tsc`, `expo lint`, ekspor Android/web lolos. Belum dilihat di perangkat.

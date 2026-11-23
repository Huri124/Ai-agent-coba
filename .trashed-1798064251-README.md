# Anime Studio AI — Tahap 1

Fondasi cloud untuk dashboard mobile dan AI Router narasi recap. Status: starter package; belum di-deploy dan belum terhubung ke akun AI/YouTube.

## Yang sudah ada
- Dashboard web mobile.
- Endpoint kesehatan `/api/health`.
- Endpoint narasi `/api/narrative`.
- Router mencoba Gemini dahulu, lalu OpenRouter jika Gemini mengembalikan error kuota/rate limit.
- Tidak ada panggilan model berbayar otomatis.
- Jika kedua provider mengembalikan error kuota, dashboard menampilkan status antre/tunggu. Pada tahap ini antrean belum disimpan permanen; pengguna dapat mengirim ulang saat kuota pulih.
- API key hanya disimpan sebagai secret di Cloudflare, bukan di browser.

## Deploy melalui HP atau PC

1. Buat akun Cloudflare dan GitHub (jika belum punya).
2. Buat repository GitHub baru bernama `anime-studio-ai`.
3. Upload seluruh isi ZIP ini ke repository (bukan folder ZIP-nya).
4. Di Cloudflare Dashboard buka **Workers & Pages → Create → Pages → Connect to Git**.
5. Hubungkan repository `anime-studio-ai`.
6. Framework preset: **None**. Build command: `exit 0`. Build output directory: `public`.
7. Deploy. Cloudflare Pages akan menyediakan alamat seperti `https://nama-proyek.pages.dev`.
8. Buka proyek Pages → **Settings → Variables and Secrets**. Tambahkan:
   - `GEMINI_API_KEY` sebagai Secret (ambil dari Google AI Studio).
   - Opsional: `OPENROUTER_API_KEY` sebagai Secret.
   Jangan pernah menaruh key di file HTML, chat, atau repository.
9. Setelah menambah secret, lakukan redeploy.
10. Buka alamat Pages di HP. Di kolom Alamat API masukkan alamat Pages yang sama, lalu tekan **Tes koneksi**.

## Catatan penting
- Gunakan model dan kuota sesuai ketentuan resmi masing-masing penyedia. Router ini tidak membuat akun tambahan atau mengakali batas kuota.
- Gemini adalah provider utama; OpenRouter adalah cadangan. Nama model gratis dapat berubah atau tidak tersedia. Jika model cadangan tidak tersedia, ubah `OPENROUTER_MODEL` pada Variables di Cloudflare ke model gratis yang memang tersedia pada akunmu.
- "Antre/tunggu" tahap ini adalah status aman, bukan antrean server persisten. Tidak ada auto-buy. Antrean persisten dan notifikasi akan dibuat pada tahap berikutnya.
- Free tier memiliki batas, dapat berubah, dan tidak menjamin layanan 24 jam atau gratis selamanya.
- Jangan kirim materi berhak cipta yang tidak berhak kamu gunakan. Pastikan penggunaan dan monetisasi konten mematuhi kebijakan platform.
- CORS pada starter ini terbuka untuk memudahkan uji coba. Sebelum produksi, batasi domain yang boleh mengakses API, tambahkan autentikasi pengguna, rate limit, dan pencatatan penggunaan.

## Tahapan selanjutnya
1. Uji router narasi dari HP.
2. Tambah proyek dan penyimpanan naskah.
3. Tambah riset sumber dan pemeriksaan fakta.
4. Tambah TTS, generator gambar, dan editor/render video cloud.
5. Tambah koneksi resmi YouTube OAuth untuk upload — perlu persetujuan akun Google.

# Cloudflare Pages Setup

Project ini sekarang memakai:

- Static frontend: `index.html`, `dashboard.html`, CSS, JS
- Cloudflare Pages Functions: `functions/api/*.js`
- Cloudflare D1: menyimpan isi dashboard
- Cloudflare KV: menyimpan file media upload dari dashboard
- Secret `ADMIN_PASSWORD`: melindungi tombol simpan dashboard

## Catatan Struktur

File penting:

- `index.html`, `style.css`, `script.js`: halaman publik.
- `dashboard.html`, `dashboard.css`, `dashboard.js`: dashboard admin.
- `functions/api/settings.js`: simpan/baca settings dashboard.
- `functions/api/media.js`: upload/baca media dari KV.
- `functions/api/quiz-results.js`: simpan hasil quiz dan baca monitoring.
- `functions/api/feelings.js`: simpan pesan perasaan dan baca dari dashboard.
- `backup/`: cadangan data, jangan dihapus kalau belum benar-benar yakin.

## Deploy

1. Push folder ini ke GitHub.
2. Buat project baru di Cloudflare Pages.
3. Pilih repo project ini.
4. Build command dikosongkan.
5. Deploy command dikosongkan.
6. Build output directory: `/`

Jangan isi deploy command dengan:

```bash
npx wrangler pages deploy .
```

Git deploy Cloudflare Pages tidak butuh command itu. Kalau command itu dipakai, Cloudflare akan mencoba login Wrangler memakai API token dan bisa gagal dengan `Authentication error [code: 10000]`.

## D1

1. Di Cloudflare, buat D1 database baru, misalnya `birthday_settings_db`.
2. Buka project Pages.
3. Masuk ke Settings > Functions > D1 bindings.
4. Tambahkan binding:

```text
Variable name: SETTINGS_DB
Database: birthday_settings_db
```

Kalau tombol binding terkunci dan muncul pesan "Bindings for this project are being managed through wrangler.toml", hapus file `wrangler.toml` dari repo GitHub, lalu redeploy. Setelah itu binding bisa ditambahkan lewat UI Cloudflare.

## KV Media

Upload banyak foto jangan disimpan langsung ke D1 karena JSON settings bisa terlalu besar dan rusak. Project ini menyimpan foto/musik ke KV, lalu D1 hanya menyimpan URL media.

1. Di Cloudflare, buat KV namespace, misalnya `birthday_settings`.
2. Buka project Pages.
3. Masuk ke Settings > Functions > KV namespace bindings.
4. Tambahkan binding:

```text
Variable name: SETTINGS_KV
KV namespace: birthday_settings
```

## Password Dashboard

1. Masuk ke Settings > Environment variables.
2. Tambahkan secret:

```text
ADMIN_PASSWORD=isi-password-kuat-kamu
```

3. Buka `dashboard.html`.
4. Isi password yang sama di kolom "Password dashboard".
5. Klik Simpan.

## Proteksi Tambahan

API simpan sudah dilindungi password. Kalau dashboard juga mau disembunyikan dari publik, aktifkan Cloudflare Access atau WAF rule untuk path:

```text
/dashboard.html
```

## Local Test

Install dependency:

```bash
npm install
```

Jalankan local Cloudflare Pages dev:

```bash
npm run dev
```

Lalu buka URL localhost dari Wrangler.

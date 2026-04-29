# Cloudflare Pages Setup

Project ini sekarang memakai:

- Static frontend: `index.html`, `dashboard.html`, CSS, JS
- Cloudflare Pages Functions: `functions/api/settings.js`
- Cloudflare KV: menyimpan isi dashboard
- Secret `ADMIN_PASSWORD`: melindungi tombol simpan dashboard

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

## KV

1. Di Cloudflare, buat KV namespace baru, misalnya `birthday_settings`.
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

# EventKita

Platform pendaftaran dan event ticketing komunitas. Monorepo berisi:

- `apps/web` — Next.js 16 App Router + Tailwind CSS 4
- `apps/api` — NestJS 12 + Prisma 6
- `packages/shared` — tipe dan skema bersama
- PostgreSQL 16 + Mailpit (development)
- Dokploy (PaaS self-hosted) + Traefik + Cloudflare Tunnel untuk production

Status saat ini: **Fase 1 — Fondasi**. Autentikasi, database, seed, landing page,
detail acara, dan dashboard dasar sudah berjalan. Checkout tiket masuk Fase 2–3.

Seluruh situs memakai visual system gelap **Echoic** (ground `#0A0C0E`, ivory
`#EDE7DC`, amber `#E8913C`, teal `#2E6B72`) dengan tipografi Syne/Sora. Homepage
`/` adalah landing page EventKita berbahasa Indonesia: hero portal, deck acara
yang bisa dilempar, kategori, jadwal, dan CTA. Deck serta jadwal mengambil acara
publik dari `GET /api/events`; jika API kosong atau gagal, halaman menampilkan
contoh visual dan empty state yang aman. Route `/login`, `/register`,
`/events/[slug]`, dan `/dashboard` memakai tema yang sama.

---

## Prasyarat

- Node.js 24+ dan npm 11+
- Docker Desktop / Docker Engine + Compose plugin (untuk PostgreSQL dan Mailpit)
- Git

---

## Development lokal

```bash
# 1. Install dependency
npm install

# 2. Nyalakan PostgreSQL + Mailpit
docker compose -f docker-compose.dev.yml up -d

# 3. Siapkan environment API
copy apps\api\.env.example apps\api\.env

# 4. Generate Prisma Client dan jalankan migrasi
npm run db:generate
npm run db:deploy

# 5. Isi data demo
npm run db:seed

# 6. Jalankan web + API
npm run dev
```

Setelah API berjalan, tes cepat:

```bash
npm run test:smoke
```

Buka:

- Web: http://localhost:3000
- API: http://localhost:4000/api
- Swagger: http://localhost:4000/api/docs
- Mailpit: http://localhost:8025

### Akun seed (development)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@eventkita.local` | `Admin12345!` |
| Staff | `staff@eventkita.local` | `Staff12345!` |

Password di atas hanya untuk development (berasal dari
`apps/api/.env.example`). Production wajib memakai `SEED_ADMIN_PASSWORD`
sendiri; `SEED_STAFF_PASSWORD` opsional (kalau kosong, akun staff dilewati).

Seed juga membuat empat acara demo: Workshop Produk Digital untuk Komunitas,
Meetup Komunitas Kreatif, Festival Musik Lokal 2026, dan Seminar Teknologi
Komunitas 2026. Ganti password dan secret sebelum production.

### Perintah berguna

```bash
npm run dev:api          # API saja
npm run dev:web          # Web saja
npm run typecheck        # TypeScript check semua workspace
npm run build            # Build shared + API + web
npm run db:studio        # Prisma Studio
npm run db:migrate       # Buat/terapkan migrasi saat development
```

---

## Struktur API Fase 1

| Method | Endpoint | Keterangan |
|---|---|---|
| `GET` | `/api/health` | Status API + database |
| `POST` | `/api/auth/register` | Daftar peserta |
| `POST` | `/api/auth/login` | Login, set cookie httpOnly |
| `POST` | `/api/auth/logout` | Hapus cookie sesi |
| `GET` | `/api/auth/me` | Profil user aktif |
| `GET` | `/api/events` | Acara publik mendatang |
| `GET` | `/api/events/:slug` | Detail acara |

Autentikasi memakai JWT di cookie `httpOnly`, `SameSite=Lax`, dan `Secure` saat
`NODE_ENV=production`/`COOKIE_SECURE=true`. Browser mengakses API lewat origin
yang sama: Next.js me-rewrite `/api/*` ke API internal (`API_INTERNAL_URL`),
dan hanya domain web yang diekspos Traefik/Cloudflare. Tidak ada CORS.

---

## Deploy production (Dokploy)

Metode resmi tugas PaaS: **Dokploy** di VM Proxmox VE, reverse proxy
**Traefik** milik Dokploy, PostgreSQL sebagai container, dan akses internet
lewat **Cloudflare Tunnel**. Deploy dilakukan oleh **Dokploy Auto Deploy**
(webhook GitHub), bukan script deploy manual.

Panduan langkah demi langkah (dengan penanda screenshot):
[`docs/DOKPLOY_DEPLOY.md`](docs/DOKPLOY_DEPLOY.md).

### Langkah singkat

1. Buat VM Ubuntu 24.04 di Proxmox, install Dokploy.
2. Hubungkan GitHub App di Dokploy.
3. Buat Compose service:
   - Repo: `jbravemuslim/eventkita`
   - Branch: `main`
   - Compose Path: `./docker-compose.dokploy.yml`
   - Compose Type: Docker Compose
4. Isi environment production dari `.env.example` ke tab **Environment**
   Dokploy. Jangan commit `.env`.
5. Tambahkan domain aplikasi ke service `web` port `3000` dari tab
   **Domains**. Jangan memberi domain untuk `api`/`db`.
6. Buat Cloudflare Tunnel:
   - `eventkita.example.com` → `http://dokploy-traefik:80`
   - `dokploy.example.com` → `http://dokploy:3000` (panel, untuk webhook
     GitHub; lindungi dengan Cloudflare Access + application path `api/deploy`
     yang di-bypass)
7. Aktifkan **Auto Deploy**. Setiap `git push` ke `main` akan build dan
   redeploy otomatis.
8. Migrasi Prisma berjalan otomatis saat API start. Seed **manual** lewat
   terminal container API atau service `seed` (profile `tools`).

### Environment penting

- `DATABASE_URL` harus memakai host `db` dan password yang sama dengan
  `POSTGRES_PASSWORD`.
- `COOKIE_SECURE=true` untuk production HTTPS.
- `APP_ORIGIN` = URL publik aplikasi.
- `SMTP_HOST/PORT/USER/PASS/FROM` memakai SMTP sungguhan. Mailpit hanya untuk
  development (`docker-compose.dev.yml`).
- `SEED_ADMIN_PASSWORD` wajib saat seed; tidak ada password default.

Daftar lengkap ada di [`docs/DOKPLOY_DEPLOY.md`](docs/DOKPLOY_DEPLOY.md).

### Seed manual

Seed tidak otomatis di production. Dari terminal container API:

```bash
SEED_ADMIN_NAME='Admin EventKita' \
SEED_ADMIN_EMAIL='admin@example.com' \
SEED_ADMIN_PASSWORD='<password-kuat>' \
npm run db:seed
```

Atau lewat service `seed` dari direktori compose Dokploy (pastikan
`SEED_ADMIN_PASSWORD` ada di environment/.env):

```bash
docker compose -p <app-name> -f docker-compose.dokploy.yml \
  --profile tools run --rm seed
```

Seed juga membuat/memperbarui empat event demo dan menimpa setting rekening
contoh. Review dulu, dan jangan jalankan ulang setelah data production nyata
diisi.

### Backup

Gunakan **Volume Backups** Dokploy untuk volume `pg_data` dan `uploads_data`
(butuh S3 destination), atau dump PostgreSQL dari container `db`:

```bash
docker compose -p <app-name> -f docker-compose.dokploy.yml exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' | gzip > backup-db.sql.gz
```

Jalankan dari direktori compose Dokploy (mis.
`/etc/dokploy/compose/<app-name>/code`). Script lama
`deploy/scripts/backup.sh` hanya untuk compose legacy Caddy.

### Deploy update

```bash
git push origin main
```

Dokploy Auto Deploy membangun image baru dan redeploy. Workflow GitHub Actions
`ci.yml` hanya menjalankan typecheck + build, tidak melakukan deploy.

> **Penting untuk scanner kamera:** browser hanya mengizinkan kamera di secure
> context. Gunakan domain + HTTPS (Cloudflare Tunnel) atau `localhost`. Kalau
> akses lewat `http://IP-LAN`, scanner kamera tidak akan jalan; input kode
> manual tetap tersedia.

### Metode lama/alternatif

- [`docs/PROXMOX_DEPLOY.md`](docs/PROXMOX_DEPLOY.md) — Docker Compose + Caddy
  manual (legacy).
- [`docs/CAPROVER_DEPLOY.md`](docs/CAPROVER_DEPLOY.md) — CapRover (legacy).
- `docker-compose.yml` dan `deploy/caddy/Caddyfile` hanya untuk metode legacy.
- `docker-compose.dev.yml` tetap dipakai untuk development lokal.

---

## Fase berikutnya

- **Fase 2:** event & ticket type admin API, order, reservasi kuota atomik,
  upload bukti, verifikasi pembayaran, tiket, QR, email, check-in.
- **Fase 3:** checkout peserta, status order, e-ticket, profil.
- **Fase 4:** dashboard admin, scanner kamera, laporan CSV, staff.
- **Fase 5:** test kritis, seed demo lengkap, dokumentasi deployment, backup/restore.

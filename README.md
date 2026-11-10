# EventKita

Platform pendaftaran dan event ticketing komunitas. Monorepo berisi:

- `apps/web` — Next.js 16 App Router + Tailwind CSS 4
- `apps/api` — NestJS 12 + Prisma 6
- `packages/shared` — tipe dan skema bersama
- PostgreSQL 16 + Mailpit (development)
- Docker Compose + Caddy untuk deployment VM Proxmox

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

### Akun seed

| Role | Email | Password |
|---|---|---|
| Admin | `admin@eventkita.local` | `Admin12345!` |
| Staff | `staff@eventkita.local` | `Staff12345!` |

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
`NODE_ENV=production`. Browser mengakses API lewat origin yang sama (rewrite
Next.js di development, Caddy di production), sehingga tidak ada CORS.

---

## Docker production-like

```bash
copy .env.example .env
# Edit .env: POSTGRES_PASSWORD, JWT_SECRET, SEED_ADMIN_PASSWORD, APP_DOMAIN

docker compose up -d --build
docker compose --profile tools run --rm seed
```

`APP_DOMAIN=:80` cocok untuk akses lewat IP di LAN. Untuk domain + HTTPS otomatis,
isi `APP_DOMAIN=eventkita.example.com` dan arahkan DNS ke VM.

Set `COOKIE_SECURE=true` hanya jika sudah memakai HTTPS. Kalau masih HTTP di LAN,
biarkan `false` supaya cookie login tetap terkirim.

Panduan lengkap VM Proxmox ada di [`docs/PROXMOX_DEPLOY.md`](docs/PROXMOX_DEPLOY.md).

> **Penting untuk scanner kamera:** browser hanya mengizinkan kamera di secure
> context. Gunakan domain + HTTPS (Caddy otomatis) atau `localhost`. Kalau akses
> lewat `http://IP-LAN`, scanner kamera tidak akan jalan; input kode manual tetap
> tersedia.

### Backup

```bash
bash deploy/scripts/backup.sh
```

Menyimpan dump PostgreSQL dan volume uploads ke `./backups`, lalu menghapus file
lebih dari 7 hari.

### Deploy update

```bash
bash deploy/scripts/deploy.sh
```

---

## Fase berikutnya

- **Fase 2:** event & ticket type admin API, order, reservasi kuota atomik,
  upload bukti, verifikasi pembayaran, tiket, QR, email, check-in.
- **Fase 3:** checkout peserta, status order, e-ticket, profil.
- **Fase 4:** dashboard admin, scanner kamera, laporan CSV, staff.
- **Fase 5:** test kritis, seed demo lengkap, dokumentasi Proxmox, backup/restore.

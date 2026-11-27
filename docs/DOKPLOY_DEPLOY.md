# SOP Deployment EventKita di Dokploy (PaaS Self-Hosted)

> **Tujuan:** men-deploy EventKita (Next.js + NestJS + PostgreSQL) sebagai
> aplikasi PaaS self-hosted di **Dokploy** di atas VM Proxmox VE, dengan
> **CI/CD Auto Deploy** dari GitHub, **Traefik** sebagai reverse proxy, dan
> **Cloudflare Tunnel** agar dapat diakses dari internet tanpa port forwarding.
>
> Dokumen ini adalah SOP utama. `docs/PROXMOX_DEPLOY.md` (Docker Compose +
> Caddy) dan `docs/CAPROVER_DEPLOY.md` (CapRover) adalah metode lama/alternatif.

---

## 0. Arsitektur dan prasyarat

### 0.1 Arsitektur

```text
Internet
  │ HTTPS (sertifikat Cloudflare)
  ▼
Cloudflare Edge
  ├── eventkita.example.com ──► Cloudflare Tunnel ──► dokploy-traefik:80
  │                                                   └── web:3000
  │                                                       └── /api/* ──► api:4000
  │                                                                      └── db:5432
  └── dokploy.example.com ────► Cloudflare Tunnel ──► dokploy:3000
                                                      (panel + webhook GitHub)
```

- Browser hanya melihat **satu domain aplikasi**. Next.js me-rewrite `/api/*`
  dan `/uploads/*` ke service API internal (`http://api:4000`), jadi tidak ada
  CORS dan cookie login tetap same-origin.
- PostgreSQL dan API **tidak** diberi domain publik. Hanya service `web` yang
  diekspos Traefik.
- Cloudflare Tunnel adalah koneksi **outbound** dari VM. Tidak perlu membuka
  port 80/443 ke internet dan tidak perlu port forwarding di router/Proxmox.
- Panel Dokploy juga diekspos lewat tunnel **hanya** agar webhook GitHub bisa
  masuk. Lindungi dengan Cloudflare Access, lalu buat bypass khusus untuk
  `/api/deploy/*`.

### 0.2 Prasyarat

- Akses Proxmox VE dan ISO Ubuntu Server 24.04 LTS.
- Akun GitHub dan repo `jbravemuslim/eventkita` (atau fork).
- Domain yang DNS-nya dikelola **Cloudflare** (nameserver Cloudflare).
  Cloudflare Tunnel tidak bisa dipakai jika domain belum di Cloudflare.
- Kredensial SMTP production (host, port, user, password, alamat From).
- Password/secret baru untuk database, JWT, dan admin seed.
- VM minimal 2 vCPU / 2 GB RAM / 30 GB disk. Untuk build Next.js + NestJS,
  **4 GB RAM** lebih aman.

---

## 1. Buat VM Ubuntu di Proxmox VE

1. Di Proxmox: **Create VM**.
   - Name: `eventkita-dokploy`.
   - ISO: `ubuntu-24.04-live-server-amd64.iso`.
   - CPU: 2 vCPU (4 disarankan).
   - RAM: 4096 MB (minimum 2048 MB).
   - Disk: 32–40 GB.
   - Network: VirtIO, bridge `vmbr0`, IP statis atau DHCP reservation.
2. Install Ubuntu Server:
   - User: `ubuntu` (atau user Anda), aktifkan **OpenSSH server**.
   - Timezone: `Asia/Jakarta`.
   - Catat IP VM.
3. Login SSH, update sistem:

   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y ca-certificates curl git ufw
   sudo timedatectl set-timezone Asia/Jakarta
   ```

4. Firewall dasar:

   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow OpenSSH
   # Panel Dokploy hanya dari LAN/admin. Jangan buka 3000 ke internet.
   sudo ufw allow from 192.168.0.0/16 to any port 3000 proto tcp
   sudo ufw enable
   sudo ufw status
   ```

   Port 80/443 **tidak perlu** dibuka ke internet jika memakai Cloudflare
   Tunnel. Traefik tetap listen di dalam VM dan dijangkau lewat network Docker.

   > Docker mem-publish port 80/443/3000 dan bisa melewati aturan UFW. Karena
   > itu, jangan membuat port forwarding dari internet ke VM. Akses eksternal
   > hanya lewat Cloudflare Tunnel (koneksi outbound).

> **Gunakan VM, bukan LXC.** Docker di LXC membutuhkan nesting dan lebih rawan
> masalah untuk Dokploy. Snapshot VM di Proxmox sebelum upgrade besar.

`[SCREENSHOT: Proxmox VE — wizard Create VM: OS, CPU, RAM, disk, network]`

`[SCREENSHOT: Ubuntu Server — konfigurasi user, OpenSSH, IP statis]`

`[SCREENSHOT: Terminal — ufw status setelah enable]`

---

## 2. Install Dokploy

1. Pastikan port `80`, `443`, dan `3000` bebas:

   ```bash
   sudo ss -tulpn | grep -E ':(80|443|3000)\b' || echo "Port bebas"
   ```

2. Install Dokploy:

   ```bash
   curl -sSL https://dokploy.com/install.sh | sh
   ```

   Installer menyiapkan Docker, Docker Swarm, Traefik, dan panel Dokploy.
3. Buka panel dari LAN:

   ```text
   http://<IP-VM>:3000
   ```

   Buat akun admin dengan password kuat, lalu aktifkan 2FA.
4. Kalau perlu akses dari laptop yang tidak sejaringan, gunakan SSH tunnel:

   ```bash
   ssh -L 3000:localhost:3000 ubuntu@<IP-VM>
   # lalu buka http://localhost:3000
   ```

5. Perbarui Dokploy bila ada rilis baru:

   ```bash
   curl -sSL https://dokploy.com/install.sh | sh -s update
   ```

`[SCREENSHOT: Terminal — installer Dokploy selesai]`

`[SCREENSHOT: Dokploy — halaman setup akun admin]`

`[SCREENSHOT: Dokploy — dashboard awal]`

---

## 3. Hubungkan GitHub

1. Di Dokploy: **Settings → Git → GitHub → Create GitHub App**.
2. Ikuti redirect ke GitHub, authorize, lalu install app pada repo
   `jbravemuslim/eventkita` (atau repo fork Anda).
3. Kembali ke Dokploy dan pastikan koneksi GitHub berstatus tersambung.
4. Jika repo privat, pastikan GitHub App diberi akses ke repo tersebut.

> Auto Deploy belum dibuat pada langkah ini. Webhook per-service dibuat saat
> toggle **Auto Deploy** diaktifkan pada langkah 7. Sebelum itu, panel Dokploy
> harus sudah bisa diakses dari internet (langkah 6).

`[SCREENSHOT: Dokploy Settings → Git → GitHub App connected]`

`[SCREENSHOT: GitHub — App installed pada repository EventKita]`

---

## 4. Buat project, Compose service, dan environment

1. Di Dokploy: **Projects → Create Project**.
   - Name: `EventKita`.
   - Environment: `production`.
2. Di project tersebut: **Create Service → Compose**.
3. Isi **General**:
   - Name: `eventkita`.
   - Provider: `GitHub`.
   - Repository: `jbravemuslim/eventkita`.
   - Branch: `main`.
   - **Compose Path:** `./docker-compose.dokploy.yml`.
   - Compose Type: **Docker Compose** (bukan Stack).
   - **Randomize Compose: OFF.**
   - **Isolated Deployments: OFF.**
4. Buka tab **Environment**, isi variabel dari tabel di Lampiran A.
   - Jangan meng-commit `.env`. Nilai ini disimpan Dokploy.
   - Pastikan `DATABASE_URL` memakai host `db` dan password yang sama dengan
     `POSTGRES_PASSWORD`.
5. Klik **Save**, lalu **Deploy**.
6. Tunggu build API dan web selesai. Setelah deploy:
   - `db` healthy.
   - `api` healthy (migrasi Prisma berjalan otomatis saat start).
   - `web` healthy.
   - `seed` **tidak** berjalan karena memakai profile `tools`.

> Validasi lokal sebelum push:
> `docker compose -f docker-compose.dokploy.yml --env-file .env.example config`.

`[SCREENSHOT: Compose — General: repo, branch, compose path, Compose Type]`

`[SCREENSHOT: Compose — Environment: daftar env var]`

`[SCREENSHOT: Compose — Deployments: build API dan web sukses]`

`[SCREENSHOT: Compose — Containers: db/api/web healthy, seed tidak jalan]`

> Jika build gagal karena `mirror.gcr.io` tidak bisa diakses, lihat
> Troubleshooting. Jangan mengubah base image tanpa alasan.

---

## 5. Atur domain aplikasi

1. Setelah deploy pertama, buka **Domains** pada Compose service.
2. **Add Domain**:
   - Host: `eventkita.example.com` (ganti dengan domain Anda).
   - Path: `/`.
   - Service: `web`.
   - Container Port: `3000`.
   - HTTPS: **OFF** (TLS diterminasi Cloudflare; lihat langkah 6).
   - Certificate Provider: None.
3. **Save**, lalu **Redeploy** Compose. Dokploy menambahkan label Traefik dan
   memastikan service `web` terhubung ke `dokploy-network`.
4. Buka **Preview Compose** dan verifikasi:
   - Ada label `traefik.enable=true`.
   - Rule `Host(eventkita.example.com)`.
   - Port load balancer `3000`.
   - Service `web` punya network `dokploy-network`.

> Jangan menambahkan domain untuk `api` atau `db`. Keduanya harus tetap
> internal. Publik hanya memakai satu domain web.

`[SCREENSHOT: Compose → Domains — web:3000, HTTPS off]`

`[SCREENSHOT: Compose → Preview — label Traefik dan dokploy-network]`

> **Alternatif tanpa Cloudflare Tunnel:** jika memakai DNS A record langsung ke
> IP publik VM, aktifkan HTTPS + Let's Encrypt di domain Dokploy dan buka port
> 80/443. Jalur tugas ini memakai Cloudflare Tunnel, jadi HTTPS di Dokploy
> dimatikan.

---

## 6. Cloudflare Tunnel ke Traefik dan panel Dokploy

> **Penting:** Auto Deploy Dokploy memakai webhook ke panel Dokploy port 3000
> (`/api/deploy/...`). Kalau panel hanya ada di LAN, GitHub tidak bisa
> mengirim webhook. Karena itu kita mengekspos **dua hostname**: aplikasi ke
> Traefik dan panel ke Dokploy.

### 6.1 Buat tunnel

1. Cloudflare Dashboard → **Zero Trust → Networks → Tunnels** (di UI baru
   kadang bernama **Connectors**) → **Create a tunnel**.
2. Pilih **Cloudflared**, beri nama `eventkita-dokploy`, lalu copy **token**.
3. Di Dokploy: **Create Service → Application** (bukan Compose).
   - Name: `cloudflared`.
   - Provider: Docker.
   - Image: `cloudflare/cloudflared:latest`.
   - Environment: `TUNNEL_TOKEN=<token-dari-Cloudflare>`.
   - Advanced → Command: `tunnel --no-autoupdate run`.
   - Deploy.
4. Cek log container `cloudflared`: harus ada pesan
   `Registered tunnel connection`.

`[SCREENSHOT: Cloudflare Zero Trust — Create tunnel]`

`[SCREENSHOT: Cloudflare — token tunnel]`

`[SCREENSHOT: Dokploy — Application cloudflared + TUNNEL_TOKEN]`

`[SCREENSHOT: Logs cloudflared — Registered tunnel connection]`

### 6.2 Public hostname aplikasi

Di tunnel Cloudflare, tambahkan **Public Hostname**:

| Field | Nilai |
|---|---|
| Subdomain | `eventkita` |
| Domain | `example.com` |
| Path | kosong |
| Service Type | `HTTP` |
| URL | `dokploy-traefik:80` |

DNS CNAME dibuat otomatis oleh Cloudflare. Tidak perlu A record ke IP VM.

`[SCREENSHOT: Cloudflare Tunnel — public hostname aplikasi ke dokploy-traefik:80]`

### 6.3 Public hostname panel Dokploy

Tambahkan **Public Hostname** kedua:

| Field | Nilai |
|---|---|
| Subdomain | `dokploy` |
| Domain | `example.com` |
| Path | kosong |
| Service Type | `HTTP` |
| URL | `dokploy:3000` |

Lalu:

1. Di Dokploy: **Settings → Web Server → Server**.
   - Host: `dokploy.example.com`.
   - HTTPS: **ON** (karena browser mengakses lewat HTTPS Cloudflare).
   - Save.
2. Verifikasi `https://dokploy.example.com` bisa dibuka dan login.
3. Lindungi panel dengan **Cloudflare Access**:
   - Application `Dokploy Panel`: domain `dokploy.example.com`, path kosong,
     policy **Allow** untuk email/Google Anda + 2FA.
   - Application `Dokploy Webhook`: domain `dokploy.example.com`, path
     `api/deploy`, policy **Bypass** (include Everyone). Access memakai
     pencocokan path terpanjang, jadi hanya webhook yang dilewati.
   - Jangan membuat satu policy Bypass untuk seluruh domain.
4. Jika login Dokploy menggantung setelah memakai Cloudflare Access, set env
   pada service panel `dokploy` (bukan compose EventKita):

   ```text
   BETTER_AUTH_URL=https://dokploy.example.com
   BETTER_AUTH_TRUSTED_ORIGINS=https://dokploy.example.com,http://<IP-VM>:3000
   BETTER_AUTH_SECRET=<openssl rand -hex 32>
   ```

   lalu restart/redeploy Dokploy. Ini opsional, tetapi sering diperlukan agar
   cookie/auth panel bekerja di balik Access.

`[SCREENSHOT: Cloudflare Tunnel — public hostname panel ke dokploy:3000]`

`[SCREENSHOT: Dokploy Settings → Web Server — host dan HTTPS]`

`[SCREENSHOT: Cloudflare Access — application panel + bypass /api/deploy/*]`

`[SCREENSHOT: Browser — https://dokploy.example.com login]`

### 6.4 SSL/TLS Cloudflare

1. Cloudflare Dashboard → **SSL/TLS → Overview**.
2. Pilih **Full** (atau Full Strict jika origin punya sertifikat valid).
   **Jangan Flexible** — ini penyebab umum redirect loop.
3. Aktifkan **Always Use HTTPS**.
4. Verifikasi:

   ```bash
   curl -I https://eventkita.example.com
   curl -I https://eventkita.example.com/api/health
   curl -I http://eventkita.example.com
   ```

`[SCREENSHOT: Cloudflare SSL/TLS — Full + Always Use HTTPS]`

> TLS berhenti di Cloudflare Edge. Koneksi Cloudflare → tunnel terenkripsi,
> lalu tunnel → Traefik/Dokploy memakai HTTP internal. Browser tetap melihat
> HTTPS, sehingga `COOKIE_SECURE=true` tetap benar.

---

## 7. Aktifkan Auto Deploy

1. Di Compose service: **General → Auto Deploy: ON**, lalu **Save**.
2. Jika memakai GitHub App, Dokploy membuat webhook repository secara otomatis.
   Verifikasi di GitHub: **Repository → Settings → Webhooks**.
   - Payload URL harus `https://dokploy.example.com/api/deploy/...`.
   - Content type: `application/json`.
   - Event: `push`.
   - URL webhook mengandung token rahasia; jangan dibagikan atau
     di-commit.
3. Jika webhook tidak dibuat otomatis, copy URL dari tab **Deployments**
   Dokploy dan tambahkan manual di GitHub.
4. Uji:

   ```bash
   git commit --allow-empty -m "test: trigger dokploy auto deploy"
   git push origin main
   ```

5. Di Dokploy **Deployments**, harus muncul deployment baru dari commit
   tersebut. Build dan redeploy berjalan otomatis.
6. Workflow GitHub Actions `ci.yml` hanya menjalankan typecheck + build.
   Workflow itu **tidak** melakukan deploy.

`[SCREENSHOT: Compose → General — Auto Deploy ON]`

`[SCREENSHOT: GitHub — webhook delivery 200]`

`[SCREENSHOT: Dokploy — deployment baru dipicu git push]`

> Jika webhook GitHub mendapat 302/403, Cloudflare Access kemungkinan
> memblokir `/api/deploy/*`. Perbaiki Access application path `api/deploy`,
> lalu kirim ulang delivery dari GitHub.

---

## 8. Migrasi dan seed manual

### 8.1 Migrasi otomatis

Container API menjalankan:

```bash
npx prisma migrate deploy && exec node dist/main.js
```

Cek log API di Dokploy. Output harus menunjukkan migrasi diterapkan (atau
"no pending migrations"), lalu API listen di port 4000. Jika migrasi gagal,
container akan restart; baca log error sebelum mengulang.

`[SCREENSHOT: Logs API — prisma migrate deploy sukses]`

### 8.2 Seed manual (tidak otomatis)

Seed **tidak** dijalankan saat deploy. Pilih salah satu cara:

**Cara A — terminal container API (paling mudah):**

1. Dokploy → Compose → **Containers** → pilih container service `api`.
2. Buka **Terminal**.
3. Jalankan (satu baris atau pakai `\`):

   ```sh
   SEED_ADMIN_NAME='Admin EventKita' \
   SEED_ADMIN_EMAIL='admin@example.com' \
   SEED_ADMIN_PASSWORD='<password-admin-kuat>' \
   npm run db:seed
   ```

   Tambahkan `SEED_STAFF_NAME`, `SEED_STAFF_EMAIL`, dan
   `SEED_STAFF_PASSWORD` jika ingin membuat akun staff.

**Cara B — service `seed` lewat SSH:**

```bash
cd /etc/dokploy/compose/<app-name>/code
docker compose -p <app-name> -f docker-compose.dokploy.yml --profile tools run --rm seed
```

`<app-name>` bisa dilihat dari nama container di Dokploy atau `docker compose ls`.
Pastikan `SEED_ADMIN_PASSWORD` tersedia di environment Compose (Dokploy
menulisnya ke `.env` di direktori tersebut) atau export sebelum command.

Catatan:
- `SEED_ADMIN_PASSWORD` wajib. Tidak ada password default di production.
- Jika `SEED_STAFF_PASSWORD` kosong, akun staff dilewati.
- Seed bersifat idempotent (upsert), tetapi juga membuat/memperbarui **empat
  event demo** dan **menimpa setting rekening contoh**. Review
  `apps/api/prisma/seed.ts` sebelum menjalankannya, dan jangan jalankan ulang
  setelah data production nyata diisi.
- Jangan menambahkan seed ke command startup API. Seed tetap manual.

`[SCREENSHOT: Dokploy — API container Terminal]`

`[SCREENSHOT: Terminal — Seed selesai, tanpa password tercetak]`

---

## 9. Uji dari data seluler

Matikan Wi-Fi di ponsel, gunakan data seluler, lalu uji:

1. Buka `https://eventkita.example.com`.
   - Harus HTTPS valid (padlock), bukan HTTP.
2. Buka `https://eventkita.example.com/api/health`.
   - Respons: `{"status":"ok","database":"up","timestamp":"..."}`.
3. Login dengan akun admin hasil seed.
   - Redirect ke dashboard.
4. Di browser desktop, buka DevTools → **Application → Cookies**:
   - Name: `eventkita_session`.
   - `HttpOnly`: ✓.
   - `Secure`: ✓.
   - `SameSite`: `Lax`.
   - `Path`: `/`.
5. Buka daftar acara dan detail acara.
   - Minimal satu event seed tampil.
6. Coba `http://eventkita.example.com`; harus redirect ke HTTPS.
7. Cek log API tidak menampilkan error database/CORS/cookie.

`[SCREENSHOT: Ponsel data seluler — homepage HTTPS]`

`[SCREENSHOT: Browser — /api/health status ok database up]`

`[SCREENSHOT: DevTools — cookie eventkita_session HttpOnly + Secure]`

`[SCREENSHOT: Ponsel — daftar acara dan detail acara]`

---

## 10. Troubleshooting

| Gejala | Kemungkinan penyebab | Perbaikan |
|---|---|---|
| Domain 404/502 | Domain service/port salah, `web` tidak di `dokploy-network`, label belum diterapkan | Pastikan domain memilih service `web` port `3000`; redeploy setelah mengubah domain; cek Preview Compose |
| Cloudflare 502 | Route tunnel salah atau cloudflared mati | Pastikan URL `http://dokploy-traefik:80`; cek log cloudflared `Registered tunnel connection` |
| Redirect loop | Cloudflare SSL **Flexible** + Dokploy HTTPS ON | Set Cloudflare **Full**; matikan HTTPS di domain Dokploy untuk tunnel |
| Login berhasil tapi cookie tidak tersimpan | `COOKIE_SECURE=true` diakses lewat HTTP; `APP_ORIGIN` beda domain; cookie diblokir | Akses lewat HTTPS; samakan `APP_ORIGIN` dengan domain; cek DevTools |
| API unhealthy | DB belum healthy, `DATABASE_URL` salah, password tidak cocok, migrasi gagal | Cek log `db` dan `api`; pastikan password `DATABASE_URL` = `POSTGRES_PASSWORD`; URL-encode karakter khusus |
| `prisma migrate deploy` gagal | Schema/migration tidak ada di image, DB down, disk penuh | Cek log; jalankan `npx prisma migrate status` di container API; cek disk |
| Build gagal | `mirror.gcr.io` tidak dapat diakses, RAM/disk kurang, `npm ci` gagal | Cek build logs; sementara ganti base image ke `node:24-alpine`; tambah RAM/disk; prune image |
| Email tidak terkirim | SMTP host/port/secure salah, kredensial salah, CA self-signed | Cek env SMTP; port 465 → `SMTP_SECURE=true`; port 587 → `false`; `SMTP_TLS_REJECT_UNAUTHORIZED=false` hanya untuk CA lab |
| Auto Deploy tidak terpicu | Panel tidak publik, webhook URL salah, Access memblokir, branch beda | Pastikan `https://dokploy.example.com` bisa diakses; cek webhook GitHub; Access application path `api/deploy`; branch `main` |
| Panel Dokploy login menggantung | Trusted origin/cookie di balik Cloudflare Access | Set `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, dan `BETTER_AUTH_SECRET`; redeploy Dokploy |
| Uploads 404 | Volume tidak ter-mount atau rewrite salah | Cek volume `uploads_data` di `/app/uploads`; cek rewrite `/uploads/*`; cek log API |
| Disk penuh | Image/build cache menumpuk | `docker system df`; prune image/build cache; pertimbangkan disk lebih besar |
| Webhook GitHub 302/403 | Cloudflare Access memblokir webhook | Buat Access application path `api/deploy` dengan policy **Bypass** |

Perintah diagnosis berguna:

```bash
# Di VM
docker ps
docker compose ls
docker system df

# Ganti <app-name> dengan nama project Dokploy
cd /etc/dokploy/compose/<app-name>/code
docker compose -p <app-name> -f docker-compose.dokploy.yml ps
docker compose -p <app-name> -f docker-compose.dokploy.yml logs --tail=200 api
docker compose -p <app-name> -f docker-compose.dokploy.yml logs --tail=200 web
docker compose -p <app-name> -f docker-compose.dokploy.yml logs --tail=200 db
```

`[SCREENSHOT: Dokploy — logs API saat troubleshooting]`

`[SCREENSHOT: GitHub — webhook delivery detail]`

---

## Lampiran A. Environment variable Dokploy

| Variable | Wajib | Contoh / catatan |
|---|---|---|
| `POSTGRES_DB` | ya | `eventkita` |
| `POSTGRES_USER` | ya | `eventkita` |
| `POSTGRES_PASSWORD` | ya | password kuat, URL-safe |
| `DATABASE_URL` | ya | `postgresql://eventkita:<password>@db:5432/eventkita?schema=public` |
| `JWT_SECRET` | ya | `openssl rand -base64 48` |
| `COOKIE_NAME` | tidak | `eventkita_session` |
| `COOKIE_SECURE` | ya | `true` |
| `APP_ORIGIN` | ya | `https://eventkita.example.com` tanpa trailing slash |
| `SMTP_HOST` | ya | host SMTP production |
| `SMTP_PORT` | ya | `587` atau `465` |
| `SMTP_USER` | tidak | kosongkan jika tanpa auth |
| `SMTP_PASS` | tidak | password SMTP |
| `SMTP_FROM` | ya | `"EventKita <no-reply@example.com>"` |
| `SMTP_SECURE` | tidak | `false` untuk 587, `true` untuk 465 |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | tidak | `true`; `false` hanya untuk CA self-signed |
| `SEED_ADMIN_NAME` | tidak | `Admin EventKita` |
| `SEED_ADMIN_EMAIL` | ya untuk seed | email admin asli |
| `SEED_ADMIN_PASSWORD` | ya untuk seed | password kuat, tanpa default |
| `SEED_STAFF_NAME` | tidak | `Staff Check-in` |
| `SEED_STAFF_EMAIL` | tidak | email staff |
| `SEED_STAFF_PASSWORD` | tidak | jika kosong, staff dilewati |

Tidak perlu diisi di Dokploy karena sudah diatur compose:
`API_INTERNAL_URL`, `UPLOAD_DIR`, `PORT`, `NODE_ENV`, `HOSTNAME`.

`WEB_ORIGIN` tidak perlu untuk arsitektur same-origin. `APP_DOMAIN` hanya untuk
compose legacy Caddy.

---

## Lampiran B. Checklist go-live

- [ ] VM Ubuntu bisa diakses SSH dan port 80/443/3000 bebas saat install.
- [ ] Dokploy terinstall dan admin 2FA aktif.
- [ ] GitHub App tersambung ke repo.
- [ ] Compose `docker-compose.dokploy.yml` terdeteksi.
- [ ] Env var production terisi, tidak ada secret di Git.
- [ ] Domain aplikasi memilih `web:3000`, HTTPS off (tunnel).
- [ ] Cloudflare Tunnel route aplikasi ke `dokploy-traefik:80`.
- [ ] Cloudflare Tunnel route panel ke `dokploy:3000`.
- [ ] Cloudflare Access melindungi panel; application path `api/deploy` di-bypass.
- [ ] Cloudflare SSL/TLS = Full; Always Use HTTPS aktif.
- [ ] Auto Deploy ON dan webhook GitHub sukses.
- [ ] Migrasi Prisma sukses di log API.
- [ ] Seed manual sukses; tidak ada seed otomatis.
- [ ] `/api/health` = ok.
- [ ] Login admin berhasil; cookie HttpOnly + Secure.
- [ ] Daftar acara dan detail acara tampil.
- [ ] Akses dari data seluler berhasil.
- [ ] Backup volume `pg_data` dan `uploads_data` direncanakan.

---

## Lampiran C. Referensi Dokploy

- Installation: <https://docs.dokploy.com/docs/core/installation>
- Docker Compose: <https://docs.dokploy.com/docs/core/docker-compose>
- Docker Compose domains: <https://docs.dokploy.com/docs/core/docker-compose/domains>
- Auto Deploy: <https://docs.dokploy.com/docs/core/auto-deploy>
- Cloudflare Tunnels: <https://docs.dokploy.com/docs/core/guides/cloudflare-tunnels>
- Volume Backups: <https://docs.dokploy.com/docs/core/volume-backups>

> Konvensi yang dipakai dokumen ini diverifikasi dari dokumentasi Dokploy:
> domain Compose diatur dari tab Domains (label Traefik otomatis), service
> yang diekspos memakai `dokploy-network`, Compose Path boleh custom, dan
> Auto Deploy memakai webhook ke panel Dokploy.

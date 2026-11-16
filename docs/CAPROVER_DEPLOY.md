# SOP Deployment EventKita di PaaS CapRover

> Kelompok 10 — Platform PaaS untuk Sistem Tiket Event & Seminar Sekolah
>
> Topologi: Proxmox VE (`192.168.17.10`) → VM Ubuntu `192.168.17.128`
> → CapRover 1.16.0 (nginx + Docker Swarm) → `eventkita-web`, `eventkita-api`,
> PostgreSQL `eventkita-db`, mailer SMTP lab.
>
> Domain: **https://eventkita.jehanbravemuslim.com** (sertifikat CA lab).

---

## 1. Arsitektur Singkat

```
Laptop developer / end-user
        │  HTTPS 443 (hosts: 192.168.17.128 eventkita.jehanbravemuslim.com)
        ▼
CapRover nginx (VM 192.168.17.128)
        ├── /            → service srv-captain--eventkita-web  (:3000, Next.js)
        └── /api, /uploads → service srv-captain--eventkita-api (:4000, NestJS)
                                   │
                                   ├── srv-captain--eventkita-db (:5432, PostgreSQL)
                                   └── SMTP mail.jehanbravemuslim.com:465
```

- **Web** memakai rewrites Next.js: `/api/*` dan `/uploads/*` diteruskan ke API internal
  `http://srv-captain--eventkita-api:4000`.
- **API** menangani auth, event, order, tiket, QR, check-in, dan pengiriman e-ticket.
- **Database** adalah one-click app CapRover `eventkita-db`.
- **TLS** memakai sertifikat CA lab karena CapRover 1.16 hanya mendukung Let's Encrypt
  untuk domain publik. Konfigurasi 443 kustom dipulihkan otomatis oleh systemd timer.

---

## 2. Prasyarat

| Komponen | Nilai |
|---|---|
| Proxmox host | `192.168.17.10` (root) |
| VM PaaS | `192.168.17.128`, Ubuntu Server, Docker + CapRover 1.16.0 |
| CapRover GUI | `http://192.168.17.128:3000` |
| Domain | `eventkita.jehanbravemuslim.com` |
| DNS | Bind9 di VM yang sama; A record ke `192.168.17.128` |
| Mail | docker-mailserver + Roundcube; SMTP `mail.jehanbravemuslim.com:465` |
| Repo | `https://github.com/jbravemuslim/eventkita` (**private**) |
| Runner | self-hosted GitHub Actions di VM, label `eventkita` |

Di laptop end-user:

1. Tambahkan hosts (jika DNS lab belum dipakai):
   ```powershell
   # PowerShell sebagai Administrator
   Add-Content C:\Windows\System32\drivers\etc\hosts "192.168.17.128 eventkita.jehanbravemuslim.com"
   ```
2. Percayai CA lab:
   ```powershell
   certutil -user -addstore -f Root "<path>\eventkita-ssl\lab-ca.crt"
   ```
   Ambil `lab-ca.crt` terbaru dari VM: `/home/jehanbravemuslim/eventkita-ssl/lab-ca.crt`.
   Fingerprint-nya harus sama dengan `/opt/eventkita/ssl/lab-ca.crt` di VM.
3. Buka `https://eventkita.jehanbravemuslim.com`.

> Catatan: `curl` di Windows dapat menolak sertifikat CA lab karena tidak ada CRL.
> Untuk uji cepat gunakan `curl --ssl-no-revoke ...` atau `Invoke-WebRequest`.
> Browser tetap aman setelah CA ditambahkan ke Root store.

---

## 3. Setup Awal VM (idempoten)

Semua perubahan permanen dilakukan oleh `setup_k10.py` (jalankan di VM sebagai root).
Peran yang tersedia: `dns`, `cert`, `mail`, `caprover`, `https`, `runner`, `cek`, `semua`.

```bash
# jalankan seluruh bootstrap (DNS, CA/cert, mail, CapRover, HTTPS, cek)
sudo python3 setup_k10.py semua --ip 192.168.17.128
```

Yang dilakukan `semua`:

1. **DNS** — memastikan zone Bind9 memuat A record `eventkita → 192.168.17.128`.
2. **Cert** — membuat CA lab + sertifikat `eventkita.jehanbravemuslim.com`
   di `~/eventkita-ssl/` dan `/opt/eventkita/ssl/`.
3. **Mail** — memastikan akun SMTP `eventkita@jehanbravemuslim.com` ada.
4. **CapRover** — memastikan container `captain-captain`, `captain-nginx`,
   `captain-certbot` berjalan (image `caprover/caprover:1.16.0`).
5. **DNS fix** — menyelaraskan resolver container dengan DNS lab.
6. **HTTPS** — menulis konfigurasi nginx 443 kustom dan mengaktifkan
   `eventkita-ssl-ensure.timer` (restore tiap 60 detik setelah CapRover restart).
7. **Cek** — ringkasan Docker, GUI, DNS, port mail, dan masa berlaku sertifikat.

Verifikasi manual:

```bash
curl -sk --resolve eventkita.jehanbravemuslim.com:443:127.0.0.1 \
  https://eventkita.jehanbravemuslim.com/api/health
# {"status":"ok","database":"up"}
```

### 3.1 Detail HTTPS kustom

| Item | Lokasi |
|---|---|
| Konfigurasi nginx | `/captain/generated/nginx/conf.d/zz-eventkita-ssl.conf` |
| Sertifikat | `/captain/generated/static/certs/eventkita/` |
| Sumber sertifikat | `/home/jehanbravemuslim/eventkita-ssl/`, salinan `/opt/eventkita/ssl/` |
| Pemulih otomatis | `eventkita-ssl-ensure.timer` → `eventkita-ssl-ensure.service` |

CapRover menghapus file kustom di `conf.d` saat restart. Timer di atas menulis ulang
konfigurasi dan me-reload nginx, sehingga HTTPS tetap hidup tanpa langkah manual.

---

## 4. Konfigurasi CapRover (app, database, env, domain)

Login GUI `http://192.168.17.128:3000` (password awal `captain42` — **ganti** setelah
setup), lalu:

1. **Apps** → buat `eventkita-api` (HTTP port `4000`) dan `eventkita-web` (HTTP port `3000`).
2. **One-click Apps** → PostgreSQL `eventkita-db`; catat connection string internal.
3. **eventkita-api → Environment Variables**:

   | Variabel | Contoh |
   |---|---|
   | `DATABASE_URL` | `postgresql://eventkita:<db-pass>@srv-captain--eventkita-db:5432/eventkita?schema=public` |
   | `JWT_SECRET` | string acak panjang |
   | `COOKIE_SECURE` | `true` |
   | `WEB_ORIGIN` | `https://eventkita.jehanbravemuslim.com` |
   | `APP_ORIGIN` | `https://eventkita.jehanbravemuslim.com` |
   | `SMTP_HOST` | `mail.jehanbravemuslim.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_SECURE` | `true` |
   | `SMTP_USER` | `eventkita@jehanbravemuslim.com` |
   | `SMTP_PASSWORD` | `<smtp-pass>` |
   | `SMTP_TLS_REJECT_UNAUTHORIZED` | `false` (CA mail lab) |
   | `SMTP_FROM` | `EventKita <eventkita@jehanbravemuslim.com>` |

4. **eventkita-web → Environment Variables**:

   | Variabel | Nilai |
   |---|---|
   | `API_INTERNAL_URL` | `http://srv-captain--eventkita-api:4000` |

5. **eventkita-web → HTTP Settings** → tambahkan domain
   `eventkita.jehanbravemuslim.com`. Jangan aktifkan Let's Encrypt; TLS ditangani
   konfigurasi 443 kustom (langkah 3.1).

---

## 5. Migrasi & Seed Database

Sekali setelah deploy API pertama (idempoten):

```bash
# di VM PaaS
docker exec -it $(docker ps --filter name=eventkita-api -q) \
  sh -lc "npx prisma migrate deploy"
docker exec -it $(docker ps --filter name=eventkita-api -q) \
  sh -lc "npm run db:seed"
```

Seed membuat:

| Akun | Email | Password |
|---|---|---|
| Admin | `admin@eventkita.local` | `Admin12345!` |
| Staff/Panitia | `staff@eventkita.local` | `Staff12345!` |

Data demo: 4 event (seminar/workshop) beserta tiket.

---

## 6. CI/CD — Git push → build → deploy otomatis

### 6.1 Self-hosted runner

GitHub-hosted runner tidak dapat menjangkau IP privat `192.168.17.128`, jadi runner
dipasang **di dalam VM lab**.

```bash
# 1) Ambil token registrasi (di laptop, gh sudah login)
gh api -X POST repos/jbravemuslim/eventkita/actions/runners/registration-token --jq .token

# 2) Di VM: pasang runner (sekali; token berlaku ±1 jam)
sudo python3 setup_k10.py runner \
  --runner-repo jbravemuslim/eventkita \
  --runner-token <TOKEN>
```

Script mengunduh runner `2.338.2`, mendaftarkan label `eventkita`, lalu memasang
systemd service `actions.runner.jbravemuslim-eventkita.<hostname>`.

Cek status:

```bash
gh api repos/jbravemuslim/eventkita/actions/runners
systemctl status 'actions.runner.*'
```

### 6.2 Secrets repo

GitHub → repo → **Settings → Secrets and variables → Actions**:

| Secret | Nilai |
|---|---|
| `CAPROVER_URL` | `http://127.0.0.1:3000` (runner ada di VM yang sama) |
| `CAPROVER_PASSWORD` | password admin CapRover |

Tidak perlu secret app/database: `scripts/ci_deploy.sh` hanya butuh URL + password,
sedangkan env aplikasi sudah tersimpan di CapRover.

### 6.3 Alur workflow

`.github/workflows/deploy.yml`:

```
git push origin main
  → GitHub Actions (runner: [self-hosted, linux, eventkita])
  → deploy-api  : bash scripts/ci_deploy.sh (APP_NAME=eventkita-api)
  → deploy-web  : bash scripts/ci_deploy.sh (APP_NAME=eventkita-web)
  → smoke-test  : curl HTTPS / dan /api/health
```

`scripts/ci_deploy.sh`:

1. Login CapRover API v2 (`/api/v2/login`).
2. Buat tarball source (tanpa `.git`, `node_modules`, `.next`, `.env`).
3. Tulis `captain-definition` dengan `dockerfilePath` app terkait.
4. Upload ke `appData/<app>/?detached=true`.
5. Poll `isAppBuilding` / `isBuildFailed`; jika gagal, cetak **build log**.
6. Smoke test memakai `--resolve` ke `127.0.0.1` agar tidak tergantung DNS laptop.

Trigger manual:

```bash
gh workflow run deploy.yml --repo jbravemuslim/eventkita --ref main
gh run list --repo jbravemuslim/eventkita --limit 5
```

### 6.4 Catatan build image (lab)

Docker Hub sering timeout dari jaringan lab. Base image karena itu memakai mirror GCR:

```dockerfile
FROM mirror.gcr.io/library/node:24-alpine
```

Jika build gagal `failed to resolve source metadata for docker.io/...`, pre-pull di VM:

```bash
sudo docker pull mirror.gcr.io/library/node:24-alpine
sudo docker tag mirror.gcr.io/library/node:24-alpine node:24-alpine
```

Build log lengkap terlihat di GUI CapRover → app → **Logs**, atau otomatis dicetak
oleh `scripts/ci_deploy.sh` saat `isBuildFailed=true`.

---

## 7. Alur End-user

1. Buka `https://eventkita.jehanbravemuslim.com` (CA lab sudah dipercaya).
2. **Daftar** akun peserta → login.
3. Pilih event → isi data pemesan → buat order.
4. Sistem membuat tiket + QR, lalu mengirim e-ticket ke email via SMTP lab.
5. Buka **Dashboard** → lihat tiket → unduh/tunjukkan QR.
6. Panitia login (`staff@eventkita.local`) → scan/verifikasi kode tiket → check-in.

Verifikasi cepat:

```bash
curl -sk --resolve eventkita.jehanbravemuslim.com:443:127.0.0.1 \
  https://eventkita.jehanbravemuslim.com/api/events
curl -sk --resolve eventkita.jehanbravemuslim.com:443:127.0.0.1 \
  https://eventkita.jehanbravemuslim.com/api/health
```

---

## 8. Troubleshooting

| Gejala | Penyebab umum | Tindakan |
|---|---|---|
| HTTPS mati setelah restart CapRover | file kustom di `conf.d` dihapus | cek `systemctl status eventkita-ssl-ensure.timer`; jalankan `sudo systemctl start eventkita-ssl-ensure.service` |
| `502 Bad Gateway` | service API/web belum siap | `docker service ls`; `docker service logs srv-captain--eventkita-api` |
| Build gagal `no active session ... docker.io` | Docker Hub timeout | pakai mirror GCR / pre-pull image (6.4) |
| Build gagal `npm ci` | registry npm lambat | ulangi workflow; cek koneksi VM |
| Login sukses tapi cookie tidak tersimpan | `COOKIE_SECURE` / origin salah | pastikan `COOKIE_SECURE=true` dan `WEB_ORIGIN`/`APP_ORIGIN` = `https://...` |
| Email tidak terkirim | SMTP/CA mail | cek env `SMTP_*`; `SMTP_TLS_REJECT_UNAUTHORIZED=false`; tes port 465 |
| Runner offline | service mati / permission | `systemctl restart 'actions.runner.*'`; pastikan `/opt/actions-runner` milik user service |
| DNS salah | A record lama | `sudo python3 setup_k10.py dns --ip 192.168.17.128` |
| Sertifikat kedaluwarsa | CA lab | `sudo python3 setup_k10.py cert` lalu `https` |
| Browser menolak cert baru (`SEC_E_UNTRUSTED_ROOT`) | CA di laptop beda dengan CA server | bandingkan fingerprint `lab-ca.crt` laptop vs `/opt/eventkita/ssl/lab-ca.crt`; unduh ulang dari VM lalu `certutil -user -addstore -f Root ...` |

---

## 9. Backup & Pemulihan

```bash
# backup database
docker exec $(docker ps --filter name=eventkita-db -q) \
  pg_dump -U eventkita eventkita > backup-$(date +%F).sql

# restore
cat backup-YYYY-MM-DD.sql | \
  docker exec -i $(docker ps --filter name=eventkita-db -q) \
  psql -U eventkita eventkita
```

Backup juga file `.env`/secret CapRover di tempat aman. **Jangan commit** password,
`JWT_SECRET`, atau file `.env` ke Git.

---

## 10. Checklist Deliverable

- [x] PaaS CapRover aktif di VM Proxmox `192.168.17.128`.
- [x] Dua app + PostgreSQL + reverse proxy HTTPS (CA lab).
- [x] CI/CD `git push` → build → deploy → smoke test (self-hosted runner).
- [x] Database migration + seed data demo.
- [x] Mailer e-ticket + QR.
- [x] SOP developer → end-user (dokumen ini).

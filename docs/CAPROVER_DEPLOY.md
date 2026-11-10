# SOP Deployment EventKita di PaaS CapRover

> Kelompok 10 — Implementasi Platform PaaS untuk Sistem Tiket Event & Seminar Sekolah
> Topologi: VMware Workstation → Proxmox VE (`192.168.17.10`) → Ubuntu VM PaaS (`192.168.17.129`)
> → CapRover (nginx reverse proxy + Docker Swarm) → app `eventkita-web` + `eventkita-api` + PostgreSQL.

---

## 1. Persiapan Host PaaS (VM `192.168.17.129`)

```bash
#ONE_TIME
sudo python3 setup_k10.py paas
```

Yang dilakukan skrip (idempoten):

1. Memasang **Docker Engine** + compose plugin dari repo resmi Docker.
2. Membuat volume `captain` dan container `caprover` (image `caprover/caprover:v4`) dengan
   publish port `80/443/3000` dan mount `/var/run/docker.sock` ( agar PaaS bisa membuat container).
3. Menunggu GUI PaaS merespons di `http://192.168.17.129:3000`.

Manual pertama kali: buka GUI → login password awal `captain42` → **ganti password**.

## 2. DNS & TLS

Di VM lab lama (`192.168.17.128`, Bind9 + mail server):

```bash
sudo python3 setup_k10.py dns     # A record eventkita -> 192.168.17.129
sudo python3 setup_k10.py cert    # sertifikat CA-lab untuk eventkita.jehanbravemuslim.com
sudo python3 setup_k10.py mail    # akun SMTP eventkita@jehanbravemuslim.com
```

Hasil `cert`: `~/eventkita-ssl/eventkita.crt`, `eventkita.key`, `lab-ca.crt`.
Sertifikat diunggah ke CapRover → **SSL Certificates** → domain `eventkita.jehanbravemuslim.com`.

## 3. Konfigurasi PaaS (app, env, database, SSL)

Dari laptop/VM pengontrol:

```bash
python caprover_deploy.py all --host http://192.168.17.129:3000 --password <pw-caprover> \
    --cert eventkita-ssl/eventkita.crt --key eventkita-ssl/eventkita.key
```

Isi otomatis:

| Objek | Nilai |
|---|---|
| App | `eventkita-api` (port 4000), `eventkita-web` (port 3000) |
| Database | one-click PostgreSQL `eventkita-db` → `srv-captain--eventkita-db:5432` |
| Env API | `DATABASE_URL`, `JWT_SECRET`, `COOKIE_SECURE=true`, `WEB_ORIGIN=https://eventkita.jehanbravemuslim.com`, `SMTP_*` → mail server lab |
| Env Web | `API_INTERNAL_URL=http://srv-captain--eventkita-api:4000` |
| Domain | `eventkita.jehanbravemuslim.com` + sertifikat CA-lab, HTTPS aktif |

## 4. Migrasi & Seed Database

```bash
#Inside app eventkita-api ( sekali saja, idempoten)
docker exec -it $(docker ps --filter name=eventkita-api -q) sh -lc "npx prisma migrate deploy"
docker exec -it $(docker ps --filter name=eventkita-api -q) sh -lc "npm run db:seed"
```

Seed membuat akun **admin** (`admin@eventkita.local`) dan **staff/panitia** + acara demo.

## 5. CI/CD — Git push → build → deploy otomatis

Runner GitHub-hosted tidak dapat menjangkau IP privat lab, jadi dipasang **self-hosted runner**
di dalam lab:

```bash
#ONE_TIME# di VM PaaS
sudo python3 setup_k10.py runner --runner-repo OWNER/eventkita --runner-token <TOKEN>
```

Token diperoleh dari GitHub → *Settings → Actions → Runners → New self-hosted runner*.

Secrets repo (Settings → Actions → Secrets):

| Secret | Nilai |
|---|---|
| `CAPROVER_HOST` | `http://192.168.17.129:3000` |
| `CAPROVER_PASSWORD` | password CapRover |
| `CAPROVER_API_APP` | `eventkita-api` |
| `CAPROVER_WEB_APP` | `eventkita-web` |
| `DATABASE_URL` | URL PostgreSQL dari langkah 3 |

Alur otomatis (`.github/workflows/deploy.yml`):

```
git push main  →  GitHub Actions (self-hosted runner)
               →  caprover/deploy-to-caprover-action
               →  build image di server PaaS
               →  deploy ke app eventkita-api & eventkita-web
               →  smoke test /api/health
```

## 6. Verifikasi End-user

1. Buka `https://eventkita.jehanbravemuslim.com` (sertifikat CA-lab: trust `lab-ca.crt` di browser).
2. Daftar sebagai peserta → pilih acara → ambil tiket.
3. E-ticket + QRCODE dikirim ke email (mailer → SMTP `mail.jehanbravemuslim.com:465`).
4. Peserta login ke dashboard → melihat tiket → QR untuk check-in panitia.

Bukti otomatis: `python event_test.py` (DNS → PaaS → HTTPS → API → login → data → email).

## 7. Pemulihan & Pemeliharaan

| Masalah | Tindakan |
|---|---|
| App error setelah deploy | `docker service logs srv-captain--eventkita-api` di host PaaS |
| Migrasi gagal | `npx prisma migrate status` → `migrate deploy` ulang |
| SSL kedaluwarsa | `python setup_k10.py cert` → unggah ulang ke CapRover |
| DNS stale | `python setup_k10.py dns` (rndc reload) |
| Backup DB | `docker exec eventkita-db pg_dump -U eventkita eventkita > backup.sql` |

# Deploy EventKita ke Proxmox (VM + Docker Compose)

Panduan ini untuk VM Linux di Proxmox. Untuk LXC, Docker bisa berjalan tetapi
perlu opsi **nesting**; VM lebih sederhana dan lebih aman untuk production.

---

## 1. Spesifikasi VM

| Komponen | Rekomendasi |
|---|---|
| OS | Ubuntu Server 24.04 LTS |
| CPU | 2 vCPU |
| RAM | 4 GB (minimum 2 GB untuk demo) |
| Disk | 20–32 GB |
| Network | VirtIO, bridge `vmbr0`, IP statis atau DHCP reservation |
| Backup | Proxmox snapshot sebelum upgrade |

Install Docker Engine + Compose plugin:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git ufw

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Logout/login supaya group `docker` aktif.

---

## 2. Ambil project dan konfigurasi

```bash
git clone <URL-REPO> eventkita
cd eventkita
cp .env.example .env
nano .env
```

Wajib diganti:

```dotenv
POSTGRES_PASSWORD=<password-db-kuat>
JWT_SECRET=<openssl rand -base64 48>
SEED_ADMIN_PASSWORD=<password-admin-kuat>
SEED_ADMIN_EMAIL=admin@domain-kamu.com
```

Untuk akses awal lewat IP LAN:

```dotenv
APP_DOMAIN=:80
APP_ORIGIN=http://IP-VM
COOKIE_SECURE=false
```

Untuk domain + HTTPS:

```dotenv
APP_DOMAIN=event.domain-kamu.com
APP_ORIGIN=https://event.domain-kamu.com
COOKIE_SECURE=true
```

Arahkan DNS `A` record ke IP publik VM. Caddy akan mengurus sertifikat HTTPS
otomatis (port 80 dan 443 harus terbuka).

> **Scanner kamera:** browser membutuhkan secure context. Akses lewat
> `http://IP-LAN` membuat kamera diblokir. Gunakan domain + HTTPS, atau input
> kode tiket manual.

---

## 3. Jalankan

```bash
docker compose up -d --build
docker compose --profile tools run --rm seed
docker compose ps
```

Cek:

```bash
curl http://localhost/api/health
docker compose logs -f api
```

Buka `http://IP-VM` atau `https://event.domain-kamu.com`.

---

## 4. Update aplikasi

```bash
bash deploy/scripts/deploy.sh
```

Atau manual:

```bash
git pull --ff-only
docker compose build
docker compose up -d
docker image prune -f
```

Service `migrate` berjalan otomatis sebelum API. Seed tidak dijalankan otomatis
saat update; jalankan manual hanya jika perlu.

---

## 5. Backup dan restore

Backup:

```bash
bash deploy/scripts/backup.sh
```

File tersimpan di `./backups`:

- `db-YYYYMMDD-HHMMSS.sql.gz`
- `uploads-YYYYMMDD-HHMMSS.tar.gz`

Restore database:

```bash
gunzip -c backups/db-YYYYMMDD-HHMMSS.sql.gz \
  | docker compose exec -T db psql -U eventkita eventkita
```

Restore uploads:

```bash
docker compose exec -T api tar xzf - -C /app/uploads \
  < backups/uploads-YYYYMMDD-HHMMSS.tar.gz
```

Jadwalkan backup harian dengan cron:

```cron
0 2 * * * cd /home/ubuntu/eventkita && bash deploy/scripts/backup.sh >> /var/log/eventkita-backup.log 2>&1
```

---

## 6. Keamanan

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

- Jangan buka port PostgreSQL `5432` ke publik.
- Gunakan password acak untuk database, JWT, dan admin.
- Aktifkan `COOKIE_SECURE=true` hanya jika sudah HTTPS.
- Batasi akses SSH (key-based, non-root).
- Update image secara berkala: `docker compose pull && docker compose up -d`.

---

## 7. Troubleshooting

**Login berhasil tetapi langsung logout / cookie tidak terkirim**

- Akses lewat HTTP tetapi `COOKIE_SECURE=true` → set `COOKIE_SECURE=false` untuk
  sementara, atau pasang HTTPS.
- `APP_DOMAIN` salah / DNS belum mengarah ke VM.

**API unhealthy**

```bash
docker compose logs api
docker compose logs db
docker compose exec api wget -qO- http://localhost:4000/api/health
```

**Migrasi gagal**

```bash
docker compose logs migrate
docker compose run --rm migrate npx prisma migrate status
```

**Scanner kamera tidak muncul**

- Pastikan URL `https://...` (bukan `http://IP`).
- Izinkan akses kamera di browser.
- Gunakan input kode tiket manual sebagai fallback.

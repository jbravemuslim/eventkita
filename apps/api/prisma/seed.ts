import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

type DemoTicketType = {
  name: string;
  description: string;
  price: number;
  quota: number;
  maxPerOrder: number;
  sortOrder: number;
};

type DemoEvent = {
  slug: string;
  title: string;
  description: string;
  category: string;
  locationName: string;
  address: string;
  bannerUrl: string;
  startAt: Date;
  endAt: Date;
  timezone: string;
  status: 'PUBLISHED';
  paymentDeadlineHours: number;
  terms: string;
  ticketTypes: DemoTicketType[];
};

const demoEvents: DemoEvent[] = [
  {
    slug: 'workshop-produk-digital-komunitas-2026',
    title: 'Workshop Produk Digital untuk Komunitas',
    description:
      'Workshop intensif satu hari untuk memahami riset pengguna, menyusun alur produk, dan membuat prototipe yang siap diuji. Cocok untuk pengurus komunitas, mahasiswa, dan siapa saja yang ingin membangun produk digital pertama.',
    category: 'Workshop',
    locationName: 'Ruang Kreatif Kemang',
    address: 'Jl. Kemang Raya No. 8, Jakarta',
    bannerUrl:
      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&q=80',
    startAt: new Date('2026-11-21T10:00:00+07:00'),
    endAt: new Date('2026-11-21T16:00:00+07:00'),
    timezone: 'Asia/Jakarta',
    status: 'PUBLISHED',
    paymentDeadlineHours: 24,
    terms:
      'Peserta wajib membawa laptop. Tiket yang sudah dibayar tidak dapat dikembalikan, tetapi dapat dialihkan ke peserta lain maksimal 2 hari sebelum acara.',
    ticketTypes: [
      {
        name: 'Peserta',
        description: 'Akses penuh workshop, materi digital, dan makan siang.',
        price: 75_000,
        quota: 40,
        maxPerOrder: 3,
        sortOrder: 1,
      },
      {
        name: 'Tim (2 orang)',
        description: 'Dua kursi workshop untuk satu tim komunitas.',
        price: 140_000,
        quota: 20,
        maxPerOrder: 2,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: 'meetup-komunitas-kreatif-2026',
    title: 'Meetup Komunitas Kreatif',
    description:
      'Malam santai untuk bertemu kreator, penulis, desainer, dan penggerak komunitas lokal. Akan ada sesi perkenalan, cerita proyek, dan ruang kolaborasi untuk ide-ide baru.',
    category: 'Komunitas',
    locationName: 'Kedai Kolaborasi Senopati',
    address: 'Jl. Senopati No. 12, Jakarta',
    bannerUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=80',
    startAt: new Date('2026-11-28T18:00:00+07:00'),
    endAt: new Date('2026-11-28T21:00:00+07:00'),
    timezone: 'Asia/Jakarta',
    status: 'PUBLISHED',
    paymentDeadlineHours: 24,
    terms:
      'Tiket termasuk satu minuman. Mohon datang tepat waktu agar sesi perkenalan tidak terlewat.',
    ticketTypes: [
      {
        name: 'RSVP',
        description: 'Kursi meetup dan satu minuman.',
        price: 0,
        quota: 60,
        maxPerOrder: 2,
        sortOrder: 1,
      },
      {
        name: 'Supporter',
        description: 'Dukungan untuk komunitas dan merchandise kecil.',
        price: 50_000,
        quota: 20,
        maxPerOrder: 2,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: 'festival-musik-lokal-2026',
    title: 'Festival Musik Lokal 2026',
    description:
      'Satu malam penuh energi bersama musisi lokal pilihan. Festival ini merayakan suara baru dari komunitas musik independen, lengkap dengan pasar kreatif dan ruang bertemu sesama penikmat musik.',
    category: 'Musik',
    locationName: 'Taman Budaya Jakarta',
    address: 'Jl. Gatot Subroto, Jakarta',
    bannerUrl:
      'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1600&q=80',
    startAt: new Date('2026-12-05T15:00:00+07:00'),
    endAt: new Date('2026-12-05T22:00:00+07:00'),
    timezone: 'Asia/Jakarta',
    status: 'PUBLISHED',
    paymentDeadlineHours: 24,
    terms:
      'Tiket berlaku untuk satu orang dan satu kali masuk. Dilarang membawa senjata, minuman keras, atau benda berbahaya ke area festival.',
    ticketTypes: [
      {
        name: 'Presale',
        description: 'Tiket masuk festival untuk 100 pembeli pertama.',
        price: 100_000,
        quota: 100,
        maxPerOrder: 4,
        sortOrder: 1,
      },
      {
        name: 'Festival',
        description: 'Tiket masuk festival reguler.',
        price: 150_000,
        quota: 200,
        maxPerOrder: 6,
        sortOrder: 2,
      },
    ],
  },
  {
    slug: 'seminar-teknologi-komunitas-2026',
    title: 'Seminar Teknologi Komunitas 2026',
    description:
      'Seminar sehari penuh untuk bertemu, belajar, dan berbagi pengalaman bersama komunitas teknologi lokal. Acara ini terbuka untuk pelajar, mahasiswa, dan umum.',
    category: 'Seminar',
    locationName: 'Aula Utama Sekolah',
    address: 'Jl. Pendidikan No. 10, Jakarta',
    bannerUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80',
    startAt: new Date('2026-12-12T09:00:00+07:00'),
    endAt: new Date('2026-12-12T15:00:00+07:00'),
    timezone: 'Asia/Jakarta',
    status: 'PUBLISHED',
    paymentDeadlineHours: 24,
    terms:
      'Tiket yang sudah dibayar tidak dapat dikembalikan. Peserta wajib membawa e-ticket dan menunjukkan QR code saat check-in.',
    ticketTypes: [
      {
        name: 'Early Bird',
        description: 'Harga khusus untuk 50 pendaftar pertama.',
        price: 50_000,
        quota: 50,
        maxPerOrder: 4,
        sortOrder: 1,
      },
      {
        name: 'Regular',
        description: 'Tiket reguler termasuk akses seluruh sesi seminar.',
        price: 75_000,
        quota: 150,
        maxPerOrder: 6,
        sortOrder: 2,
      },
    ],
  },
];

async function upsertUser(input: {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF' | 'PARTICIPANT';
}) {
  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      passwordHash,
      role: input.role,
    },
    create: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
  });
}

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@eventkita.local').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin12345!';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Admin EventKita';

  const staffEmail = (process.env.SEED_STAFF_EMAIL ?? 'staff@eventkita.local').toLowerCase();
  const staffPassword = process.env.SEED_STAFF_PASSWORD ?? 'Staff12345!';
  const staffName = process.env.SEED_STAFF_NAME ?? 'Staff Check-in';

  await upsertUser({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'ADMIN',
  });

  await upsertUser({
    name: staffName,
    email: staffEmail,
    password: staffPassword,
    role: 'STAFF',
  });

  for (const demoEvent of demoEvents) {
    const { ticketTypes, ...eventData } = demoEvent;
    const event = await prisma.event.upsert({
      where: { slug: eventData.slug },
      update: eventData,
      create: eventData,
    });

    for (const ticketType of ticketTypes) {
      await prisma.ticketType.upsert({
        where: {
          eventId_name: {
            eventId: event.id,
            name: ticketType.name,
          },
        },
        update: {
          description: ticketType.description,
          price: ticketType.price,
          quota: ticketType.quota,
          maxPerOrder: ticketType.maxPerOrder,
          sortOrder: ticketType.sortOrder,
          isActive: true,
        },
        create: {
          eventId: event.id,
          ...ticketType,
          isActive: true,
        },
      });
    }

    console.log(`Event : ${eventData.title} (${eventData.slug})`);
  }

  await prisma.setting.upsert({
    where: { key: 'bank_account' },
    update: {
      value:
        'Bank BCA · 1234567890 · a.n. Panitia EventKita (contoh, ganti di menu pengaturan)',
    },
    create: {
      key: 'bank_account',
      value:
        'Bank BCA · 1234567890 · a.n. Panitia EventKita (contoh, ganti di menu pengaturan)',
    },
  });

  console.log('Seed selesai.');
  console.log(`Admin : ${adminEmail} / ${adminPassword}`);
  console.log(`Staff : ${staffEmail} / ${staffPassword}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

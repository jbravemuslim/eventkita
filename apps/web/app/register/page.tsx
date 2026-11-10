'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AuthResponse } from '@eventkita/shared';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/api';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/echoic/auth-field';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Konfirmasi password belum sama.');
      return;
    }

    setLoading(true);

    try {
      await apiFetch<AuthResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          phone: phone.trim() || undefined,
          password,
        }),
      });

      window.dispatchEvent(new Event('eventkita:auth-change'));
      router.push('/dashboard');
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiClientError
          ? caught.message
          : 'Tidak bisa terhubung ke server. Coba lagi.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Akses / Daftar"
      index="02"
      title="Daftar"
      description="Buat satu akun untuk semua acara yang kamu ikuti. Gratis, cepat, dan tanpa biaya tambahan."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error ? (
          <div
            role="alert"
            className="border-l-2 border-rose-400 bg-rose-500/5 px-4 py-3 text-sm leading-6 text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <AuthField
          id="name"
          index="01"
          label="Nama lengkap"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nama sesuai identitas"
          icon={<UserRound />}
        />

        <AuthField
          id="email"
          index="02"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nama@email.com"
          icon={<Mail />}
        />

        <AuthField
          id="phone"
          index="03"
          label="Nomor WhatsApp"
          hint="Opsional"
          type="tel"
          autoComplete="tel"
          maxLength={20}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="08xxxxxxxxxx"
          icon={<Phone />}
        />

        <AuthField
          id="password"
          index="04"
          label="Password"
          hint="Minimal 8 karakter"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Buat password"
          icon={<LockKeyhole />}
          action={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="rounded-full p-2 text-muted transition hover:text-ink"
              aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          }
        />

        <AuthField
          id="confirm-password"
          index="05"
          label="Ulangi password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Ketik ulang password"
          icon={<LockKeyhole />}
        />

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-14 w-full rounded-none text-[10px] uppercase tracking-[0.14em]"
          disabled={loading}
        >
          {loading ? 'Membuat akun…' : 'Buat akun'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-secondary">
        <span>Sudah punya akun?</span>
        <Link href="/login" className="font-semibold text-amber transition hover:text-amber-strong">
          Masuk
        </Link>
      </div>
    </AuthShell>
  );
}

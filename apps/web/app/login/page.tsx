'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AuthResponse } from '@eventkita/shared';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';
import { ApiClientError, apiFetch } from '@/lib/api';
import { AuthShell } from '@/components/auth-shell';
import { AuthField } from '@/components/echoic/auth-field';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await apiFetch<AuthResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      window.dispatchEvent(new Event('eventkita:auth-change'));
      const nextParam = new URLSearchParams(window.location.search).get('next');
      const next =
        nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//')
          ? nextParam
          : '/dashboard';
      router.push(next);
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
      eyebrow="Akses / Masuk"
      index="01"
      title="Masuk"
      description="Kembali ke portal untuk melihat tiket, acara, dan momen yang sudah kamu simpan."
    >
      <form onSubmit={handleSubmit} className="space-y-7">
        {error ? (
          <div
            role="alert"
            className="border-l-2 border-rose-400 bg-rose-500/5 px-4 py-3 text-sm leading-6 text-rose-200"
          >
            {error}
          </div>
        ) : null}

        <AuthField
          id="email"
          index="01"
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
          id="password"
          index="02"
          label="Password"
          hint="Minimal 8 karakter"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password kamu"
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

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-14 w-full rounded-none text-[10px] uppercase tracking-[0.14em]"
          disabled={loading}
        >
          {loading ? 'Memproses…' : 'Masuk ke portal'}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-ink-secondary">
        <span>Belum punya akun?</span>
        <Link href="/register" className="font-semibold text-amber transition hover:text-amber-strong">
          Daftar sekarang
        </Link>
      </div>

      {process.env.NODE_ENV !== 'production' ? (
        <div className="mt-8 border border-dashed border-hairline-strong bg-white/[0.02] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
            Akses demo hasil seed
          </p>
          <p className="mt-2 font-mono text-xs text-ink-secondary">
            admin@eventkita.local · Admin12345!
          </p>
          <p className="font-mono text-xs text-ink-secondary">
            staff@eventkita.local · Staff12345!
          </p>
          <p className="mt-2 text-[11px] leading-5 text-muted">
            Ganti password sebelum dipakai di production.
          </p>
        </div>
      ) : null}
    </AuthShell>
  );
}

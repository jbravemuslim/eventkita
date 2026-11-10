'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PublicUser } from '@eventkita/shared';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { Button } from './ui/button';

export function AuthNav() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!response.ok) {
          if (active) {
            setUser(null);
          }
          return;
        }
        const data = (await response.json()) as { user: PublicUser };
        if (active) {
          setUser(data.user);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadUser();

    const handleAuthChange = () => {
      setLoading(true);
      void loadUser();
    };

    window.addEventListener('eventkita:auth-change', handleAuthChange);

    return () => {
      active = false;
      window.removeEventListener('eventkita:auth-change', handleAuthChange);
    };
  }, []);

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    window.dispatchEvent(new Event('eventkita:auth-change'));
    router.push('/');
    router.refresh();
  }

  if (loading) {
    return <div className="h-8 w-28 animate-pulse rounded-full bg-white/5" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-full px-3 text-[10px] uppercase tracking-[0.12em]"
        >
          <Link href="/login">Masuk</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-full border-ink px-4 text-[10px] uppercase tracking-[0.12em] text-ink hover:bg-ink hover:text-ground"
        >
          <Link href="/register">Daftar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hidden rounded-full text-[10px] uppercase tracking-[0.12em] md:inline-flex"
      >
        <Link href="/dashboard">
          <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
          Dashboard
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-full md:hidden"
      >
        <Link href="/dashboard" aria-label="Buka dashboard">
          <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleLogout}
        className="rounded-full text-[10px] uppercase tracking-[0.12em]"
        aria-label="Keluar"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Keluar</span>
      </Button>
    </div>
  );
}

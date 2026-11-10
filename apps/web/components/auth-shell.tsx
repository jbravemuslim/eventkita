import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { EchoicPage } from '@/components/echoic/page';
import { RemoteImage } from '@/components/echoic/remote-image';
import { driftImage } from '@/components/echoic/data';
import styles from '@/components/echoic/subpage.module.css';

export function AuthShell({
  eyebrow,
  title,
  description,
  index = '01',
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  index?: string;
  children: ReactNode;
}) {
  return (
    <EchoicPage>
      <div className="grid min-h-[calc(100vh-58px)] lg:grid-cols-[1.06fr_0.94fr]">
        <aside className="relative isolate overflow-hidden border-b border-hairline bg-[linear-gradient(135deg,#151a1f,#0a0c0e)] lg:border-b-0 lg:border-r">
          <RemoteImage
            src={driftImage}
            alt=""
            width={1200}
            height={800}
            loading="eager"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-60 saturate-[0.72]"
          />
          <div
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,12,14,0.32),rgba(10,12,14,0.82)_48%,#0a0c0e)]"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(232,145,60,0.2),transparent_42%)]"
            aria-hidden="true"
          />

          <div className="relative flex min-h-[330px] flex-col justify-between p-6 sm:p-10 lg:min-h-[calc(100vh-58px)] lg:p-14">
            <div className="flex items-center justify-between gap-6">
              <span className={`${styles.label} text-ink-secondary`}>EventKita / Akses</span>
              <span className={`${styles.label} text-muted`}>
                {index} <span className="mx-1 text-hairline-strong">—</span> 02
              </span>
            </div>

            <div className="mt-20 max-w-2xl">
              <p className={`${styles.label} text-amber`}>Dari komunitas, untuk komunitas</p>
              <h2
                className={`${styles.display} mt-5 text-[clamp(42px,6.4vw,96px)] font-semibold uppercase leading-[0.88] text-ink`}
              >
                Momen
                <br />
                dimulai
                <br />
                <span className="text-amber">di sini.</span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-ink-secondary">
                Satu pintu untuk menemukan acara, menyimpan tiket, dan bertemu orang-orang
                yang sedang membangun sesuatu di sekitarmu.
              </p>
            </div>

            <div className="mt-20 hidden items-end justify-between gap-6 border-t border-hairline pt-5 lg:flex">
              <span className={`${styles.label} text-muted`}>Jakarta / ID · 2026</span>
              <span className={`${styles.display} text-5xl font-extrabold leading-none text-ink/10`}>
                EK.
              </span>
            </div>
          </div>
        </aside>

        <section className="flex items-center bg-ground px-6 py-14 sm:px-10 lg:px-16 lg:py-20">
          <div className="mx-auto w-full max-w-[460px]">
            <div className="flex items-center gap-2.5">
              <span className="h-1 w-1 rounded-full bg-amber" aria-hidden="true" />
              <p className={`${styles.label} text-muted`}>{eyebrow}</p>
            </div>

            <h1
              className={`${styles.display} mt-5 text-[clamp(44px,5vw,64px)] font-semibold uppercase leading-[0.92] text-ink`}
            >
              {title}
              <span className="text-amber">.</span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-ink-secondary">{description}</p>

            <div className="mt-10">{children}</div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5">
              <span className={`${styles.label} text-muted`}>EventKita / {index}</span>
              <Link
                href="/"
                className={`${styles.label} inline-flex items-center gap-1.5 text-ink-secondary transition-colors hover:text-amber`}
              >
                Kembali ke beranda
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </EchoicPage>
  );
}

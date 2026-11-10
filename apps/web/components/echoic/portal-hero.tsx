'use client';

import { useEffect, useRef } from 'react';
import styles from './echoic.module.css';
import { heroImage } from './data';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function PortalHero() {
  const heroRef = useRef<HTMLElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const duotoneRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleLeftRef = useRef<HTMLSpanElement>(null);
  const titleRightRef = useRef<HTMLSpanElement>(null);
  const dotAmberRef = useRef<HTMLDivElement>(null);
  const dotTealRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const panelLeft = leftPanelRef.current;
    const panelRight = rightPanelRef.current;
    const image = imageRef.current;
    const duotone = duotoneRef.current;
    const title = titleRef.current;
    const titleLeft = titleLeftRef.current;
    const titleRight = titleRightRef.current;
    const dotAmber = dotAmberRef.current;
    const dotTeal = dotTealRef.current;

    if (
      !hero ||
      !panelLeft ||
      !panelRight ||
      !image ||
      !duotone ||
      !title ||
      !titleLeft ||
      !titleRight ||
      !dotAmber ||
      !dotTeal
    ) {
      return;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let scrollAttached = false;

    const applyProgress = (progress: number) => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isMobile = viewportWidth < 768;
      const separation =
        progress * (isMobile ? Math.min(24, viewportWidth * 0.06) : Math.min(100, viewportWidth * 0.12));
      const dotX = progress * Math.min(340, viewportWidth * 0.26);
      const dotY = progress * Math.min(180, viewportHeight * 0.18);
      const titleScale = 1 + progress * (isMobile ? 0.05 : 0.55);

      panelLeft.style.transform = `translateX(-${progress * 105}%)`;
      panelRight.style.transform = `translateX(${progress * 105}%)`;
      image.style.transform = `scale(${1.15 - progress * 0.15})`;
      duotone.style.opacity = String(progress * 0.4);
      titleLeft.style.transform = `translateX(-${separation}px) scale(${titleScale})`;
      titleRight.style.transform = `translateX(${separation}px) scale(${titleScale})`;
      title.style.letterSpacing = `${-0.03 - progress * 0.12}em`;
      dotAmber.style.transform = `translate(calc(-50% - ${dotX}px), calc(-50% - ${dotY}px)) scale(${1 + progress})`;
      dotTeal.style.transform = `translate(calc(-50% + ${dotX}px), calc(-50% + ${dotY}px)) scale(${1 + progress})`;
    };

    const applyReducedState = () => {
      const dotX = Math.min(340, window.innerWidth * 0.26);
      const dotY = Math.min(180, window.innerHeight * 0.18);

      panelLeft.style.transform = 'translateX(-105%)';
      panelRight.style.transform = 'translateX(105%)';
      image.style.transform = 'scale(1)';
      duotone.style.opacity = '0.4';
      titleLeft.style.transform = 'none';
      titleRight.style.transform = 'none';
      title.style.letterSpacing = '-0.03em';
      dotAmber.style.transform = `translate(calc(-50% - ${dotX}px), calc(-50% - ${dotY}px)) scale(2)`;
      dotTeal.style.transform = `translate(calc(-50% + ${dotX}px), calc(-50% + ${dotY}px)) scale(2)`;
    };

    const update = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const limit = Math.max(rect.height - window.innerHeight, 1);
      const progress = clamp(-rect.top / limit, 0, 1);
      applyProgress(progress);
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    const onResize = () => {
      if (media.matches) {
        applyReducedState();
      } else {
        onScroll();
      }
    };

    const configure = () => {
      if (media.matches) {
        if (scrollAttached) {
          window.removeEventListener('scroll', onScroll);
          scrollAttached = false;
        }
        applyReducedState();
      } else {
        if (!scrollAttached) {
          window.addEventListener('scroll', onScroll, { passive: true });
          scrollAttached = true;
        }
        update();
      }
    };

    configure();
    media.addEventListener('change', configure);
    window.addEventListener('resize', onResize);

    return () => {
      media.removeEventListener('change', configure);
      window.removeEventListener('resize', onResize);
      if (scrollAttached) {
        window.removeEventListener('scroll', onScroll);
      }
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <section id="portal-hero" ref={heroRef} className={styles.portalHero} aria-label="Portal EventKita">
      <div className={styles.stickyStage}>
        <div className={`${styles.label} absolute left-6 top-24 z-40 lg:left-12`}>
          SEJAK 2026 / INDONESIA
        </div>
        <div
          className={`${styles.label} absolute right-6 top-24 z-40 hidden text-right sm:block lg:right-12`}
        >
          EVT—001 / BERANDA
        </div>

        <div
          className={`${styles.label} absolute bottom-12 left-6 z-40 flex flex-col gap-2 lg:left-12`}
        >
          <span>JAKARTA, ID</span>
          <span className="h-px w-12 bg-hairline" aria-hidden="true" />
          <span className="text-muted">DARI KOMUNITAS, UNTUK KOMUNITAS</span>
        </div>

        <img
          id="hero-img"
          ref={imageRef}
          src={heroImage}
          alt="Suasana acara komunitas yang ramai"
          width={1920}
          height={1080}
          loading="eager"
          decoding="async"
          className={styles.heroImage}
        />
        <div
          id="hero-duotone"
          ref={duotoneRef}
          className={styles.duotoneOverlay}
          aria-hidden="true"
        />
        <div className={styles.radialVeil} aria-hidden="true" />

        <div
          id="panel-left"
          ref={leftPanelRef}
          className={`${styles.portalPanel} ${styles.panelLeft}`}
          aria-hidden="true"
        />
        <div
          id="panel-right"
          ref={rightPanelRef}
          className={`${styles.portalPanel} ${styles.panelRight}`}
          aria-hidden="true"
        />

        <div
          id="dot-amber"
          ref={dotAmberRef}
          className={`${styles.accentDot} ${styles.dotAmber}`}
          aria-hidden="true"
        />
        <div
          id="dot-teal"
          ref={dotTealRef}
          className={`${styles.accentDot} ${styles.dotTeal}`}
          aria-hidden="true"
        />

        <h1
          id="hero-title"
          ref={titleRef}
          className={`${styles.wordmarkContainer} ${styles.display} text-[clamp(30px,8.8vw,128px)] font-extrabold uppercase md:text-[5.6vw]`}
          aria-label="EventKita"
        >
          <span id="title-left" ref={titleLeftRef} className={styles.titlePart} aria-hidden="true">
            EVENT
          </span>
          <span
            id="title-right"
            ref={titleRightRef}
            className={styles.titlePart}
            aria-hidden="true"
          >
            KITA
          </span>
        </h1>
      </div>
    </section>
  );
}

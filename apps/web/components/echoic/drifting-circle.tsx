'use client';

import { useEffect, useRef } from 'react';
import styles from './echoic.module.css';
import { driftImage } from './data';

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function DriftingCircle() {
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const circle = circleRef.current;
    if (!circle) {
      return;
    }

    const section = circle.closest('section');
    if (!section) {
      return;
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const apply = () => {
      if (media.matches) {
        circle.style.transform = 'translateY(-50%)';
        return;
      }

      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = clamp(
        (viewportHeight - rect.top) / (viewportHeight + rect.height),
        0,
        1,
      );

      circle.style.transform = `translateY(calc(-50% + ${progress * 150}px)) rotate(${progress * 45}deg)`;
    };

    const update = () => {
      frame = 0;
      apply();
    };

    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    const onResize = () => {
      onScroll();
    };

    const onMotionChange = () => {
      onScroll();
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    media.addEventListener('change', onMotionChange);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      media.removeEventListener('change', onMotionChange);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      id="drifting-circle"
      ref={circleRef}
      className={styles.driftCircle}
      aria-hidden="true"
    >
      <img
        src={driftImage}
        alt=""
        width={1200}
        height={1200}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover grayscale"
      />
    </div>
  );
}

'use client';

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import styles from './echoic.module.css';
import type { LandingEvent } from './data';

const THROW_DURATION = 650;

type Direction = -1 | 1;

type ThrowState = {
  id: string;
  direction: Direction;
} | null;

export function Deck({ events }: { events: LandingEvent[] }) {
  const [order, setOrder] = useState<number[]>(() => events.map((_, index) => index));
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [throwState, setThrowState] = useState<ThrowState>(null);
  const [status, setStatus] = useState(() =>
    events[0] ? `Menampilkan ${events[0].title} di ${events[0].location}` : 'Belum ada acara',
  );

  const deckRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const dragXRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const animatingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionRef.current = media.matches;

    const onChange = () => {
      reducedMotionRef.current = media.matches;
    };

    media.addEventListener('change', onChange);

    return () => {
      media.removeEventListener('change', onChange);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const topIndex = order[0] ?? 0;
  const topEvent = events[topIndex];

  const finishThrow = (direction: Direction) => {
    if (animatingRef.current || events.length < 2) {
      return;
    }

    const rotateOrder = () => [...order.slice(1), order[0]];
    const nextOrder = rotateOrder();

    const announceNext = (next: number[]) => {
      const event = events[next[0]];
      if (event) {
        setStatus(`Menampilkan ${event.title} di ${event.location}`);
      }
    };

    setDragging(false);
    setDragX(0);
    dragXRef.current = 0;

    if (reducedMotionRef.current) {
      setOrder(nextOrder);
      announceNext(nextOrder);
      return;
    }

    animatingRef.current = true;
    setThrowState({ id: topEvent.id, direction });

    timeoutRef.current = setTimeout(() => {
      setOrder(nextOrder);
      setThrowState(null);
      announceNext(nextOrder);
      animatingRef.current = false;
      timeoutRef.current = null;
    }, THROW_DURATION);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (animatingRef.current || throwState || events.length < 2) {
      return;
    }

    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    const deck = deckRef.current;
    if (!deck) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    dragXRef.current = 0;
    setDragging(true);
    setDragX(0);
    deck.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const delta = event.clientX - startXRef.current;
    dragXRef.current = delta;
    setDragX(delta);
  };

  const resetDrag = () => {
    pointerIdRef.current = null;
    dragXRef.current = 0;
    setDragging(false);
    setDragX(0);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const deck = deckRef.current;
    if (deck?.hasPointerCapture(event.pointerId)) {
      deck.releasePointerCapture(event.pointerId);
    }

    pointerIdRef.current = null;
    const delta = dragXRef.current;
    const threshold = (deck?.offsetWidth ?? 440) / 4;

    if (Math.abs(delta) > threshold) {
      finishThrow(delta > 0 ? 1 : -1);
    } else {
      resetDrag();
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    const deck = deckRef.current;
    if (deck?.hasPointerCapture(event.pointerId)) {
      deck.releasePointerCapture(event.pointerId);
    }

    resetDrag();
  };

  const handleLostPointerCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current === event.pointerId) {
      resetDrag();
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      finishThrow(1);
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      finishThrow(-1);
    }
  };

  const getCardStyle = (eventId: string, position: number): CSSProperties => {
    if (throwState?.id === eventId) {
      return {
        zIndex: 20,
        transform: `translate(${throwState.direction * 120}vw, -100px) rotate(${
          throwState.direction * 45
        }deg) scale(1.1)`,
        opacity: 0,
        transition: 'transform 0.65s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.65s ease',
        pointerEvents: 'none',
      };
    }

    if (position === 0) {
      const transform = dragging
        ? `translate(${dragX}px, ${Math.abs(dragX) / 10}px) rotate(${
            dragX / 20
          }deg) scale(${1 + Math.abs(dragX) / 2000})`
        : 'translate(0, 0) rotate(0deg) scale(1)';

      return {
        zIndex: events.length + 1,
        transform,
        opacity: 1,
        pointerEvents: 'auto',
        transition: dragging ? 'none' : undefined,
        cursor: dragging ? 'grabbing' : 'grab',
      };
    }

    const offset = position * 8;
    const rotate = (position % 2 === 0 ? 1 : -1) * (position * 2);
    const scale = 1 - position * 0.04;

    return {
      zIndex: events.length - position,
      transform: `translate(${offset}px, ${offset}px) rotate(${rotate}deg) scale(${scale})`,
      opacity: 0.7,
      pointerEvents: 'none',
    };
  };

  if (!events.length) {
    return (
      <div className="flex aspect-square w-full max-w-[440px] flex-col items-center justify-center rounded border border-hairline bg-ground-alt p-8 text-center">
        <p className={`${styles.label} text-amber`}>Belum ada acara</p>
        <p className="mt-3 max-w-xs text-sm leading-6 text-ink-secondary">
          Pantau terus halaman ini atau daftar sebagai panitia untuk mulai membuat acara.
        </p>
        <Link
          href="/register"
          className={`${styles.label} mt-6 inline-flex h-10 items-center gap-2 border border-ink px-5 text-ink transition hover:bg-ink hover:text-ground`}
        >
          Untuk Panitia
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div
        id="deck"
        ref={deckRef}
        className={styles.cardDeck}
        tabIndex={0}
        role="group"
        aria-roledescription="deck acara yang bisa dilempar"
        aria-label="Deck acara EventKita"
        aria-describedby="deck-instructions"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handleLostPointerCapture}
        onKeyDown={handleKeyDown}
      >
        {order.map((eventIndex, position) => {
          const event = events[eventIndex];

          return (
            <article
              key={event.id}
              data-id={event.id}
              className={styles.deckCard}
              style={getCardStyle(event.id, position)}
            >
              <img
                src={event.image}
                alt={event.alt}
                width={900}
                height={900}
                loading="lazy"
                decoding="async"
                draggable={false}
                className={styles.cardImage}
              />
              <div className={styles.cardBody}>
                <div className="flex items-start justify-between gap-3">
                  <span className={`${styles.label} text-amber`}>
                    {event.categoryCode} / {event.category}
                  </span>
                  <span className={`${styles.label} shrink-0 text-[9px] text-muted`}>
                    {event.date}
                  </span>
                </div>
                <h3 className={`${styles.display} line-clamp-2 text-base uppercase leading-tight min-[360px]:text-lg min-[380px]:text-xl md:text-2xl`}>
                  {event.title}
                </h3>
                <p className={`${styles.label} truncate text-[10px] text-muted`}>
                  {event.location}
                </p>
                <p className={`${styles.label} text-[10px] text-ink-secondary`}>{event.price}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 flex w-full max-w-[440px] items-center gap-6 md:gap-12">
        <span className="h-px flex-1 bg-hairline md:w-24 md:flex-none" aria-hidden="true" />
        <div id="deck-dots" className="flex gap-2" aria-hidden="true">
          {events.map((event, index) => (
            <span
              key={event.id}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                index === topIndex ? 'bg-ink' : 'bg-hairline'
              }`}
            />
          ))}
        </div>
        <span className="h-px flex-1 bg-hairline md:w-24 md:flex-none" aria-hidden="true" />
      </div>
      <p id="deck-instructions" className={`${styles.label} mt-4 text-[9px] text-muted`}>
        {events.length > 1
          ? 'LEMPAR UNTUK BERGESER / PANAH UNTUK MEMBALIK'
          : 'SATU ACARA PILIHAN'}
      </p>
      {topEvent?.slug ? (
        <Link
          href={`/events/${topEvent.slug}`}
          className={`${styles.label} mt-5 inline-flex h-11 items-center gap-3 border border-ink px-6 text-ink transition hover:bg-ink hover:text-ground`}
        >
          Lihat detail acara
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      ) : null}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {status}
      </p>
    </>
  );
}

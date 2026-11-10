import type { ApiErrorBody, PublicEvent } from '@eventkita/shared';

const serverApiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

export async function getPublicEvents(): Promise<PublicEvent[]> {
  try {
    const response = await fetch(`${serverApiUrl}/api/events`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as PublicEvent[];
  } catch {
    return [];
  }
}

export async function getPublicEvent(slug: string): Promise<PublicEvent | null> {
  try {
    const response = await fetch(
      `${serverApiUrl}/api/events/${encodeURIComponent(slug)}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as PublicEvent;
  } catch {
    return null;
  }
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: string | string[],
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);

  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  const data = (await response.json().catch(() => null)) as T | ApiErrorBody | null;

  if (!response.ok) {
    const body = data as ApiErrorBody | null;
    const message = Array.isArray(body?.message)
      ? body.message[0]
      : body?.message ?? 'Terjadi kesalahan. Coba lagi.';
    throw new ApiClientError(message, response.status, body?.message);
  }

  return data as T;
}

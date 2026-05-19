/**
 * SWR-compatible fetcher with typed error handling.
 * Throws FetchError on non-2xx responses so SWR surfaces it in `error`.
 */
export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly info: unknown
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    throw new FetchError(
      (info as { error?: string }).error ?? `Request failed (${res.status})`,
      res.status,
      info
    );
  }
  return res.json() as Promise<T>;
}

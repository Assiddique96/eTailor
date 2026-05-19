/**
 * @deprecated Use SWR directly with the `fetcher` from `@/lib/fetcher` instead.
 *
 * This thin wrapper maintains backward compatibility for existing page components
 * while they are progressively migrated to SWR. It delegates to SWR internally,
 * so all requests are now cached, deduplicated, and revalidated on focus.
 *
 * Migration guide:
 *   Before:
 *     const { data, loading, error, refetch } = useFetch<{ jobs: Job[] }>("/api/jobs");
 *
 *   After:
 *     import useSWR from "swr";
 *     import { fetcher } from "@/lib/fetcher";
 *     const { data, isLoading, error, mutate } = useSWR<{ jobs: Job[] }>("/api/jobs", fetcher);
 */
"use client";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useFetch<T>(url: string, _deps: unknown[] = []) {
  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  return {
    data: data ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    refetch: () => mutate(),
  };
}

"use client";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";

/**
 * Global SWR configuration provider.
 * Wraps the portal layout so all useSWR calls share the same config:
 * - Typed fetcher
 * - Revalidate on window focus (catches stale data after switching tabs)
 * - Error retry with exponential backoff (built-in SWR default)
 */
export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}

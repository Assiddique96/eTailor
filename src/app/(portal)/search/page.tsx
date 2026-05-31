"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

type ResultItem = Record<string, unknown>;
type SearchResult = { type: "customer" | "job" | "invoice"; item: ResultItem };

const TYPE_CONFIG = {
  customer: {
    label: "Customer", icon: "👤",
    color: "var(--info)", bg: "var(--info-light)",
    href: (id: string) => `/customers/${id}`,
  },
  job: {
    label: "Job", icon: "🧵",
    color: "var(--warn)", bg: "var(--warn-light)",
    href: () => `/jobs`,
  },
  invoice: {
    label: "Invoice", icon: "💳",
    color: "var(--success)", bg: "var(--success-light)",
    href: () => `/billing`,
  },
};

function ResultCard({ result }: { result: SearchResult }) {
  const config = TYPE_CONFIG[result.type];
  const item   = result.item;
  const id     = item.id as string;

  const title =
    result.type === "customer"
      ? `${item.firstName} ${item.lastName}`
      : result.type === "job"
      ? (item.title as string)
      : (item.invoiceNumber as string);

  const subtitle =
    result.type === "customer"
      ? [item.phone, item.email].filter(Boolean).join(" · ")
      : result.type === "job"
      ? `Status: ${String(item.status).replace(/_/g, " ")}`
      : `Total: $${Number(item.total).toFixed(2)} · ${item.paymentStatus}`;

  return (
    <Link
      href={config.href(id)}
      className="card p-4 flex items-center gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors group"
    >
      <div
        className="h-9 w-9 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{ background: config.bg, color: config.color }}
        aria-hidden
      >
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm group-hover:text-brand transition-colors">{title}</p>
        {subtitle && <p className="text-xs text-secondary mt-0.5 truncate">{subtitle}</p>}
      </div>
      <span className="badge text-xs shrink-0" style={{ background: config.bg, color: config.color }}>
        {config.label}
      </span>
    </Link>
  );
}

export default function SearchPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery]       = useState("");
  const [debouncedQ, setDebounced] = useState("");

  // Auto-focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // 300 ms debounce — avoids firing on every keystroke
  useEffect(() => {
    if (query.length < 2) { setDebounced(""); return; }
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // SWR key is null when query is too short — prevents the request entirely
  const swrKey = debouncedQ.length >= 2
    ? `/api/search?q=${encodeURIComponent(debouncedQ)}`
    : null;

  const { data, isLoading } = useSWR<{ results: SearchResult[] }>(swrKey, fetcher);
  const results = data?.results ?? [];

  const grouped = {
    customer: results.filter((r) => r.type === "customer"),
    job:      results.filter((r) => r.type === "job"),
    invoice:  results.filter((r) => r.type === "invoice"),
  };

  const searching = query.length >= 2 && (isLoading || debouncedQ !== query);

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-secondary mt-0.5">Find customers, jobs, and invoices instantly.</p>
      </div>

      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" aria-hidden
        >
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, job title, invoice number…"
          className="field pl-10 pr-4 py-3 text-base"
          aria-label="Search"
          role="searchbox"
        />
        {searching && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden>
            <svg className="animate-spin text-muted" width="16" height="16"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
        )}
      </div>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-muted text-center py-4">Type at least 2 characters to search.</p>
      )}

      {!searching && debouncedQ.length >= 2 && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3" aria-hidden>🔍</p>
          <p className="font-medium">No results for "{debouncedQ}"</p>
          <p className="text-sm text-secondary mt-1">Try a different search term.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-5">
          <p className="text-xs text-muted">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {(["customer", "job", "invoice"] as const).map((type) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const config = TYPE_CONFIG[type];
            return (
              <div key={type}>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: config.color }}
                >
                  {config.label}s
                </p>
                <div className="space-y-2">
                  {items.map((r, i) => <ResultCard key={i} result={r} />)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}




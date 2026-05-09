"use client";

import { useState } from "react";

type SearchResult = {
  type: "customer" | "job" | "invoice";
  item: Record<string, unknown>;
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  async function runSearch() {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results ?? []);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Global Search</h2>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer, job, invoice..."
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <button onClick={runSearch} className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700">
          Search
        </button>
      </div>
      <div className="space-y-2">
        {results.map((r, i) => (
          <pre key={`${r.type}-${i}`} className="overflow-x-auto rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            {JSON.stringify(r, null, 2)}
          </pre>
        ))}
      </div>
    </div>
  );
}

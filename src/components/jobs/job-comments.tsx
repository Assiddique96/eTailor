"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/toast";

type Comment = {
  id: string; body: string; createdAt: string;
  user: { id: string; fullName: string };
};

export function JobComments({ jobId }: { jobId: string }) {
  const { toast } = useToast();
  const [body, setBody]       = useState("");
  const [posting, setPosting] = useState(false);

  const { data, mutate } = useSWR<{ comments: Comment[] }>(
    `/api/jobs/${jobId}/comments`, fetcher
  );
  const comments = data?.comments ?? [];

  async function post() {
    if (!body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim() }),
      });
      if (!res.ok) { toast("Failed to post comment.", "error"); return; }
      setBody("");
      mutate();
    } catch { toast("Network error.", "error"); }
    finally { setPosting(false); }
  }

  function initials(name: string) {
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-secondary uppercase tracking-wide">
        Comments ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-muted text-center py-4">No comments yet — start the conversation.</p>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
              style={{ background: "var(--brand-light)", color: "var(--brand)" }}
              aria-hidden
            >
              {initials(c.user.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{c.user.fullName}</span>
                <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-secondary mt-0.5 leading-relaxed">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Compose */}
      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="field flex-1 resize-none"
          onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post(); }}
          aria-label="Comment text"
        />
        <button
          className="btn btn-primary btn-sm self-end"
          onClick={post}
          disabled={posting || !body.trim()}
        >
          {posting ? "…" : "Post"}
        </button>
      </div>
      <p className="text-xs text-muted">⌘+Enter to post</p>
    </div>
  );
}




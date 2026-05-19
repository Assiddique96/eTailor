"use client";
import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/page-header";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type Customer = { id: string; firstName: string; lastName: string };
type Message = {
  id: string; channel: string; subject?: string; message: string; sentAt: string;
  customer: { firstName: string; lastName: string };
};

const CHANNEL_ICON: Record<string, string> = {
  APP: "💬", EMAIL: "✉️", WHATSAPP: "📱", SMS: "📨",
};

const CHANNELS = ["APP", "EMAIL", "WHATSAPP", "SMS"] as const;

const DEFAULT_FORM = { customerId: "", channel: "APP", subject: "", message: "" };

export default function MessagesPage() {
  const { toast } = useToast();
  const [filterChannel, setFilterChannel] = useState("ALL");
  const [form, setForm]       = useState(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});

  const { data: custData } = useSWR<{ customers: Customer[] }>("/api/customers", fetcher);
  const { data: msgData, isLoading, mutate } = useSWR<{ messages: Message[] }>("/api/messages", fetcher);

  const customers = custData?.customers ?? [];
  const messages  = msgData?.messages   ?? [];
  const filtered  = filterChannel === "ALL" ? messages : messages.filter((m) => m.channel === filterChannel);

  function field(name: keyof typeof DEFAULT_FORM) {
    return {
      value: form[name],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [name]: e.target.value })),
    };
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerId) e.customerId = "Select a customer.";
    if (!form.message.trim()) e.message = "Message cannot be empty.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSend() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          channel:    form.channel,
          subject:    form.subject || undefined,
          message:    form.message,
        }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error ?? "Failed.", "error"); return; }
      toast("Message logged.");
      setForm(DEFAULT_FORM);
      setErrors({});
      mutate();
    } catch {
      toast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Messages"
        subtitle="Log and track client communications"
      />

      {/* Compose form */}
      <div className="card p-5">
        <h2 className="font-medium text-sm text-secondary uppercase tracking-wide mb-4">
          Log a message
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Customer *</label>
            <select className="field" {...field("customerId")}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
            {errors.customerId && <p className="text-xs text-danger">{errors.customerId}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Channel</label>
            <select className="field" {...field("channel")}>
              {CHANNELS.map((ch) => (
                <option key={ch} value={ch}>{CHANNEL_ICON[ch]} {ch}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Subject</label>
            <input className="field" placeholder="e.g. Order update" {...field("subject")} />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Message *</label>
            <input className="field" placeholder="Message content…" {...field("message")} />
            {errors.message && <p className="text-xs text-danger">{errors.message}</p>}
          </div>

          <div className="sm:col-span-2 flex justify-end pt-1">
            <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={submitting}>
              {submitting ? "Saving…" : "Log message"}
            </button>
          </div>
        </div>
      </div>

      {/* Channel filter */}
      <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filter by channel">
        <span className="text-xs text-muted font-medium">Filter:</span>
        {["ALL", ...CHANNELS].map((ch) => (
          <button
            key={ch}
            onClick={() => setFilterChannel(ch)}
            className={`btn btn-sm ${filterChannel === ch ? "btn-primary" : "btn-ghost"}`}
            aria-pressed={filterChannel === ch}
          >
            {ch !== "ALL" && CHANNEL_ICON[ch]} {ch}
          </button>
        ))}
      </div>

      {/* Message list */}
      {isLoading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="💬"
            title={filterChannel !== "ALL" ? `No ${filterChannel} messages` : "No messages yet"}
            description="Log your first customer communication above."
          />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl" aria-hidden>{CHANNEL_ICON[m.channel] ?? "💬"}</span>
                  <div>
                    <p className="font-medium text-sm">
                      {m.customer.firstName} {m.customer.lastName}
                      {m.subject && (
                        <span className="text-muted font-normal"> — {m.subject}</span>
                      )}
                    </p>
                    <p className="text-sm text-secondary mt-0.5">{m.message}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className="badge text-xs"
                    style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}
                  >
                    {m.channel}
                  </span>
                  <p className="text-xs text-muted mt-1">
                    {new Date(m.sentAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

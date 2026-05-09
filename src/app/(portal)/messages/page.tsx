"use client";
import { FormEvent, useEffect, useState, useRef } from "react";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

type Customer = { id: string; firstName: string; lastName: string };
type Message = {
  id: string; channel: string; subject?: string; message: string; sentAt: string;
  customer: { firstName: string; lastName: string };
};

const CHANNEL_ICON: Record<string, string> = {
  APP: "💬", EMAIL: "✉️", WHATSAPP: "📱", SMS: "📨",
};

export default function MessagesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterChannel, setFilterChannel] = useState("ALL");
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  async function load() {
    const [cRes, mRes] = await Promise.all([fetch("/api/customers"), fetch("/api/messages")]);
    const cData = await cRes.json();
    const mData = await mRes.json();
    setCustomers(cData.customers ?? []);
    setMessages(mData.messages ?? []);
  }

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  async function onSend(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: fd.get("customerId"),
          channel: fd.get("channel"),
          subject: fd.get("subject"),
          message: fd.get("message"),
        }),
      });
      if (!res.ok) { const err = await res.json(); toast(err.error || "Failed.", "error"); return; }
      toast("Message logged.");
      formRef.current?.reset();
      await load();
    } catch { toast("Network error.", "error"); }
    finally { setSubmitting(false); }
  }

  const filtered = messages.filter((m) => filterChannel === "ALL" || m.channel === filterChannel);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-secondary mt-0.5">Log and track client communications.</p>
      </div>

      {/* Log message form */}
      <div className="card p-5">
        <h2 className="font-medium mb-4">Log a message</h2>
        <form ref={formRef} onSubmit={onSend} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Customer *</label>
            <select name="customerId" required className="field">
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Channel</label>
            <select name="channel" className="field">
              {["APP","EMAIL","WHATSAPP","SMS"].map((ch) => (
                <option key={ch} value={ch}>{CHANNEL_ICON[ch]} {ch}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Subject</label>
            <input name="subject" placeholder="e.g. Order update" className="field" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-secondary">Message *</label>
            <input name="message" required placeholder="Message content…" className="field" />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-1">
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? "Saving…" : "Log message"}
            </button>
          </div>
        </form>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted font-medium">Filter:</span>
        {["ALL","APP","EMAIL","WHATSAPP","SMS"].map((ch) => (
          <button
            key={ch}
            onClick={() => setFilterChannel(ch)}
            className={`btn btn-sm ${filterChannel === ch ? "btn-primary" : "btn-ghost"}`}
          >
            {ch !== "ALL" && CHANNEL_ICON[ch]} {ch}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="text-4xl mb-3">💬</p>
          <p className="font-medium">No messages {filterChannel !== "ALL" ? `via ${filterChannel}` : "yet"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{CHANNEL_ICON[m.channel] ?? "💬"}</span>
                  <div>
                    <p className="font-medium text-sm">
                      {m.customer.firstName} {m.customer.lastName}
                      {m.subject && <span className="text-muted font-normal"> — {m.subject}</span>}
                    </p>
                    <p className="text-sm text-secondary mt-0.5">{m.message}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--bg-base)", color: "var(--text-muted)" }}>{m.channel}</span>
                  <p className="text-xs text-muted mt-1">{new Date(m.sentAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

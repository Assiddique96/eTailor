"use client";

import { FormEvent, useEffect, useState } from "react";

type Customer = { id: string; firstName: string; lastName: string };
type Message = { id: string; channel: string; message: string; customer: Customer; sentAt: string };

export default function MessagesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  async function load() {
    const [cRes, mRes] = await Promise.all([fetch("/api/customers"), fetch("/api/messages")]);
    const cData = await cRes.json();
    const mData = await mRes.json();
    setCustomers(cData.customers ?? []);
    setMessages(mData.messages ?? []);
  }

  useEffect(() => {
    Promise.all([fetch("/api/customers"), fetch("/api/messages")])
      .then(async ([cRes, mRes]) => {
        const cData = await cRes.json();
        const mData = await mRes.json();
        setCustomers(cData.customers ?? []);
        setMessages(mData.messages ?? []);
      });
  }, []);

  async function onSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: formData.get("customerId"),
        channel: formData.get("channel"),
        subject: formData.get("subject"),
        message: formData.get("message"),
      }),
    });
    event.currentTarget.reset();
    await load();
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-semibold">Client Communication</h2>
      <form onSubmit={onSendMessage} className="grid gap-2 rounded-xl border border-zinc-200 bg-white p-4 md:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
        <select name="customerId" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
          <option value="">Select Customer</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
        <select name="channel" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950">
          <option value="APP">APP</option>
          <option value="EMAIL">EMAIL</option>
          <option value="WHATSAPP">WHATSAPP</option>
          <option value="SMS">SMS</option>
        </select>
        <input name="subject" placeholder="Subject" className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <input name="message" placeholder="Message text" required className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950" />
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">Send / Log Message</button>
      </form>

      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-medium">{m.channel} to {m.customer.firstName} {m.customer.lastName}</p>
            <p className="text-zinc-700 dark:text-zinc-200">{m.message}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(m.sentAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

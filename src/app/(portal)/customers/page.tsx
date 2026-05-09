"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCustomers(search = "") {
    const res = await fetch(`/api/customers${search ? `?q=${encodeURIComponent(search)}` : ""}`);
    const data = await res.json();
    setCustomers(data.customers ?? []);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function onCreateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    // CRITICAL FIX: Capture the form reference before any awaits
    const form = event.currentTarget; 
    const formData = new FormData(form);
    
    setLoading(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.get("firstName"),
          lastName: formData.get("lastName"),
          phone: formData.get("phone"),
          preferredStyle: formData.get("preferredStyle"),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        // If 403, this will now show the permission error message
        alert(err.error || "Failed to create");
        return;
      }

      form.reset(); // Uses the captured reference
      await loadCustomers(query);
    } catch (error) {
      alert("Network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Manage Customers</h2>
      
      <form onSubmit={onCreateCustomer} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 bg-white dark:bg-zinc-900 border rounded-xl">
        <input name="firstName" placeholder="First Name" required className="p-2 border rounded-md dark:bg-zinc-800" />
        <input name="lastName" placeholder="Last Name" required className="p-2 border rounded-md dark:bg-zinc-800" />
        <input name="phone" placeholder="Phone" className="p-2 border rounded-md dark:bg-zinc-800" />
        <input name="preferredStyle" placeholder="Style" className="p-2 border rounded-md dark:bg-zinc-800" />
        <button 
          disabled={loading}
          className="bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Add Customer"}
        </button>
      </form>

      {/* Search and List logic continues below... */}
      {/* Customers List */}
      <div className="space-y-2">
        {customers.length === 0 ? (
          <p className="text-sm text-zinc-500">No customers found.</p>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-medium">
                <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline dark:text-blue-400">
                  {c.firstName} {c.lastName}
                </Link>
              </p>
              <p className="text-zinc-600 dark:text-zinc-300">
                {c.phone || "No phone"} | {c.preferredStyle || "No style preference"}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
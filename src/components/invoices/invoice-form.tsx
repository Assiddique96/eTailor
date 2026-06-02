'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface InvoiceFormProps {
  customerId: string;
  onSubmit: (invoiceData: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function InvoiceForm({
  customerId,
  onSubmit,
  onCancel,
  isLoading = false,
}: InvoiceFormProps) {
  const { data: jobsData } = useSWR<{ jobs: any[] }>(
    `/api/jobs?customerId=${customerId}&unbilled=true`,
    fetcher
  );

  const [selectedJobId, setSelectedJobId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<any[]>([]);

  const jobs = jobsData?.jobs || [];
  const selectedJob = jobs.find((j: any) => j.id === selectedJobId);

  // Auto-populate line items when job is selected
  useEffect(() => {
    if (selectedJob) {
      const items = selectedJob.tasks.map((task: any) => ({
        description: `${task.garmentType}${task.description ? ` - ${task.description}` : ''}`,
        quantity: task.quantity,
        unitPrice: task.unitPrice || 0,
      }));
      setLineItems(items);
    } else {
      setLineItems([]);
    }
  }, [selectedJob]);

  // Line item helpers (editable, similar to billing create modal)
  function updateLine(i: number, field: string, value: string | number) {
    setLineItems((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  }
  function addLine() { setLineItems((l) => [...l, { description: '', quantity: 1, unitPrice: 0 }]); }
  function removeLine(i: number) { if (lineItems.length === 1) return; setLineItems((l) => l.filter((_, idx) => idx !== i)); }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const computedSubtotal = lineItems.reduce((s: number, item: any) => s + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
    const total = computedSubtotal - (parseFloat(discount) || 0) + (parseFloat(tax) || 0);

    const invoiceData = {
      customerId,
      jobId: selectedJobId || undefined,
      subtotal: computedSubtotal,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      total,
      dueAt: dueDate ? new Date(dueDate) : undefined,
      notes,
      lineItems: lineItems.map((l) => ({ description: l.description, quantity: Number(l.quantity) || 1, unitPrice: Number(l.unitPrice) || 0 })),
    };

    try {
      await onSubmit(invoiceData);
      setSelectedJobId('');
      setDiscount('0');
      setTax('0');
      setDueDate('');
      setNotes('');
      setLineItems([]);
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  // Since we requested unbilled jobs from the API, jobs list should only contain candidates
  const candidates = jobs;

  const subtotal = lineItems.reduce((s: number, l: any) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const total = Math.max(0, subtotal - (parseFloat(discount) || 0)) + (parseFloat(tax) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold">Create New Invoice</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Select Job</label>
        {candidates.length === 0 ? (
          <p className="text-secondary text-sm p-3 rounded" style={{ background: 'var(--bg-base)' }}>
            No unbilled jobs available for this customer.
          </p>
        ) : (
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="field w-full"
            required
          >
            <option value="">-- Select a job --</option>
            {candidates.map((job: any) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.tasks.length} task{job.tasks.length !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Line Items */}
      {selectedJob && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Line Items</h4>
              <button className="text-xs text-brand hover:underline" type="button" onClick={addLine}>+ Add line</button>
            </div>

            <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '1fr 60px 90px 28px' }}>
              <p className="text-xs text-muted">Description</p>
              <p className="text-xs text-muted text-center">Qty</p>
              <p className="text-xs text-muted text-right">Unit price (₦)</p>
              <span />
            </div>

            <div className="space-y-1.5">
              {lineItems.map((line, i) => (
                <div key={i} className="grid gap-1 items-center" style={{ gridTemplateColumns: '1fr 60px 90px 28px' }}>
                  <input className="field text-sm" placeholder="Description" value={line.description}
                    onChange={(e) => updateLine(i, 'description', e.target.value)} />
                  <input type="number" min="0.01" step="0.01" className="field text-sm text-center" value={String(line.quantity)}
                    onChange={(e) => updateLine(i, 'quantity', Number(e.target.value))} />
                  <input type="number" min="0" step="0.01" className="field text-sm text-right" placeholder="0.00" value={String(line.unitPrice)}
                    onChange={(e) => updateLine(i, 'unitPrice', Number(e.target.value))} />
                  <button type="button" onClick={() => removeLine(i)} disabled={lineItems.length === 1}
                    className="flex items-center justify-center rounded p-1 text-muted hover:text-danger transition-colors disabled:opacity-30" aria-label={`Remove line ${i + 1}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subtotal</label>
                <input
                  type="number"
                  step="0.01"
                  value={subtotal.toFixed(2)}
                  readOnly
                  className="field"
                  style={{ background: 'var(--bg-base)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Discount</label>
                <input
                  type="number"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="0.00"
                  className="field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tax</label>
                <input
                  type="number"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="0.00"
                  className="field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Total</label>
                <div className="text-2xl font-bold p-2 rounded-lg" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                  ₦{total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes for the invoice..."
              rows={3}
              className="field"
            />
          </div>
        </>
      )}

      <div className="flex gap-3 justify-end">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={isLoading || !selectedJobId || candidates.length === 0}
        >
          {isLoading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}

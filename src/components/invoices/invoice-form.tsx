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
    `/api/jobs?customerId=${customerId}`,
    fetcher
  );

  const [selectedJobId, setSelectedJobId] = useState('');
  const [subtotal, setSubtotal] = useState('');
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
        amount: (task.unitPrice || 0) * task.quantity,
      }));
      setLineItems(items);
      setSubtotal(
        items
          .reduce((sum: number, item: any) => sum + item.amount, 0)
          .toFixed(2)
      );
    }
  }, [selectedJob]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total =
      (parseFloat(subtotal) || 0) -
      (parseFloat(discount) || 0) +
      (parseFloat(tax) || 0);

    const invoiceData = {
      customerId,
      jobId: selectedJobId,
      subtotal: parseFloat(subtotal) || 0,
      discount: parseFloat(discount) || 0,
      tax: parseFloat(tax) || 0,
      total,
      dueAt: dueDate ? new Date(dueDate) : null,
      notes,
      lineItems,
    };

    try {
      await onSubmit(invoiceData);
      setSelectedJobId('');
      setSubtotal('');
      setDiscount('0');
      setTax('0');
      setDueDate('');
      setNotes('');
      setLineItems([]);
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const unpaidJobs = jobs.filter(
    (j: any) =>
      j.invoice?.paymentStatus !== 'PAID' &&
      j.invoice?.paymentStatus !== 'PARTIAL'
  );

  const total =
    (parseFloat(subtotal) || 0) -
    (parseFloat(discount) || 0) +
    (parseFloat(tax) || 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold">Create New Invoice</h3>

      <div>
        <label className="block text-sm font-medium mb-2">Select Job</label>
        {unpaidJobs.length === 0 ? (
          <p className="text-secondary text-sm p-3 rounded" style={{ background: 'var(--bg-base)' }}>
            No unpaid jobs available for this customer.
          </p>
        ) : (
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="field w-full"
            required
          >
            <option value="">-- Select a job --</option>
            {unpaidJobs.map((job: any) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.tasks.length} task
                {job.tasks.length !== 1 ? 's' : ''})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedJob && (
        <>
          {/* Line Items */}
          <div className="space-y-3">
            <h4 className="font-medium">Line Items</h4>
            <div className="rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)', border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--bg-base)' }}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left p-3">Description</th>
                    <th className="text-right p-3">Qty</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < lineItems.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <td className="p-3">{item.description}</td>
                      <td className="text-right p-3">{item.quantity}</td>
                      <td className="text-right p-3">₦{item.unitPrice.toFixed(2)}</td>
                      <td className="text-right p-3 font-medium">
                        ₦{item.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  value={subtotal}
                  onChange={(e) => setSubtotal(e.target.value)}
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
          disabled={isLoading || !selectedJobId || unpaidJobs.length === 0}
        >
          {isLoading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );
}

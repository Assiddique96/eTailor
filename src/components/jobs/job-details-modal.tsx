'use client';

import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/badge';

interface JobTask {
  id: string;
  garmentType: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  materialNotes?: string;
  selectionMode?: string;
}

interface JobDetailsModalProps {
  job: {
    id: string;
    title: string;
    description?: string;
    status: string;
    dueDate: string;
    totalPrice?: number;
    tasks: JobTask[];
    materials?: any[];
    createdAt: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onSelectStyles?: (jobId: string) => void;
}

export default function JobDetailsModal({
  job,
  isOpen,
  onClose,
  onSelectStyles,
}: JobDetailsModalProps) {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    READY_FOR_FITTING: 'bg-purple-100 text-purple-800',
    COMPLETED: 'bg-green-100 text-green-800',
    DELIVERED: 'bg-emerald-100 text-emerald-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const dueDate = new Date(job.dueDate);
  const isOverdue = dueDate < new Date() && !['COMPLETED', 'DELIVERED', 'CANCELLED'].includes(job.status);

  const footer = (
    <>
      <button className="btn btn-ghost btn-sm" onClick={onClose}>
        Close
      </button>
      {onSelectStyles && (
        <button className="btn btn-primary btn-sm" onClick={() => onSelectStyles(job.id)}>
          Select Styles
        </button>
      )}
    </>
  );

  return (
    <Modal open={isOpen} onClose={onClose} title={job.title} footer={footer}>
      <div className="space-y-6 max-w-2xl">
        {job.description && (
          <p className="text-secondary text-sm">{job.description}</p>
        )}

        {/* Status & Due Date */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <span className="text-xs text-secondary uppercase">Status</span>
            <div className="mt-1">
              <StatusBadge status={job.status} />
            </div>
          </div>

          <div>
            <span className="text-xs text-secondary uppercase">Due Date</span>
            <div className={`mt-1 font-medium ${isOverdue ? 'text-red-600' : ''}`}>
              {dueDate.toLocaleDateString()}
              {isOverdue && <span className="text-xs ml-2">(Overdue)</span>}
            </div>
          </div>

          {job.totalPrice && (
            <div>
              <span className="text-xs text-secondary uppercase">Total Price</span>
              <div className="mt-1 font-semibold text-lg">
                ₦{job.totalPrice.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="space-y-3">
          <h3 className="font-semibold">Tasks/Garments ({job.tasks.length})</h3>
          <div className="space-y-2">
            {job.tasks.map((task, idx) => (
              <div
                key={task.id}
                className="border rounded-lg p-3 space-y-2"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-base)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{task.garmentType}</h4>
                    {task.description && (
                      <p className="text-sm text-secondary">{task.description}</p>
                    )}
                  </div>
                  {task.unitPrice && (
                    <div className="text-right">
                      <p className="font-semibold">₦{task.unitPrice.toFixed(2)}</p>
                      <p className="text-xs text-secondary">qty: {task.quantity}</p>
                    </div>
                  )}
                </div>

                {task.materialNotes && (
                  <div className="text-sm text-secondary">
                    <span className="font-medium">Materials:</span> {task.materialNotes}
                  </div>
                )}

                {task.selectionMode && (
                  <div className="text-xs inline-block px-2 py-1 rounded" style={{ background: 'var(--brand-light)', color: 'var(--brand)' }}>
                    Style: {task.selectionMode.replace(/_/g, ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        {job.materials && job.materials.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Materials</h3>
            <div className="space-y-2">
              {job.materials.map((material) => (
                <div key={material.id} className="flex justify-between text-sm p-2 rounded" style={{ background: 'var(--bg-base)' }}>
                  <div>
                    <p className="font-medium">{material.name}</p>
                    {material.colour && <p className="text-secondary text-xs">{material.colour}</p>}
                  </div>
                  {material.totalCost && (
                    <p className="font-medium">₦{material.totalCost.toFixed(2)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

'use client';

import type { ChangeEvent } from 'react';

interface JobTaskFormProps {
  task: {
    id?: string;
    garmentType: string;
    description?: string;
    quantity: number;
    unitPrice?: number;
    materialNotes?: string;
  };
  taskNumber: number;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export default function JobTaskForm({
  task,
  taskNumber,
  onUpdate,
  onRemove,
  canRemove,
}: JobTaskFormProps) {
  return (
    <div className="border rounded-lg p-4 bg-base space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-sm">Task {taskNumber}</h5>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="btn btn-ghost btn-sm text-destructive"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Garment Type</label>
          <input
            className="field"
            type="text"
            value={task.garmentType}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate({ garmentType: e.target.value })}
            placeholder="e.g., Shirt, Trousers"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Quantity</label>
          <input
            className="field"
            type="number"
            min="1"
            value={String(task.quantity)}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate({ quantity: parseInt(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Unit Price</label>
          <input
            className="field"
            type="number"
            step="0.01"
            value={task.unitPrice != null ? String(task.unitPrice) : ''}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate({ unitPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Material Notes</label>
        <input
          className="field"
          type="text"
          value={task.materialNotes || ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate({ materialNotes: e.target.value })}
          placeholder="Fabric preference, color, special requirements..."
        />
      </div>

      {task.description && (
        <div>
          <label className="block text-xs font-medium mb-1">Description</label>
          <input
            className="field"
            type="text"
            value={task.description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onUpdate({ description: e.target.value })}
            placeholder="Additional details for this garment"
          />
        </div>
      )}
    </div>
  );
}

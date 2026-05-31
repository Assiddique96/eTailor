'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';

interface JobTask {
  id?: string;
  garmentType: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  selectionMode?: 'CATALOG' | 'UPLOAD' | 'IMPRESS_ME';
  materialNotes?: string;
}

interface JobFormProps {
  customerId: string;
  onSubmit: (jobData: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function JobForm({
  customerId,
  onSubmit,
  onCancel,
  isLoading = false,
}: JobFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [tasks, setTasks] = useState<JobTask[]>([
    { id: '1', garmentType: '', quantity: 1 },
  ]);

  const addTask = () => {
    setTasks([
      ...tasks,
      {
        id: String(Date.now()),
        garmentType: '',
        quantity: 1,
      },
    ]);
  };

  const removeTask = (id: string | undefined) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  const updateTask = (id: string | undefined, updates: Partial<JobTask>) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const jobData = {
      customerId,
      title,
      description,
      dueDate: new Date(dueDate),
      totalPrice: totalPrice ? parseFloat(totalPrice) : null,
      tasks: tasks.map(({ id, ...rest }) => rest),
    };

    try {
      await onSubmit(jobData);
      setTitle('');
      setDescription('');
      setDueDate('');
      setTotalPrice('');
      setTasks([{ id: '1', garmentType: '', quantity: 1 }]);
    } catch (error) {
      console.error('Error creating job:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-lg font-semibold">Create New Job</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Complete wedding outfit"
            className="field"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="field"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Job details and special notes..."
          rows={3}
          className="field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Total Price</label>
        <input
          type="number"
          step="0.01"
          value={totalPrice}
          onChange={(e) => setTotalPrice(e.target.value)}
          placeholder="0.00"
          className="field"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Tasks/Garments</h4>
          <button
            type="button"
            onClick={addTask}
            className="btn btn-ghost btn-sm"
          >
            + Add Task
          </button>
        </div>

        {tasks.map((task, idx) => (
          <JobTaskForm
            key={task.id}
            task={task}
            taskNumber={idx + 1}
            onUpdate={(updates) => updateTask(task.id, updates)}
            onRemove={() => removeTask(task.id)}
            canRemove={tasks.length > 1}
          />
        ))}
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading || !title || !dueDate || tasks.length === 0}>
          {isLoading ? 'Creating...' : 'Create Job'}
        </button>
      </div>
    </form>
  );
}

function JobTaskForm({
  task,
  taskNumber,
  onUpdate,
  onRemove,
  canRemove,
}: {
  task: any;
  taskNumber: number;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-sm">Task {taskNumber}</h5>
        {canRemove && (
          <button
            type="button"
            className="btn btn-ghost btn-sm text-red-600"
            onClick={onRemove}
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1">Garment Type</label>
          <input
            type="text"
            value={task.garmentType}
            onChange={(e) => onUpdate({ garmentType: e.target.value })}
            placeholder="e.g., Shirt, Trousers"
            className="field"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            value={task.quantity}
            onChange={(e) => onUpdate({ quantity: parseInt(e.target.value) })}
            className="field"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Unit Price</label>
          <input
            type="number"
            step="0.01"
            value={task.unitPrice || ''}
            onChange={(e) => onUpdate({ unitPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
            placeholder="0.00"
            className="field"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1">Material Notes</label>
        <input
          type="text"
          value={task.materialNotes || ''}
          onChange={(e) => onUpdate({ materialNotes: e.target.value })}
          placeholder="Fabric preference, color, special requirements..."
          className="field"
        />
      </div>
    </div>
  );
}

'use client';

import { use, useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

type Params = Promise<{ token: string }>;

export default function PublicStyleSelectionPage({ params }: { params: Params }) {
  const { token } = use(params);
  const [selectedStyleMode, setSelectedStyleMode] = useState<'CATALOG' | 'UPLOAD' | 'IMPRESS_ME' | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error } = useSWR<{ job?: any }>(
    `/api/public/jobs/${token}/style-link`,
    fetcher
  );

  const job = data?.job;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50">
        <div className="p-8 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <p className="text-center text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-50">
        <div className="p-8 rounded-lg max-w-md" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h1 className="text-xl font-bold mb-2">Link Invalid or Expired</h1>
          <p className="text-secondary text-sm">
            This style selection link is no longer valid. Please contact the shop for a new link.
          </p>
        </div>
      </div>
    );
  }

  const handleStyleSelection = async (mode: typeof selectedStyleMode) => {
    setSelectedStyleMode(mode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setSelectedStyleMode('UPLOAD');
    }
  };

  const handleSubmit = async (mode: string) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('mode', mode);
      if (mode === 'UPLOAD' && uploadedFile) {
        formData.append('file', uploadedFile);
      }

      const response = await fetch(
        `/api/public/jobs/${token}/style-selection`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Failed to save style selection');

      alert('Style selection saved! The shop will review your selection.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving style selection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--bg-page)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Select Your Style</h1>
          <p className="text-secondary">
            Job: <span className="font-semibold">{job.title}</span>
          </p>
          {job.description && (
            <p className="text-secondary text-sm mt-2">{job.description}</p>
          )}
        </div>

        {/* Task Summary */}
        <div className="p-6 rounded-lg mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-4">Your Tasks ({job.tasks?.length || 0})</h2>
          <div className="space-y-3">
            {job.tasks?.map((task: any, idx: number) => (
              <div key={task.id} className="p-3 rounded-lg" style={{ background: 'var(--bg-base)' }}>
                <p className="font-medium">{idx + 1}. {task.garmentType}</p>
                {task.materialNotes && (
                  <p className="text-sm text-secondary mt-1">
                    {task.materialNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Style Selection Options */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">How would you like to select a style?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Option 1: From Catalog */}
            <div
              className={`p-6 cursor-pointer transition-all border rounded-lg ${
                selectedStyleMode === 'CATALOG'
                  ? 'ring-2'
                  : ''
              }`}
              style={{
                borderColor: selectedStyleMode === 'CATALOG' ? 'var(--brand)' : 'var(--border)',
                background: selectedStyleMode === 'CATALOG' ? 'var(--brand-light)' : 'var(--bg-card)',
                boxShadow: selectedStyleMode === 'CATALOG' ? `0 0 0 2px var(--brand)` : 'none',
              }}
              onClick={() => handleStyleSelection('CATALOG')}
            >
              <div className="text-4xl mb-3">🎨</div>
              <h3 className="font-semibold mb-2">Browse Catalog</h3>
              <p className="text-sm text-secondary">
                Choose from our collection of pre-made styles
              </p>
              {selectedStyleMode === 'CATALOG' && (
                <button
                  className="btn btn-primary btn-sm mt-4 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmit('CATALOG');
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </button>
              )}
            </div>

            {/* Option 2: Upload Image */}
            <div
              className={`p-6 cursor-pointer transition-all border rounded-lg ${
                selectedStyleMode === 'UPLOAD'
                  ? 'ring-2'
                  : ''
              }`}
              style={{
                borderColor: selectedStyleMode === 'UPLOAD' ? 'var(--brand)' : 'var(--border)',
                background: selectedStyleMode === 'UPLOAD' ? 'var(--brand-light)' : 'var(--bg-card)',
                boxShadow: selectedStyleMode === 'UPLOAD' ? `0 0 0 2px var(--brand)` : 'none',
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="text-4xl mb-3">📸</div>
              <h3 className="font-semibold mb-2">Upload Image</h3>
              <p className="text-sm text-secondary">
                Share an image of a style you like
              </p>
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploadedFile && (
                <div className="mt-4">
                  <p className="text-xs text-secondary mb-2">
                    Selected: {uploadedFile.name}
                  </p>
                  <button
                    className="btn btn-primary btn-sm w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubmit('UPLOAD');
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Uploading...' : 'Submit Image'}
                  </button>
                </div>
              )}
            </div>

            {/* Option 3: Surprise Me */}
            <div
              className={`p-6 cursor-pointer transition-all border rounded-lg ${
                selectedStyleMode === 'IMPRESS_ME'
                  ? 'ring-2'
                  : ''
              }`}
              style={{
                borderColor: selectedStyleMode === 'IMPRESS_ME' ? 'var(--brand)' : 'var(--border)',
                background: selectedStyleMode === 'IMPRESS_ME' ? 'var(--brand-light)' : 'var(--bg-card)',
                boxShadow: selectedStyleMode === 'IMPRESS_ME' ? `0 0 0 2px var(--brand)` : 'none',
              }}
              onClick={() => handleStyleSelection('IMPRESS_ME')}
            >
              <div className="text-4xl mb-3">✨</div>
              <h3 className="font-semibold mb-2">Surprise Me</h3>
              <p className="text-sm text-secondary">
                Let the shop recommend a style based on your preferences
              </p>
              {selectedStyleMode === 'IMPRESS_ME' && (
                <button
                  className="btn btn-primary btn-sm mt-4 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubmit('IMPRESS_ME');
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Let\'s Go!'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-secondary mt-12">
          <p>This link will expire in 30 days</p>
        </div>
      </div>
    </div>
  );
}


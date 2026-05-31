'use client';

import { useState } from 'react';

interface StyleSelectorProps {
  onSelect: (mode: 'CATALOG' | 'UPLOAD' | 'IMPRESS_ME', data?: any) => void;
  catalogItems?: any[];
  isLoading?: boolean;
}

export default function StyleSelector({
  onSelect,
  catalogItems = [],
  isLoading = false,
}: StyleSelectorProps) {
  const [mode, setMode] = useState<'CATALOG' | 'UPLOAD' | 'IMPRESS_ME' | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleCatalogSelect = (itemId: string) => {
    setSelectedCatalogId(itemId);
    onSelect('CATALOG', { catalogItemId: itemId });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      onSelect('UPLOAD', { file });
    }
  };

  const handleImpressMe = () => {
    onSelect('IMPRESS_ME');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Catalog Option */}
        <div
          className={`p-6 cursor-pointer transition-all border rounded-lg ${
            mode === 'CATALOG'
              ? 'ring-2 ring-brand'
              : 'hover:border-brand'
          }`}
          style={{
            borderColor: mode === 'CATALOG' ? 'var(--brand)' : 'var(--border)',
            background: mode === 'CATALOG' ? 'var(--brand-light)' : 'transparent',
          }}
          onClick={() => setMode('CATALOG')}
        >
          <div className="text-4xl mb-3">🎨</div>
          <h3 className="font-semibold mb-2">Browse Catalog</h3>
          <p className="text-sm text-secondary">
            Choose from our collection of styles
          </p>
        </div>

        {/* Upload Option */}
        <div
          className={`p-6 cursor-pointer transition-all border rounded-lg ${
            mode === 'UPLOAD'
              ? 'ring-2 ring-brand'
              : 'hover:border-brand'
          }`}
          style={{
            borderColor: mode === 'UPLOAD' ? 'var(--brand)' : 'var(--border)',
            background: mode === 'UPLOAD' ? 'var(--brand-light)' : 'transparent',
          }}
          onClick={() => document.getElementById('style-upload')?.click()}
        >
          <div className="text-4xl mb-3">📸</div>
          <h3 className="font-semibold mb-2">Upload Image</h3>
          <p className="text-sm text-secondary">
            Share a style image you like
          </p>
          <input
            id="style-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {uploadedFile && (
            <p className="text-xs font-medium mt-2" style={{ color: 'var(--brand)' }}>
              ✓ {uploadedFile.name}
            </p>
          )}
        </div>

        {/* Impress Me Option */}
        <div
          className={`p-6 cursor-pointer transition-all border rounded-lg ${
            mode === 'IMPRESS_ME'
              ? 'ring-2 ring-brand'
              : 'hover:border-brand'
          }`}
          style={{
            borderColor: mode === 'IMPRESS_ME' ? 'var(--brand)' : 'var(--border)',
            background: mode === 'IMPRESS_ME' ? 'var(--brand-light)' : 'transparent',
          }}
          onClick={() => {
            setMode('IMPRESS_ME');
            handleImpressMe();
          }}
        >
          <div className="text-4xl mb-3">✨</div>
          <h3 className="font-semibold mb-2">Surprise Me</h3>
          <p className="text-sm text-secondary">
            Shop will suggest based on your style
          </p>
        </div>
      </div>

      {/* Catalog Grid */}
      {mode === 'CATALOG' && catalogItems.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold">Select a Style</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {catalogItems.map((item) => (
              <div
                key={item.id}
                className={`overflow-hidden cursor-pointer transition-all border rounded-lg ${
                  selectedCatalogId === item.id
                    ? 'ring-2 ring-brand'
                    : 'hover:shadow-lg'
                }`}
                style={{
                  borderColor: selectedCatalogId === item.id ? 'var(--brand)' : 'var(--border)',
                }}
                onClick={() => handleCatalogSelect(item.id)}
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-40 object-cover"
                  />
                )}
                <div className="p-3">
                  <p className="font-medium text-sm">{item.name}</p>
                  {item.category && (
                    <p className="text-xs text-secondary">{item.category}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {mode && (
        <div
          className="p-4 rounded-lg border"
          style={{
            borderColor: 'var(--brand)',
            background: 'var(--brand-light)',
            color: 'var(--brand)',
          }}
        >
          <p className="text-sm font-medium">
            ✓ Selected:{' '}
            {mode === 'CATALOG'
              ? 'Catalog Item'
              : mode === 'UPLOAD'
              ? uploadedFile?.name || 'Image'
              : 'Surprise Me'}
          </p>
        </div>
      )}
    </div>
  );
}

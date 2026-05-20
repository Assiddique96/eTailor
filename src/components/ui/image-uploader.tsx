"use client";
import { useRef, useState } from "react";

type UploadResult = { url: string; filePath: string; fileId: string };

type Props = {
  folder: string;
  fileName: string;
  currentUrl?: string | null;
  onUploaded: (result: UploadResult) => void;
  onError?: (msg: string) => void;
  label?: string;
  hint?: string;
  aspectHint?: string;
  disabled?: boolean;
};

export function ImageUploader({
  folder, fileName, currentUrl, onUploaded, onError,
  label = "Upload image", hint, aspectHint, disabled,
}: Props) {
  const inputRef               = useRef<HTMLInputElement>(null);
  const [preview, setPreview]  = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      onError?.("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image must be under 5 MB.");
      return;
    }

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    setProgress(10);

    try {
      // Step 1 — fetch auth params from our backend (lightweight, no file transfer)
      const authRes = await fetch("/api/imagekit/auth");
      if (!authRes.ok) {
        onError?.("Failed to get upload credentials.");
        setPreview(currentUrl ?? null);
        return;
      }
      const { token, expire, signature, publicKey, urlEndpoint } = await authRes.json();

      setProgress(30);

      // Step 2 — upload directly from browser to ImageKit (bypasses Vercel network)
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", fileName);
      formData.append("folder", folder);
      formData.append("token", token);
      formData.append("expire", String(expire));
      formData.append("signature", signature);
      formData.append("publicKey", publicKey);
      formData.append("useUniqueFileName", "true");
      formData.append("responseFields", "fileId,url,filePath,name,width,height");

      setProgress(50);

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(90);

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        onError?.(err.message ?? "Upload failed.");
        setPreview(currentUrl ?? null);
        return;
      }

      const data = await uploadRes.json();
      setProgress(100);

      onUploaded({
        url:      data.url,
        filePath: data.filePath,
        fileId:   data.fileId,
      });
    } catch {
      onError?.("Network error during upload.");
      setPreview(currentUrl ?? null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-xs font-medium text-secondary uppercase tracking-wide">{label}</p>
      )}

      <div
        className="relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden"
        style={{
          borderColor: uploading ? "var(--brand)" : "var(--border)",
          background:  preview   ? "transparent"  : "var(--bg-base)",
          minHeight:   preview   ? 0 : 120,
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        onKeyDown={(e) => e.key === "Enter" && !disabled && inputRef.current?.click()}
      >
        {preview ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-xl object-cover"
              style={{ maxHeight: 200 }}
            />
            {!disabled && (
              <div
                className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >
                <span className="text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.5)" }}>
                  Click to replace
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" className="text-muted" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="text-sm text-secondary">
              {uploading ? "Uploading…" : "Click or drag an image here"}
            </p>
            {hint && <p className="text-xs text-muted">{hint}</p>}
            {aspectHint && (
              <span className="text-xs px-2 py-0.5 rounded"
                style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
                {aspectHint} recommended
              </span>
            )}
          </div>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div
            className="absolute bottom-0 left-0 h-1 transition-all duration-300"
            style={{ width: `${progress}%`, background: "var(--brand)" }}
          />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={onInputChange}
        disabled={disabled || uploading}
        aria-hidden
      />
    </div>
  );
}
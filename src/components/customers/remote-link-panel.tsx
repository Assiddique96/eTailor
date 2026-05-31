"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { sendEmail } from "@/lib/email";
import type { Gender } from "@/lib/measurement-fields";

type ActiveLink = {
  id: string;
  token: string;
  url: string;
  gender: Gender;
  expiresAt: string;
  usedAt: string | null;
  active: boolean;
  expired: boolean;
};

type Props = {
  customerId: string;
  customerName: string;
  customerEmail?: string | null;
  /** Gender pre-filled from the customer record */
  gender: Gender | null;
  activeLinks: ActiveLink[];
  onCreated: () => void;
};

export function RemoteLinkPanel({
  customerId,
  customerName,
  customerEmail,
  gender,
  activeLinks,
  onCreated,
}: Props) {
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedGender, setSelectedGender] = useState<Gender>(gender ?? "OTHER");
  const [expiryHours, setExpiryHours] = useState(72);
  const [sendEmailOption, setSendEmailOption] = useState(!!customerEmail);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setGenerating(true);
    setGeneratedUrl(null);
    try {
      const res = await fetch("/api/measurement-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          gender: selectedGender,
          expiryHours,
          sendEmail: sendEmailOption && !!customerEmail,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast(err.error ?? "Failed to generate link.", "error");
        return;
      }
      const { url } = await res.json();
      setGeneratedUrl(url);
      onCreated();
      if (sendEmailOption && customerEmail) {
        toast("Link generated and emailed to customer.");
      } else {
        toast("Link generated. Copy and share it with the customer.");
      }
    } catch {
      toast("Network error.", "error");
    } finally {
      setGenerating(false);
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const genderLabel = (g: Gender) =>
    g === "MALE" ? "♂ Male" : g === "FEMALE" ? "♀ Female" : "⚧ Other";

  return (
    <>
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-sm text-secondary uppercase tracking-wide">
              Remote measurement link
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Send a secure link for the customer to fill in their own measurements
            </p>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowModal(true)}
          >
            🔗 Generate link
          </button>
        </div>

        {/* Active links list */}
        {activeLinks.length > 0 ? (
          <div className="space-y-2">
            {activeLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm"
                style={{ background: "var(--bg-base)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="badge text-xs shrink-0"
                    style={{
                      background: link.usedAt ? "var(--success-light)" :
                                  link.expired ? "var(--danger-light)"  : "var(--info-light)",
                      color:      link.usedAt ? "var(--success)"        :
                                  link.expired ? "var(--danger)"         : "var(--info)",
                    }}
                  >
                    {link.usedAt ? "✓ Used" : link.expired ? "Expired" : "Active"}
                  </span>
                  <span className="text-xs text-muted shrink-0">
                    {genderLabel(link.gender)}
                  </span>
                  <span className="text-xs text-muted truncate">
                    Expires {new Date(link.expiresAt).toLocaleDateString()}
                  </span>
                </div>
                {link.active && (
                  <button
                    className="btn btn-ghost btn-sm shrink-0"
                    onClick={() => copyUrl(link.url)}
                    aria-label="Copy link to clipboard"
                  >
                    {copied ? "✓ Copied" : "Copy"}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-4">
            No active links. Generate one to share with the customer.
          </p>
        )}
      </div>

      {/* Generate link modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setGeneratedUrl(null); }}
        title="Generate measurement link"
        footer={
          generatedUrl ? (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setShowModal(false); setGeneratedUrl(null); }}
            >
              Done
            </button>
          ) : (
            <>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowModal(false)}
                disabled={generating}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={generate}
                disabled={generating}
              >
                {generating ? "Generating…" : "Generate link"}
              </button>
            </>
          )
        }
      >
        {generatedUrl ? (
          /* ── Success state ── */
          <div className="space-y-4">
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{ background: "var(--success-light)", color: "var(--success)" }}
            >
              ✅ Link generated{sendEmailOption && customerEmail ? " and emailed to the customer" : ""}.
            </div>
            <div>
              <label className="text-xs font-medium text-secondary mb-2 block">Measurement link</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={generatedUrl}
                  className="field text-xs font-mono"
                  aria-label="Generated measurement link"
                  onFocus={(e) => e.target.select()}
                />
                <button
                  className="btn btn-primary btn-sm shrink-0"
                  onClick={() => copyUrl(generatedUrl)}
                  aria-label="Copy link"
                >
                  {copied ? "✓" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Configuration state ── */
          <div className="space-y-5">
            <div>
              <label className="text-xs font-medium text-secondary mb-2 block">
                Measurement type *
              </label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Gender for measurements">
                {(["MALE", "FEMALE", "OTHER"] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    role="radio"
                    aria-checked={selectedGender === g}
                    onClick={() => setSelectedGender(g)}
                    className="py-2.5 rounded-lg border text-sm font-medium transition-colors"
                    style={{
                      borderColor: selectedGender === g ? "var(--brand)"    : "var(--border)",
                      background:  selectedGender === g ? "var(--brand-light)" : "var(--bg-card)",
                      color:       selectedGender === g ? "var(--brand)"    : "var(--text-secondary)",
                    }}
                  >
                    {genderLabel(g)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted mt-1.5">
                The form will show only the measurement fields relevant to this type.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-secondary mb-2 block">
                Link expiry
              </label>
              <select
                className="field"
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
              >
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>3 days (recommended)</option>
                <option value={120}>5 days</option>
                <option value={168}>7 days</option>
              </select>
            </div>

            {customerEmail && (
              <div>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmailOption}
                    onChange={(e) => setSendEmailOption(e.target.checked)}
                    className="mt-0.5 rounded accent-indigo-600"
                    aria-label="Send link via email to customer"
                  />
                  <div>
                    <span className="text-sm font-medium">Email link to customer</span>
                    <p className="text-xs text-muted mt-0.5">
                      Send to <strong>{customerEmail}</strong> with instructions
                    </p>
                  </div>
                </label>
              </div>
            )}

            {!customerEmail && (
              <div
                className="rounded-lg px-3 py-2.5 text-xs"
                style={{ background: "var(--warn-light)", color: "var(--warn)" }}
              >
                ⚠ No email on file — you'll need to share the link manually.
              </div>
            )}

            <div
              className="rounded-lg px-3 py-2.5 text-xs"
              style={{ background: "var(--bg-base)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              🔒 The link is single-use. Once the customer submits measurements, it expires automatically.
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}





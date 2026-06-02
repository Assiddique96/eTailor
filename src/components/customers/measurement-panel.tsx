"use client";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { BodyDiagram } from "@/components/measurements/body-diagram";
import { getFieldsForGender, type Gender } from "@/lib/measurement-fields";

type CustomField = { label: string; valueCm: string };
type MeasurementRecord = {
  id: string; recordedAt: string; recordedBy?: string | null;
  extraJson?: { customFields?: Array<{ label: string; valueCm: number }>; comment?: string } | null;
  [key: string]: unknown;
};

type Props = {
  customerId: string;
  gender: Gender | null;
  records: MeasurementRecord[];
  onSaved: () => void;
};

export function MeasurementPanel({ customerId, gender, records, onSaved }: Props) {
  const { toast } = useToast();
  const [submitting, setSubmitting]   = useState(false);
  const [values, setValues]           = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [comment, setComment]           = useState<string>("");

  const fields = getFieldsForGender(gender ?? "OTHER");
  const genderLabel = gender === "MALE" ? "Men's" : gender === "FEMALE" ? "Women's" : "General";

  function addCustomField()  { setCustomFields((f) => [...f, { label: "", valueCm: "" }]); }
  function removeCustom(i: number) { setCustomFields((f) => f.filter((_, idx) => idx !== i)); }
  function updateCustom(i: number, key: keyof CustomField, val: string) {
    setCustomFields((f) => f.map((row, idx) => idx === i ? { ...row, [key]: val } : row));
  }

  async function handleSave() {
    const body: Record<string, number> = {};
    for (const f of fields) {
      const v = Number(values[f.name]);
      if (v > 0) body[f.name] = v;
    }

    const validCustom = customFields.filter(
      (c) => c.label.trim() && Number(c.valueCm) > 0
    );

    if (Object.keys(body).length === 0 && validCustom.length === 0) {
      toast("Enter at least one measurement.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/measurements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          ...body,
          ...(validCustom.length > 0
            ? { customFields: validCustom.map((c) => ({
                label: c.label.trim(),
                valueCm: Number(c.valueCm),
              })) }
            : {}),
          ...(comment.trim() ? { comment: comment.trim() } : {}),
        }),
      });
      if (!res.ok) { toast("Failed to save measurements.", "error"); return; }
      toast("Measurements saved.");
      setValues({});
      setCustomFields([]);
      setComment("");
      setActiveField(null);
      onSaved();
    } catch {
      toast("Network error.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-sm text-secondary uppercase tracking-wide">
            Add measurement record
          </h2>
          <span className="badge text-xs" style={{ background: "var(--brand-light)", color: "var(--brand)" }}>
            {genderLabel} fields
          </span>
        </div>

        {!gender && (
          <div className="rounded-lg px-3 py-2.5 text-sm mb-4"
            style={{ background: "var(--warn-light)", color: "var(--warn)" }}>
            ⚠ No gender set for this customer. Showing all fields.
            Update the customer profile to see gender-specific fields only.
          </div>
        )}

        {/* Two-column layout: diagram left, form right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── Body diagram ── */}
          <BodyDiagram
            gender={gender ?? "OTHER"}
            activeField={activeField}
            values={values}
          />

          {/* ── Measurement inputs ── */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={f.name} className="space-y-1">
                  <label className="text-xs font-medium text-secondary">{f.label} (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="—"
                    className="field"
                    value={values[f.name] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    onFocus={() => setActiveField(f.name)}
                    onBlur={() => setActiveField(null)}
                    aria-label={`${f.label} in centimetres`}
                  />
                </div>
              ))}
            </div>

            {/* ── Custom fields ── */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-secondary uppercase tracking-wide">
                  Custom fields
                </p>
                <button
                  className="text-xs text-brand hover:underline"
                  onClick={addCustomField}
                  type="button"
                >
                  + Add custom
                </button>
              </div>

              {customFields.length === 0 && (
                <p className="text-xs text-muted">
                  Add any measurement not listed above — e.g. "Back length", "Thigh", "Ankle".
                </p>
              )}

              <div className="space-y-2">
                {customFields.map((cf, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className="field flex-1 text-sm"
                      placeholder="Field name (e.g. Thigh)"
                      value={cf.label}
                      onChange={(e) => updateCustom(i, "label", e.target.value)}
                      onFocus={() => setActiveField(`custom_${i}`)}
                      onBlur={() => setActiveField(null)}
                      aria-label={`Custom field ${i + 1} name`}
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="field text-sm"
                      style={{ width: 90 }}
                      placeholder="cm"
                      value={cf.valueCm}
                      onChange={(e) => updateCustom(i, "valueCm", e.target.value)}
                      aria-label={`Custom field ${i + 1} value in centimetres`}
                    />
                    <button
                      onClick={() => removeCustom(i)}
                      className="p-1.5 rounded text-muted hover:text-danger transition-colors shrink-0"
                      aria-label={`Remove custom field ${i + 1}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" aria-hidden>
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-secondary">Notes / comment</label>
                <textarea
                  className="field min-h-[6rem]"
                  placeholder="Add any extra details about this measurement set..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSave}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save measurements"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── History ── */}
      {records.length === 0 ? (
        <p className="text-center text-secondary py-8 text-sm">No measurements recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {records.map((m) => {
            const extraData = m.extraJson as { customFields?: Array<{ label: string; valueCm: number }>; comment?: string } | null;
  const customData = extraData?.customFields ?? [];
  const measurementComment = extraData?.comment?.trim() ?? "";
            return (
              <div key={m.id} className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-muted">
                    {new Date(m.recordedAt).toLocaleString()}
                  </p>
                  {m.recordedBy === "remote-link" && (
                    <span className="badge text-xs"
                      style={{ background: "var(--success-light)", color: "var(--success)" }}>
                      🔗 Remote submission
                    </span>
                  )}
                </div>

                {/* Standard fields */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {fields.map((f) => {
                    const val = m[f.name];
                    return (
                      <div key={f.name}>
                        <p className="text-xs text-muted mb-0.5">{f.label}</p>
                        <p className="font-medium text-sm">
                          {val ? `${Number(val)} cm` : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Custom fields */}
                {measurementComment && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <p className="text-xs text-muted mb-2 font-medium">Notes</p>
                    <p className="text-sm text-secondary">{measurementComment}</p>
                  </div>
                )}
                {customData.length > 0 && (
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                    <p className="text-xs text-muted mb-2 font-medium">Custom</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {customData.map((cf, i) => (
                        <div key={i}>
                          <p className="text-xs text-muted mb-0.5">{cf.label}</p>
                          <p className="font-medium text-sm">{cf.valueCm} cm</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}




"use client";
import { use, useEffect, useState } from "react";
import { getFieldsForGender, type Gender, type MeasurementField } from "@/lib/measurement-fields";
import { BodyDiagram } from "@/components/measurements/body-diagram";

type LinkContext = {
  customer: { firstName: string; lastName: string };
  shopName: string;
  gender: Gender;
  expiresAt: string;
};

type PageState = "loading" | "ready" | "submitting" | "success" | "error";
type CustomField = { label: string; valueCm: string };

// ── Shell moved outside to prevent remount on every keystroke ──────────────
function Shell({
  ctx,
  children,
}: {
  ctx: LinkContext | null;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base, #f7f6f3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 16px 80px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 660 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#4f46e5",
              color: "#fff",
              fontWeight: 700,
              fontSize: 20,
              marginBottom: 16,
            }}
          >
            eT
          </div>
          <h1 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 700 }}>
            eTailor Measurements
          </h1>
          {ctx && (
            <p
              style={{
                margin: 0,
                color: "var(--text-muted, #57534e)",
                fontSize: 14,
              }}
            >
              {ctx.shopName}
            </p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export default function RemoteMeasurementPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [state, setState] = useState<PageState>("loading");
  const [ctx, setCtx] = useState<LinkContext | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [activeField, setActiveField] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    fetch(`/api/measurement-links/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error ?? "Invalid link.");
          setState("error");
          return;
        }
        setCtx(data);
        setState("ready");
      })
      .catch(() => {
        setErrorMsg("Could not load this link. Please try again.");
        setState("error");
      });
  }, [token]);

  const fields: MeasurementField[] = ctx ? getFieldsForGender(ctx.gender) : [];

  function addCustomField() {
    setCustomFields((f) => [...f, { label: "", valueCm: "" }]);
  }
  function removeCustom(i: number) {
    setCustomFields((f) => f.filter((_, idx) => idx !== i));
  }
  function updateCustom(i: number, key: keyof CustomField, val: string) {
    setCustomFields((f) =>
      f.map((row, idx) => (idx === i ? { ...row, [key]: val } : row))
    );
  }

  function validate() {
    const errs: Record<string, string> = {};
    let hasAny = false;

    for (const f of fields) {
      const raw = values[f.name];
      if (raw && raw !== "") {
        hasAny = true;
        const n = Number(raw);
        if (isNaN(n) || n <= 0) errs[f.name] = "Enter a positive number.";
        if (n > 300) errs[f.name] = "Value seems too large (max 300 cm).";
      }
    }

    const validCustom = customFields.filter(
      (c) => c.label.trim() && Number(c.valueCm) > 0
    );
    if (validCustom.length > 0) hasAny = true;

    if (!hasAny) errs._form = "Please fill in at least one measurement.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setState("submitting");

    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = Number(values[f.name]);
      if (v > 0) body[f.name] = v;
    }

    const validCustom = customFields.filter(
      (c) => c.label.trim() && Number(c.valueCm) > 0
    );
    if (validCustom.length > 0) {
      body.customFields = validCustom.map((c) => ({
        label: c.label.trim(),
        valueCm: Number(c.valueCm),
      }));
    }

    const res = await fetch(`/api/measurement-links/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setState("success");
    } else {
      const data = await res.json();
      setErrorMsg(data.error ?? "Submission failed. Please try again.");
      setState("error");
    }
  }

  const expiresAt = ctx ? new Date(ctx.expiresAt) : null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === "loading")
    return (
      <Shell ctx={ctx}>
        <div className="card p-8 text-center">
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Loading your form…
          </p>
        </div>
      </Shell>
    );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (state === "error")
    return (
      <Shell ctx={ctx}>
        <div className="card p-8 text-center">
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔗</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
            Link unavailable
          </h2>
          <p
            style={{ color: "var(--text-secondary)", fontSize: 14, margin: 0 }}
          >
            {errorMsg}
          </p>
        </div>
      </Shell>
    );

  // ── Success ────────────────────────────────────────────────────────────────
  if (state === "success")
    return (
      <Shell ctx={ctx}>
        <div className="card p-8 text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 700 }}>
            Measurements received!
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            Thank you, <strong>{ctx?.customer.firstName}</strong>. Your tailor
            at <strong>{ctx?.shopName}</strong> will use these to prepare your
            garments. You can close this page.
          </p>
        </div>
      </Shell>
    );

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <Shell ctx={ctx}>
      <div className="card" style={{ overflow: "hidden" }}>
        {/* Customer greeting */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border, #e7e5e4)",
            background: "var(--bg-base, #f7f6f3)",
          }}
        >
          <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 16 }}>
            Hi, {ctx!.customer.firstName} {ctx!.customer.lastName}
          </p>
          <p
            style={{
              margin: 0,
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            {ctx!.gender === "MALE"
              ? "Men's"
              : ctx!.gender === "FEMALE"
              ? "Women's"
              : "General"}{" "}
            measurements · Link expires{" "}
            {expiresAt?.toLocaleDateString("en-NG", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div style={{ padding: 24 }}>
          <p
            style={{
              margin: "0 0 24px",
              fontSize: 14,
              color: "var(--text-secondary)",
              lineHeight: 1.65,
            }}
          >
            Fill in your measurements in centimetres (cm). Use a soft measuring
            tape and ask a friend to help for more accurate results. The diagram
            updates as you fill in each field.
          </p>

          {fieldErrors._form && (
            <div
              style={{
                background: "var(--danger-light, #fee2e2)",
                color: "var(--danger, #dc2626)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {fieldErrors._form}
            </div>
          )}

          {/* Two-column layout: diagram + form */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
              gap: 28,
              alignItems: "start",
            }}
            className="measurement-grid"
          >
            {/* Body diagram */}
            <BodyDiagram
              gender={ctx!.gender}
              activeField={activeField}
              values={values}
            />

            {/* Inputs */}
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
            >
              {fields.map((f) => (
                <div key={f.name}>
                  <label
                    htmlFor={f.name}
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                    }}
                  >
                    {f.label} (cm)
                  </label>
                  <input
                    id={f.name}
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    placeholder="e.g. 92.5"
                    value={values[f.name] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [f.name]: e.target.value }))
                    }
                    onFocus={() => setActiveField(f.name)}
                    onBlur={() => setActiveField(null)}
                    disabled={state === "submitting"}
                    className="field"
                    aria-invalid={!!fieldErrors[f.name]}
                  />
                  {f.hint && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 11,
                        color: "var(--text-muted)",
                        lineHeight: 1.5,
                      }}
                    >
                      {f.hint}
                    </p>
                  )}
                  {fieldErrors[f.name] && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 11,
                        color: "var(--danger)",
                      }}
                    >
                      {fieldErrors[f.name]}
                    </p>
                  )}
                </div>
              ))}

              {/* Custom fields — span full width inside the form column */}
              <div style={{ gridColumn: "1 / -1" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Additional measurements
                  </p>
                  <button
                    type="button"
                    onClick={addCustomField}
                    style={{
                      fontSize: 12,
                      color: "var(--brand)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    + Add field
                  </button>
                </div>

                {customFields.length === 0 ? (
                  <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    If your tailor asked for a specific measurement not listed
                    above (e.g. "Thigh", "Ankle", "Back length"), you can add
                    it here.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {customFields.map((cf, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <input
                          className="field"
                          style={{ flex: 1, fontSize: 13 }}
                          placeholder="Measurement name"
                          value={cf.label}
                          onChange={(e) =>
                            updateCustom(i, "label", e.target.value)
                          }
                          disabled={state === "submitting"}
                          aria-label={`Custom measurement ${i + 1} name`}
                        />
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          className="field"
                          style={{ width: 80, fontSize: 13 }}
                          placeholder="cm"
                          value={cf.valueCm}
                          onChange={(e) =>
                            updateCustom(i, "valueCm", e.target.value)
                          }
                          disabled={state === "submitting"}
                          aria-label={`Custom measurement ${i + 1} value`}
                        />
                        <button
                          type="button"
                          onClick={() => removeCustom(i)}
                          disabled={state === "submitting"}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--text-muted)",
                            fontSize: 16,
                            lineHeight: 1,
                            padding: "0 4px",
                            flexShrink: 0,
                          }}
                          aria-label={`Remove custom field ${i + 1}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ marginTop: 28 }}>
            <button
              onClick={handleSubmit}
              disabled={state === "submitting"}
              style={{
                width: "100%",
                padding: 14,
                background: state === "submitting" ? "#818cf8" : "#4f46e5",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: state === "submitting" ? "not-allowed" : "pointer",
                transition: "background 150ms",
              }}
            >
              {state === "submitting" ? "Submitting…" : "Submit measurements"}
            </button>

            <p
              style={{
                margin: "12px 0 0",
                fontSize: 12,
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              🔒 This link is single-use and private. Your data goes directly
              to your tailor.
            </p>
          </div>
        </div>
      </div>

      {/* Responsive override — stack on mobile */}
      <style>{`
        @media (max-width: 540px) {
          .measurement-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Shell>
  );
}
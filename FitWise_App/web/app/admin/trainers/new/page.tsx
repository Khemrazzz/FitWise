"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddTrainerPage() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", specialisation: "" });
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/admin/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) return setError(json.error ?? "Could not add the trainer");
    setCreated({ email: json.email, tempPassword: json.tempPassword });
  }

  if (created) {
    return (
      <div className="card" style={{ maxWidth: 620 }}>
        <h3>Trainer account created</h3>
        <div className="muted small">Hand these credentials to the trainer out of band. The password is shown once and cannot be retrieved again.</div>
        <div className="grid two" style={{ marginTop: 13 }}>
          <label className="form-label">
            Email
            <div className="input">{created.email}</div>
          </label>
          <label className="form-label">
            Temporary password
            <div className="input" style={{ fontFamily: "monospace" }}>
              {created.tempPassword}
            </div>
          </label>
        </div>
        <div className="warning-banner" style={{ marginTop: 13 }}>
          <strong>This password will not be shown again.</strong> The trainer should sign in and change it from Settings.
        </div>
        <div className="action-row" style={{ marginTop: 13 }}>
          <Link href="/admin/trainers" className="button primary small-button">
            Back to trainers
          </Link>
          <button
            className="button secondary small-button"
            onClick={() => {
              setCreated(null);
              setForm({ fullName: "", email: "", phone: "", specialisation: "" });
            }}
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Administration / Add Trainer</div>
          <h2>Add Trainer</h2>
          <div className="muted small">Creates an active trainer account straight away, without the application step.</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 720 }}>
        <div className="grid two">
          <label className="form-label">
            Full name
            <input className="input" id="fullName" required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </label>
          <label className="form-label">
            Email
            <input className="input" id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="form-label">
            Phone
            <input className="input" id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          <label className="form-label">
            Specialisation
            <input className="input" id="specialisation" value={form.specialisation} onChange={(e) => setForm({ ...form, specialisation: e.target.value })} />
          </label>
        </div>
        {error && <p style={{ color: "var(--red)" }}>{error}</p>}
        <div className="action-row" style={{ marginTop: 13 }}>
          <button type="submit" className="button primary small-button" disabled={pending}>
            {pending ? "Creating..." : "Create trainer account"}
          </button>
          <Link href="/admin/trainers" className="button secondary small-button">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

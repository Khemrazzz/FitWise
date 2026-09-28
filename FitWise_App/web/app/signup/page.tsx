"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function TrainerSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", specialisation: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) return setError("The two passwords do not match.");
    setPending(true);

    const res = await fetch("/api/auth/trainer-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        specialisation: form.specialisation,
        password: form.password,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setPending(false);
      return setError(json.error ?? "Sign-up failed. Try again.");
    }

    // Sign straight in so the applicant lands on the status page.
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (signInError) {
      setPending(false);
      return setError("Your application was received, but signing in failed. Try signing in from the login page.");
    }
    router.refresh();
    router.push("/pending");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ padding: 32, maxWidth: 640, width: "100%" }}>
        <div className="brand" style={{ fontSize: 22 }}>
          <span className="brand-mark" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </span>
          FitWise
        </div>
        <h2 style={{ margin: "25px 0 6px" }}>Apply as a trainer</h2>
        <p className="muted">
          Create your trainer account. A gym administrator reviews every application before you can manage members.
        </p>
        <form onSubmit={handleSubmit} className="grid two" style={{ marginTop: 22 }}>
          <label className="form-label">
            Full name
            <input className="input" id="fullName" required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </label>
          <label className="form-label">
            Email
            <input className="input" id="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </label>
          <label className="form-label">
            Phone
            <input className="input" id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </label>
          <label className="form-label">
            Specialisation
            <input
              className="input"
              id="specialisation"
              placeholder="Strength, rehab-friendly, HIIT..."
              value={form.specialisation}
              onChange={(e) => update("specialisation", e.target.value)}
            />
          </label>
          <label className="form-label">
            Password
            <input className="input" id="password" type="password" required minLength={8} value={form.password} onChange={(e) => update("password", e.target.value)} />
          </label>
          <label className="form-label">
            Confirm password
            <input className="input" id="confirm" type="password" required minLength={8} value={form.confirm} onChange={(e) => update("confirm", e.target.value)} />
          </label>
          {error && <p style={{ color: "var(--red)", margin: 0, gridColumn: "1 / -1" }}>{error}</p>}
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <button type="submit" className="button primary" disabled={pending}>
              {pending ? "Submitting..." : "Submit application"}
            </button>
            <span className="muted small">
              Already have an account? <Link href="/login" style={{ color: "var(--blue)", fontWeight: 700 }}>Sign in</Link>
            </span>
          </div>
        </form>
      </div>
    </main>
  );
}

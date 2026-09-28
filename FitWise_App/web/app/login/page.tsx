"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Deactivated trainers are banned in Supabase Auth.
      setError(/banned/i.test(error.message) ? "This account has been deactivated. Contact your gym administrator." : error.message);
      setPending(false);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", data.user.id).single();

    router.refresh();
    if (profile?.status && profile.status !== "active") router.push("/pending");
    else if (profile?.role === "admin") router.push("/admin");
    else if (profile?.role === "trainer") router.push("/trainer");
    else router.push("/member");
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="grid two" style={{ maxWidth: 900, width: "100%", alignItems: "stretch" }}>
        <div className="card" style={{ padding: 32 }}>
          <div className="brand" style={{ fontSize: 22 }}>
            <span className="brand-mark" aria-hidden="true">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </span>
            FitWise
          </div>
          <h2 style={{ margin: "25px 0 6px" }}>Welcome back</h2>
          <p className="muted">Sign in to manage members, recommendations and workout plans.</p>
          <form onSubmit={handleSubmit} className="grid" style={{ marginTop: 22 }}>
            <label className="form-label">
              Email
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="form-label">
              Password
              <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error && <p style={{ color: "var(--red)", margin: 0 }}>{error}</p>}
            <button type="submit" className="button primary" disabled={pending}>
              {pending ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="muted small" style={{ marginTop: 18 }}>
            Trainer without an account? <Link href="/signup" style={{ color: "var(--blue)", fontWeight: 700 }}>Apply as a trainer</Link>. Members receive their login from their trainer.
          </p>
        </div>
        <div
          className="card"
          style={{ display: "grid", placeItems: "center", padding: 35, background: "linear-gradient(145deg,#eef5ff,#e8faf6)" }}
        >
          <div style={{ maxWidth: 380, textAlign: "center" }}>
            <div style={{ fontSize: 72 }}>🏋️‍♀️</div>
            <h2>Intelligent coaching, made practical.</h2>
            <p className="muted">Machine-learning recommendations, rule-based plans and progress insights in one connected workspace.</p>
          </div>
        </div>
      </div>
    </main>
  );
}

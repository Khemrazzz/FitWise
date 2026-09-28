"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExerciseToggle({ exerciseId, isActive }: { exerciseId: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setPending(true);
    setError("");
    const res = await fetch(`/api/exercises/${exerciseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) return setError(json.error ?? "Update failed");
    router.refresh();
  }

  return (
    <div className="action-row">
      <button className={`button ${isActive ? "secondary" : "teal"} small-button`} disabled={pending} onClick={toggle}>
        {pending ? "Saving..." : isActive ? "Deactivate" : "Activate"}
      </button>
      {error && <span className="small" style={{ color: "var(--red)" }}>{error}</span>}
    </div>
  );
}

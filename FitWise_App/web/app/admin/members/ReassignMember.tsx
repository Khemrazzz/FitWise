"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  memberId: string;
  currentTrainerId: string;
  trainers: Array<{ id: string; name: string }>;
}

export function ReassignMember({ memberId, currentTrainerId, trainers }: Props) {
  const router = useRouter();
  const [trainerId, setTrainerId] = useState(currentTrainerId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const options = trainers.some((t) => t.id === currentTrainerId) ? trainers : [{ id: currentTrainerId, name: "(inactive trainer)" }, ...trainers];

  async function save() {
    setPending(true);
    setError("");
    const res = await fetch(`/api/admin/members/${memberId}/reassign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trainerId }),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) return setError(json.error ?? "Reassignment failed");
    router.refresh();
  }

  return (
    <div className="action-row" style={{ flexWrap: "wrap" }}>
      <select className="select" aria-label="Assigned trainer" value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
        {options.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button className="button secondary small-button" disabled={pending || trainerId === currentTrainerId} onClick={save}>
        {pending ? "Saving..." : "Reassign"}
      </button>
      {error && <span className="small" style={{ color: "var(--red)" }}>{error}</span>}
    </div>
  );
}

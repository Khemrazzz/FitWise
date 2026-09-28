"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  trainerId: string;
  status: "pending" | "active" | "disabled";
  memberCount: number;
  otherTrainers: Array<{ id: string; name: string }>;
}

export function TrainerActions({ trainerId, status, memberCount, otherTrainers }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<"reject" | "deactivate" | null>(null);
  const targets = otherTrainers.filter((t) => t.id !== trainerId);
  const [reassignTo, setReassignTo] = useState(targets[0]?.id ?? "");

  async function run(action: "approve" | "reject" | "deactivate" | "reactivate") {
    setPending(true);
    setError("");
    const res = await fetch(`/api/admin/trainers/${trainerId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reassignTo: action === "deactivate" && memberCount > 0 ? reassignTo : undefined }),
    });
    const json = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) return setError(json.error ?? "Action failed");
    setConfirming(null);
    router.refresh();
  }

  if (confirming === "reject") {
    return (
      <div className="action-row" style={{ flexWrap: "wrap" }}>
        <span className="small">Delete this application?</span>
        <button className="button danger small-button" disabled={pending} onClick={() => run("reject")}>
          {pending ? "Rejecting..." : "Yes, reject"}
        </button>
        <button className="button secondary small-button" disabled={pending} onClick={() => setConfirming(null)}>
          Cancel
        </button>
        {error && <span style={{ color: "var(--red)" }} className="small">{error}</span>}
      </div>
    );
  }

  if (confirming === "deactivate") {
    const blocked = memberCount > 0 && targets.length === 0;
    return (
      <div className="grid" style={{ gap: 6 }}>
        {memberCount > 0 ? (
          blocked ? (
            <span className="small" style={{ color: "var(--red)" }}>
              This trainer has {memberCount} member(s) and there is no other active trainer to take them over.
            </span>
          ) : (
            <label className="small">
              Move {memberCount} member(s) to{" "}
              <select className="select" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
                {targets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          )
        ) : (
          <span className="small">The trainer will no longer be able to sign in.</span>
        )}
        <div className="action-row">
          <button className="button danger small-button" disabled={pending || blocked} onClick={() => run("deactivate")}>
            {pending ? "Deactivating..." : "Confirm deactivation"}
          </button>
          <button className="button secondary small-button" disabled={pending} onClick={() => setConfirming(null)}>
            Cancel
          </button>
        </div>
        {error && <span style={{ color: "var(--red)" }} className="small">{error}</span>}
      </div>
    );
  }

  return (
    <div className="action-row" style={{ flexWrap: "wrap" }}>
      {status === "pending" && (
        <>
          <button className="button primary small-button" disabled={pending} onClick={() => run("approve")}>
            {pending ? "Approving..." : "Approve"}
          </button>
          <button className="button secondary small-button" disabled={pending} onClick={() => setConfirming("reject")}>
            Reject
          </button>
        </>
      )}
      {status === "active" && (
        <button className="button secondary small-button" disabled={pending} onClick={() => setConfirming("deactivate")}>
          Deactivate
        </button>
      )}
      {status === "disabled" && (
        <button className="button teal small-button" disabled={pending} onClick={() => run("reactivate")}>
          {pending ? "Reactivating..." : "Reactivate"}
        </button>
      )}
      {error && <span style={{ color: "var(--red)" }} className="small">{error}</span>}
    </div>
  );
}

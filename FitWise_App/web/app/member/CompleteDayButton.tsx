"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CompleteDayButton({ planId, dayNumber }: { planId: string; dayNumber: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const res = await fetch("/api/member/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, dayNumber }),
    });
    setPending(false);
    if (res.ok) router.refresh();
  }

  return (
    <button className="button teal small-button" onClick={handleClick} disabled={pending}>
      {pending ? "Saving..." : "Mark day complete"}
    </button>
  );
}

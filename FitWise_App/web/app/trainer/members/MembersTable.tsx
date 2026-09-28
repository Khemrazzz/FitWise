"use client";

import { useState } from "react";
import Link from "next/link";

export interface MemberRow {
  id: string;
  fullName: string | null;
  goal: string | null;
  planName: string | null;
  adherence: number | null;
  lastActive: string | null;
}

export function MembersTable({ rows }: { rows: MemberRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = rows.filter((r) => (r.fullName ?? r.id).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="card">
      <div className="grid four" style={{ marginBottom: 13 }}>
        <input className="input" placeholder="Search members..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Goal</th>
              <th>Plan</th>
              <th>Adherence</th>
              <th>Last active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No members yet.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.fullName ?? r.id}</td>
                  <td>{r.goal?.replaceAll("_", " ") ?? "—"}</td>
                  <td>{r.planName ?? "—"}</td>
                  <td>
                    {r.adherence === null ? (
                      "—"
                    ) : (
                      <span className={`status${r.adherence < 60 ? " danger" : ""}`}>{r.adherence}%</span>
                    )}
                  </td>
                  <td>{r.lastActive ? new Date(r.lastActive).toLocaleDateString() : "Never"}</td>
                  <td>
                    <Link href={`/trainer/members/${r.id}`} className="button secondary small-button">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="muted small" style={{ marginTop: 12 }}>
        Showing {filtered.length} of {rows.length} members
      </div>
    </div>
  );
}

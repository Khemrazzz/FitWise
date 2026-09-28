"use client";

import { useEffect, useState, use as usePromise } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { OverviewTab } from "./OverviewTab";
import { FitnessDataTab } from "./FitnessDataTab";
import { PredictionsTab } from "./PredictionsTab";
import { PlansTab } from "./PlansTab";
import { ProgressTab } from "./ProgressTab";
import { NotesTab } from "./NotesTab";

const TABS = ["Overview", "Fitness Data", "Predictions", "Workout Plans", "Progress", "Notes"] as const;
type Tab = (typeof TABS)[number];

export interface MemberData {
  id: string;
  fullName: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  memberSince: string;
  assessments: Array<Record<string, unknown>>;
  predictions: Array<Record<string, unknown>>;
  plans: Array<Record<string, unknown>>;
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [tab, setTab] = useState<Tab>("Overview");
  const [data, setData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    const supabase = createClient();
    const [{ data: profile }, { data: member }, { data: assessments }, { data: predictions }, { data: plans }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", id).single(),
      supabase.from("members").select("phone, date_of_birth, created_at").eq("profile_id", id).single(),
      supabase.from("assessments").select("*").eq("member_id", id).order("created_at", { ascending: false }),
      supabase.from("predictions").select("*, assessments!inner(member_id)").eq("assessments.member_id", id).order("created_at", { ascending: false }),
      supabase.from("plans").select("*, assessments!inner(member_id)").eq("assessments.member_id", id).order("created_at", { ascending: false }),
    ]);

    setData({
      id,
      fullName: profile?.full_name ?? null,
      phone: member?.phone ?? null,
      dateOfBirth: member?.date_of_birth ?? null,
      memberSince: member?.created_at ?? new Date().toISOString(),
      assessments: assessments ?? [],
      predictions: predictions ?? [],
      plans: plans ?? [],
    });
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading || !data) return <p className="muted">Loading member...</p>;

  const initials = (data.fullName ?? "??").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      <p>
        <Link href="/trainer/members" className="muted small">
          &larr; Members
        </Link>
      </p>
      <div className="card profile-banner">
        <div className="profile-main">
          <div className="large-avatar">{initials}</div>
          <div>
            <h3 style={{ margin: 0 }}>
              {data.fullName ?? data.id} <span className="status">Active</span>
            </h3>
            <div className="muted small">Member since {new Date(data.memberSince).toLocaleDateString()}</div>
          </div>
        </div>
        <div className="action-row">
          <button className="button secondary small-button" onClick={load}>
            Refresh
          </button>
        </div>
      </div>

      <div className="tabs" style={{ margin: "13px 0" }}>
        {TABS.map((t) => (
          <button key={t} className={`tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab data={data} />}
      {tab === "Fitness Data" && <FitnessDataTab memberId={id} assessments={data.assessments} onSaved={load} />}
      {tab === "Predictions" && <PredictionsTab memberId={id} assessments={data.assessments} predictions={data.predictions} onChanged={load} />}
      {tab === "Workout Plans" && <PlansTab memberId={id} assessments={data.assessments} predictions={data.predictions} plans={data.plans} onChanged={load} />}
      {tab === "Progress" && <ProgressTab memberId={id} />}
      {tab === "Notes" && <NotesTab assessments={data.assessments} />}
    </div>
  );
}

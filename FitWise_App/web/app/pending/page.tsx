import { redirect } from "next/navigation";
import { verifySession, homeFor } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "../LogoutButton";

// Landing page for trainer accounts that cannot use the workspace yet.
export default async function PendingPage() {
  const session = await verifySession();
  if (session.status === "active") redirect(homeFor(session));

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, specialisation, created_at")
    .eq("id", session.userId)
    .single();

  const disabled = session.status === "disabled";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div className="card" style={{ padding: 32, maxWidth: 560, width: "100%" }}>
        <div className="brand" style={{ fontSize: 22 }}>
          <span className="brand-mark" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </span>
          FitWise
        </div>
        <h2 style={{ margin: "25px 0 6px" }}>{disabled ? "Account deactivated" : "Application received"}</h2>
        <p className="muted">
          {disabled
            ? "This trainer account has been deactivated by a gym administrator. Contact the administrator if you think this is a mistake."
            : "A gym administrator will review your trainer application. Once it is approved, sign in again to open the trainer workspace."}
        </p>
        <div className="info-banner" style={{ margin: "18px 0" }}>
          <strong>{profile?.full_name ?? "Trainer"}</strong>
          <br />
          {profile?.email ?? session.email}
          {profile?.phone ? ` · ${profile.phone}` : ""}
          {profile?.specialisation ? (
            <>
              <br />
              Specialisation: {profile.specialisation}
            </>
          ) : null}
          <br />
          Status: <span className={`status${disabled ? " danger" : " warning"}`}>{disabled ? "deactivated" : "pending approval"}</span>
        </div>
        <LogoutButton />
      </div>
    </main>
  );
}

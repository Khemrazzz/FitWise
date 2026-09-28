import { verifySession } from "@/lib/auth";
import { LogoutButton } from "../LogoutButton";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();
  const initial = (session.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="app-main">
      <div className="app-top">
        <div className="brand" style={{ fontSize: 17 }}>
          <span className="brand-mark" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </span>
          FitWise
        </div>
        <div className="profile-pill">
          <span className="avatar">{initial}</span>
          <span>
            {session.email}
            <br />
            <span className="muted small">Member</span>
          </span>
          <LogoutButton />
        </div>
      </div>
      <div className="app-body">
        <div style={{ maxWidth: 900, margin: "0 auto" }}>{children}</div>
      </div>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "./AdminSidebar";
import { LogoutButton } from "../LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const initial = (session.email ?? "?").slice(0, 2).toUpperCase();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </span>
          FitWise
        </div>
        <AdminSidebar />
      </aside>
      <div className="app-main">
        <div className="app-top">
          <div />
          <div className="profile-pill">
            <span className="avatar">{initial}</span>
            <span>
              {session.email}
              <br />
              <span className="muted small">Gym administrator</span>
            </span>
            <LogoutButton />
          </div>
        </div>
        <div className="app-body">{children}</div>
      </div>
    </div>
  );
}

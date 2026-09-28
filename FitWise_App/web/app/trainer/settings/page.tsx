"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [prefs, setPrefs] = useState<{ lowAdherenceAlerts: boolean; planReviewAlerts: boolean }>({
    lowAdherenceAlerts: true,
    planReviewAlerts: true,
  });
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data: profile } = await supabase.from("profiles").select("full_name, notification_preferences").eq("id", user.id).single();
      if (profile) {
        setFullName(profile.full_name ?? "");
        setPrefs(profile.notification_preferences ?? prefs);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setError("");
    setMessage("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: fullName, notification_preferences: prefs }).eq("id", user.id);
    if (error) return setError(error.message);
    setMessage("Settings saved.");
  }

  async function changePassword() {
    setError("");
    setMessage("");
    if (!newPassword) return setError("Enter a new password first.");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return setError(error.message);
    setNewPassword("");
    setMessage("Password changed.");
  }

  const initials = (fullName || email).slice(0, 2).toUpperCase();

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="breadcrumbs">FitWise / Settings</div>
          <h2>Trainer Profile &amp; Settings</h2>
          <div className="muted small">Account, security and notification preferences.</div>
        </div>
        <div className="action-row">
          <button className="button primary small-button" onClick={saveProfile}>
            Save Changes
          </button>
        </div>
      </div>

      {message && <p style={{ color: "var(--green)" }}>{message}</p>}
      {error && <p style={{ color: "var(--red)" }}>{error}</p>}

      <div className="grid two">
        <div className="card">
          <h3>Trainer profile</h3>
          <div className="profile-main" style={{ marginBottom: 16 }}>
            <div className="large-avatar">{initials}</div>
            <div>
              <b>{fullName || "Unnamed trainer"}</b>
              <div className="muted small">{email}</div>
            </div>
          </div>
          <label className="form-label">
            Full name
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </label>
        </div>
        <div className="card">
          <h3>Security</h3>
          <label className="form-label">
            New password
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </label>
          <button className="button primary small-button" style={{ marginTop: 12 }} onClick={changePassword}>
            Change Password
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 13 }}>
        <h3>Notification preferences</h3>
        <div className="settings-row">
          <span>Low-adherence alerts</span>
          <button
            className={`toggle${prefs.lowAdherenceAlerts ? " on" : ""}`}
            onClick={() => setPrefs({ ...prefs, lowAdherenceAlerts: !prefs.lowAdherenceAlerts })}
          />
        </div>
        <div className="settings-row">
          <span>Plan-review reminders</span>
          <button
            className={`toggle${prefs.planReviewAlerts ? " on" : ""}`}
            onClick={() => setPrefs({ ...prefs, planReviewAlerts: !prefs.planReviewAlerts })}
          />
        </div>
      </div>
    </div>
  );
}

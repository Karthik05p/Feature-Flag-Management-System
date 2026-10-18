import { useContext } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import ThemeContext from "../context/ThemeContext";

const workspaceLinks = [
  { label: "Feature Flags", description: "Manage application release controls.", to: "/features", icon: "▣" },
  { label: "Environments", description: "Review configured release contexts.", to: "/environments", icon: "◈" },
  { label: "Targeting Rules", description: "Manage user, group, and percentage rules.", to: "/rollouts", icon: "◒" },
  { label: "Analytics", description: "Explore configuration intelligence.", to: "/analytics", icon: "◌" },
  { label: "Audit Logs", description: "Review recorded workspace changes.", to: "/audit-logs", icon: "≡" },
];

function SettingsPage() {
  const { isAuthenticated, username, logout } = useAuth();
  const { theme, setTheme } = useContext(ThemeContext);

  const signOut = () => {
    logout();
    window.location.replace("/");
  };

  return (
    <section className="settings-page">
      <div className="feature-page-header settings-page-header">
        <div>
          <p className="dashboard-eyebrow">Workspace administration</p>
          <h2>Settings</h2>
          <p>Manage your account access and workspace experience.</p>
        </div>
      </div>

      <div className="settings-primary-grid">
        <article className="settings-card settings-account-card">
          <div className="settings-card-heading">
            <div><p className="dashboard-eyebrow">Account</p><h3>Account &amp; Session</h3></div>
            <span className="settings-status-badge"><i aria-hidden="true" />Authenticated</span>
          </div>
          <div className="settings-session-details">
            <div><span>Signed-in status</span><strong>{isAuthenticated ? "Authenticated" : "Not authenticated"}</strong></div>
            <div><span>Username</span><strong>{username}</strong></div>
            <div><span>Authentication</span><strong>JWT Bearer Authentication</strong></div>
          </div>
          <p className="settings-card-copy">Account, profile, and security settings are currently managed by the authentication service.</p>
          <button className="btn secondary settings-signout" onClick={signOut} type="button">Sign out</button>
        </article>

        <article className="settings-card settings-workspace-card">
          <div className="settings-card-heading"><div><p className="dashboard-eyebrow">Workspace</p><h3>Workspace Access</h3></div><span className="settings-access-badge">Available</span></div>
          <p className="settings-card-copy">Use these shortcuts to manage the FlagFlow release workspace.</p>
          <nav className="settings-workspace-links" aria-label="Workspace shortcuts">
            {workspaceLinks.map((item) => <Link className="settings-workspace-link" key={item.to} to={item.to}><span className="settings-link-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.label}</strong><small>{item.description}</small></span><span className="settings-link-arrow" aria-hidden="true">→</span></Link>)}
          </nav>
        </article>
      </div>

      <section className="settings-card settings-appearance-section">
        <div className="settings-card-heading"><div><p className="dashboard-eyebrow">Preferences</p><h3>Appearance</h3></div><span className="settings-status-badge">Active</span></div>
        <p className="settings-card-copy">Choose the visual theme for your FlagFlow workspace.</p>
        <div role="group" aria-label="Appearance theme" style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
          <button className={`btn ${theme === "dark" ? "primary" : "secondary"}`} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")} type="button">Dark</button>
          <button className={`btn ${theme === "light" ? "primary" : "secondary"}`} aria-pressed={theme === "light"} onClick={() => setTheme("light")} type="button">Light</button>
        </div>
        <p aria-live="polite" style={{ marginTop: "10px" }}>Currently using {theme === "light" ? "Light" : "Dark"} mode.</p>
      </section>
    </section>
  );
}

export default SettingsPage;

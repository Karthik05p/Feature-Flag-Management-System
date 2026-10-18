import { useContext, useState } from "react";
import ThemeContext from "../context/ThemeContext";

function Navbar({ isAuthenticated, onLogin, onDashboard, onSignOut, onSectionNavigate }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const navigateToSection = (sectionId) => {
    onSectionNavigate(sectionId);
    setIsMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="logo"><span className="logo-icon">⚡</span><span>FlagFlow</span></div>
      <button
        className="menu-toggle"
        aria-expanded={isMenuOpen}
        aria-label="Toggle navigation menu"
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <span /><span /><span />
      </button>
      <nav className={isMenuOpen ? "is-open" : ""}>
        <button onClick={() => navigateToSection("features")} type="button">Features</button>
        <button onClick={() => navigateToSection("workflow")} type="button">How It Works</button>
        <button onClick={() => navigateToSection("about")} type="button">About</button>
        <button className="mobile-login-link" onClick={() => { (isAuthenticated ? onDashboard : onLogin)(); setIsMenuOpen(false); }} type="button">{isAuthenticated ? "Go to Dashboard" : "Login"}</button>
      </nav>
      <div className="nav-buttons">
        <button className="btn secondary theme-toggle" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} type="button"><span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span></button>
        {isAuthenticated ? <button className="btn secondary" onClick={onSignOut}>Sign out</button> : <button className="btn secondary" onClick={onLogin}>Login</button>}
      </div>
    </header>
  );
}

export default Navbar;

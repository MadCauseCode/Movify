import { Link } from "react-router";
import { useMemo, useState } from "react";
import "./styles.css";
import { decodeJwt, isTokenValid } from "../utils/auth";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  const token = sessionStorage.getItem("access_token");
  const payload = useMemo(() => (token ? decodeJwt(token) : null), [token]);
  const loggedIn = isTokenValid(token);

  const isAdmin = !!payload?.isAdmin || payload?.role === "admin";
  const isModerator = !isAdmin && (!!payload?.isModerator || payload?.role === "moderator");
  const username = payload?.fullName || payload?.username || "";
  const roleLabel = isAdmin ? "Admin View" : isModerator ? "Moderator View" : null;

  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    window.location.href = "/";
  };

  const closeMenu = () => setOpen(false);

  return (
    <nav className="nav" role="navigation" aria-label="Main">
      {/* Brand */}
      <Link to="/" className="brand" title="Back to home page" onClick={closeMenu}>
        Movify
      </Link>

      {/* User box */}
      <div className="userbox" aria-live="polite">
        {roleLabel && <span>{roleLabel}</span>}
        {username && <span className="user">{username}</span>}
      </div>

      {/* Burger button toggle */}
      <button
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="nav-panel"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="bars" aria-hidden="true" />
        <span className="sr-only">Menu</span>
      </button>

      {/* Collapsible panel (mobile/tablet). On desktop it becomes inline with CSS */}
      <div id="nav-panel" className={`nav-panel ${open ? "open" : ""}`}>
        <ul className="links" onClick={closeMenu}>
          <li><Link to="/movies">Movies</Link></li>
          <li><Link to="/members">Members</Link></li>
          <li><Link to="/subscriptions">Subscriptions</Link></li>
        </ul>

        {loggedIn && (
          <button onClick={handleLogout} className="btn-logout">
          Logout
          </button>
        )}
      </div>
    </nav>
  );
}

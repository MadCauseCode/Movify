// src/pages/Register.jsx
import { useMemo, useState } from "react";
import "./styles.css";
import { decodeJwt, isTokenValid } from "../utils/auth";
import { Link } from "react-router";

const API_BASE = "http://localhost:3000";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const token = sessionStorage.getItem("access_token");
  const loggedIn = isTokenValid(token);
  const roles = useMemo(() => (loggedIn ? decodeJwt(token) : null), [loggedIn, token]);
  const isAdmin = !!roles?.isAdmin;

  const handleRegister = async () => {
    if (!loggedIn || !isAdmin) {
      alert("Only admins can create users.");
      return;
    }
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: username.trim(),
          fullName: fullname.trim(),   
          password,                    
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Registration failed (${res.status})`);

      alert(`Account created successfully for ${data.username || username}!`);
      setUsername("");
      setPassword("");
      setFullName("");
      window.location.href='/'
    } catch (err) {
      alert(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelCreate = () => {
    window.location.href = "/";
  };

  if (!loggedIn) {
    alert("You must be logged in to register users.");
    window.location.href = "/";
    return;
  }
  if (!isAdmin) {
    alert("You do not have permission to register users.")
    window.location.href = "/";
    return;
  }

  return (
    <div className="container">
      <h2 className="title" style={{ color: "white"}}>Register a new Employee</h2>

      <input
        className="input"
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
      />
      <br />

      <input
        className="input"
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />
      <br />

      <input
        className="input"
        type="text"
        placeholder="Full Name"
        value={fullname}
        onChange={(e) => setFullName(e.target.value)}
        disabled={loading}
      />
      <br />

      <button className="btn-login" onClick={handleRegister} disabled={loading}>
        {loading ? "Registering..." : "Register"}
      </button>
      {' '}

      <button className="btn-login" onClick={cancelCreate} style={{background:'red'}}>cancel</button>
    </div>
  );
}

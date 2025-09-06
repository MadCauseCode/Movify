import { useState } from "react";
import "./styles.css";

const API_BASE = "http://localhost:3000"; 

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json()

      if (!res.ok) {
        const msg = data?.message || `Login failed (${res.status})`;
        throw new Error(msg);
      }

      const accessToken = data?.access_token;
      if (!accessToken) {
        throw new Error("No access_token in response");
      }
      sessionStorage.setItem("access_token", accessToken);


      const displayName = data?.user?.fullName || data?.user?.username || username;
      sessionStorage.setItem("username", displayName);
      if (data?.user?.role) sessionStorage.setItem("role", data.user.role);

      alert(`Welcome back ${displayName}!`);

      window.location.reload(); 
    } catch (err) {
      alert(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="title">Hello Employee, Please Login</h2>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
      />
      <br />

      <button className="btn-login" onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Log In"}
      </button>
      <br />
    </div>
  );
};

export default Login;

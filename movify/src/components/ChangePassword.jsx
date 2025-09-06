import { useState } from "react";
import "./styles.css";

const API_BASE = "http://localhost:3000";

export default function ChangePassword() {
  const [currentPassword, setCur] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentPassword || !newPassword || !confirm) {
      return alert("Please fill in all fields.");
    }
    if (newPassword !== confirm) {
      return alert("New passwords do not match.");
    }
    const token = sessionStorage.getItem("access_token");
    if (!token) return alert("You must be logged in.");

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || `Change password failed (${res.status})`);
      }

      const data = await res.json().catch(() => ({}));
      if (data?.token) {
        sessionStorage.setItem("access_token", data.token);
      }

      alert("Password changed successfully.");
      window.location.href = "/";
    } catch (e) {
      alert(e.message || "Change password failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2 className="title">Change Password</h2>

      <input
        className="input"
        type="password"
        placeholder="Current Password"
        value={currentPassword}
        onChange={(e) => setCur(e.target.value)}
        disabled={loading}
      /><br />

      <input
        className="input"
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNew(e.target.value)}
        disabled={loading}
      /><br />

      <input
        className="input"
        type="password"
        placeholder="Confirm New Password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={loading}
      /><br />

      <button className="btn-login" onClick={submit} disabled={loading}>
        {loading ? "Changing..." : "Change Password"}
      </button>
    </div>
  );
}

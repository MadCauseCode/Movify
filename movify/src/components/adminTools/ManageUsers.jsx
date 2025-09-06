import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { decodeJwt, isTokenValid } from "../../utils/auth";
import UserCard from "./userCard";
import { Link } from "react-router";

const API_BASE = "http://localhost:3000";
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      sessionStorage.removeItem("access_token");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

const Modal = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev || "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="icon-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const ManageUsers = () => {
  const token = sessionStorage.getItem("access_token");
  const loggedIn = isTokenValid(token);
  const claims = useMemo(
    () => (loggedIn ? decodeJwt(token) : null),
    [loggedIn, token]
  );
  const isAdmin = !!claims?.isAdmin;
  const role = (claims?.role || "user").toLowerCase();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    username: "",
    fullName: "",
    mustChangePassword: false,
    perms: [],
  });


  const ALL_PERMISSIONS = useMemo(() => {
    const tokenPerms = Array.isArray(claims?.perms) ? claims.perms : [];
    const userPerms = Array.isArray(editForm?.perms) ? editForm.perms : [];
    return Array.from(new Set([...tokenPerms, ...userPerms]));
  }, [claims, editForm]);

  useEffect(() => {
    if (!loggedIn || !isAdmin) return;
    const controller = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data } = await api.get("/users", { signal: controller.signal });
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        if (axios.isCancel(e)) return;
        setErr(
          e?.response?.data?.message || e?.message || "Failed to load users"
        );
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [loggedIn, isAdmin]);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((x) => (x._id || x.id) !== id));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  const handleEditOpen = async (id) => {
    try {
      setEditId(id);
      const { data } = await api.get(`/users/${id}`);
      setEditForm({
        username: String(data?.username || ""),
        fullName: String(data?.fullName || ""),
        mustChangePassword: !!data?.mustChangePassword,
        perms: Array.isArray(data?.perms) ? data.perms : [],
      });
      setEditOpen(true);
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Failed to load user");
    }
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditId(null);
  };

  const handlePermToggle = (perm) => {
    setEditForm((f) => {
      const has = f.perms.includes(perm);
      return {
        ...f,
        perms: has ? f.perms.filter((p) => p !== perm) : [...f.perms, perm],
      };
    });
  };

const handleEditSave = async () => {
  if (!editId) return;

  const payload = {
    username: editForm.username.trim(),
    fullName: editForm.fullName.trim(),
    mustChangePassword: !!editForm.mustChangePassword,
    perms: Array.isArray(editForm.perms) ? editForm.perms : [],
  };

  try {
    const { data } = await api.put(`/users/edit/${editId}`, payload);
    setUsers((prev) =>
      prev.map((u) =>
        String(u._id || u.id) === String(editId) ? { ...u, ...data } : u
      )
    );
    handleEditClose();
  } catch (e) {
    console.error("Update failed:", e?.response?.data || e.message);
    alert(
      e?.response?.data?.message ||
      e?.message ||
      "Failed to update user"
    );
  }
};


  const handleChangeRole = async (id, nextRole) => {
    try {
      const { data } = await api.put(`/users/${id}`, { role: nextRole });
      setUsers((prev) =>
        prev.map((u) =>
          String(u._id || u.id) === String(id) ? { ...u, ...data } : u
        )
      );
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Failed to change role"
      );
    }
  };

  const filtered = users.filter((u) => {
    const name = (u.fullName || u.username || "").toLowerCase();
    const role = (u.role || "").toLowerCase();
    const needle = search.trim().toLowerCase();
    return !needle || name.includes(needle) || role.includes(needle);
  });

  if (!isAdmin) {
    alert("Unauthorized");
    window.location.href = "/";
    return null;
  }

  return (
    <>
      {isAdmin && (
        <div className="container">
          <h1 className="title">Manage Users</h1>
          <p className="description">
            View and manage all registered users.
          </p>
          <input
            type="text"
            className="input"
            placeholder="Search by name or role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />{" "}
          <br />
          <button className="btn-login">
            <Link
              to="/register"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              Create User
            </Link>
          </button>{" "}
          <br />
          <br />
          {loading && <p>Loading…</p>}
          {!loading && err && <p style={{ color: "crimson" }}>{err}</p>}
          {!loading && !err && (
            <div className="user-list">
              {filtered.map((u) => (
                <UserCard
                  key={u._id || u.id}
                  user={u}
                  onDelete={handleDelete}
                  onEdit={handleEditOpen}
                  onChangeRole={handleChangeRole}
                />
              ))}
            </div>
          )}
          <Modal open={editOpen} onClose={handleEditClose} title="Edit user">
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                Username
                <input
                  className="input"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
              </label>
              <label>
                Full name
                <input
                  className="input"
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                />
              </label>
              <div>
                <strong>Permissions</strong>
                <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
                  {ALL_PERMISSIONS.map((perm) => (
                    <label
                      key={perm}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <input
                        type="checkbox"
                        checked={editForm.perms.includes(perm)}
                        onChange={() => handlePermToggle(perm)}
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>

              <label>
                <input
                  type="checkbox"
                  checked={editForm.mustChangePassword}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      mustChangePassword: e.target.checked,
                    }))
                  }
                />
                Require password change at next login
              </label>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={handleEditClose}>
                  Cancel
                </button>
                <button className="btn-login" onClick={handleEditSave}>
                  Save
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}
    </>
  );
};

export default ManageUsers;

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { isTokenValid, decodeJwt } from "../../utils/auth";
import MemberCard from "./MemberCard";

const API = "http://localhost:3000/members";

/** modal: closes on ESC and backdrop click, locks scroll from behind the modal. */
const Modal = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev || "";
    };
  }, [open, onClose]);

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  return (
    <div
      onClick={onBackdrop}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      <div
        style={{
          width: "min(560px, 92vw)",
          background: "var(--surface)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-lg)",
          padding: "var(--space-5)",
          color: "var(--text)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "var(--space-4)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
            {title || "Edit member"}
          </h3>
          <button
            onClick={onClose}
            style={{
              marginLeft: "auto",
              border: "none",
              background: "transparent",
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
              color: "var(--text)",
            }}
            aria-label="Close"
            title="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Members = () => {
  const token = sessionStorage.getItem("access_token");
  const loggedIn = isTokenValid(token);

  const claims = useMemo(() => (token ? decodeJwt(token) : null), [token]);
  const role = (claims?.role || "user").toLowerCase();
  const canUpdate = role === "admin" || role === "moderator";
  const canDelete = role === "admin";
  const canCreate = canUpdate;
  const canManage = canUpdate || canDelete;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [syncing, setSyncing] = useState(false);

  const [openMenu, setOpenMenu] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedId, setSelectedId] = useState(null);

  const emptyFields = { name: "", email: "", city: "" };
  const [editFields, setEditFields] = useState(emptyFields);
  const [createFields, setCreateFields] = useState(emptyFields);

  const [search, setSearch] = useState("");

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    if (!loggedIn) {
      alert("Please log in to access the Members page.");
      window.location.href = "/";
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await axios.get(API, {
          headers: authHeaders,
          signal: controller.signal,
        });
        setMembers(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        if (axios.isCancel(e)) return;

        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "Failed to fetch members.";

        if (status === 401 || status === 403) {
          alert("Session expired or unauthorized. Please log in again.");
          sessionStorage.removeItem("access_token");
          window.location.href = "/";
          return;
        }

        console.error("Error fetching members:", e);
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [loggedIn, authHeaders]);

  // Open in EDIT state
  const manageMenu = (realId) => (e) => {
    if (!canManage) return;
    e.stopPropagation();
    const member = members.find((m) => (m._id || m.id) === realId);
    if (!member) return;

    setModalMode("edit");
    setSelectedId(realId);
    setEditFields({
      name: member.name ?? "",
      email: member.email ?? "",
      city: member.city ?? "",
    });
    setOpenMenu(true);
  };

  // Open in CREATE sstate
  const openCreateMenu = () => {
    if (!canCreate) return;
    setModalMode("create");
    setSelectedId(null);
    setCreateFields(emptyFields);
    setOpenMenu(true);
  };

  const closeMenu = () => setOpenMenu(false);

  const handleDelete = async () => {
    if (!canDelete || !selectedId) return;
    const member = members.find((m) => (m._id || m.id) === selectedId);
    if (!member) return;
    if (!confirm(`Delete "${member.name || member.email || "member"}"?`))
      return;

    try {
      await axios.delete(`${API}/${selectedId}`, { headers: authHeaders });
      setMembers((prev) => prev.filter((m) => (m._id || m.id) !== selectedId));
      closeMenu();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Delete member failed."
      );
    }
  };

  const handleUpdate = async () => {
    if (!canUpdate || !selectedId) return;
    const member = members.find((m) => (m._id || m.id) === selectedId);
    if (!member) return;

    const id = member._id || member.id;
    if (!id) {
      alert("Member id missing; cannot update.");
      return;
    }

    const payload = ["name", "email", "city"].reduce((accumulator, key) => {
      const value = (editFields[key] ?? "").trim();
      if (value || value === "") {
        accumulator[key] = value;
      }
      return accumulator;
    }, {});

    try {
      const { data: updated } = await axios.put(`${API}/${id}`, payload, {
        headers: authHeaders,
      });
      setMembers((prev) =>
        prev.map((m) =>
          (m._id || m.id) === selectedId ? { ...m, ...updated } : m
        )
      );
      closeMenu();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Update member failed."
      );
    }
  };

  // Create
  const handleCreate = async () => {
    if (!canCreate) return;
    const payload = {
      name: (createFields.name || "").trim(),
      email: (createFields.email || "").trim(),
      city: (createFields.city || "").trim(),
    };
    if (!payload.name && !payload.email) {
      alert("Please provide at least a name or an email.");
      return;
    }
    try {
      const { data: newMember } = await axios.post(API, payload, {
        headers: authHeaders,
      });
      setMembers((prev) => [newMember, ...prev]);
      setCreateFields(emptyFields);
      closeMenu();
    } catch (e) {
      alert(
        e?.response?.data?.message || e?.message || "Create member failed."
      );
    }
  };

  const handleSync = async () => {
    if (role !== "admin") return;

    if (!confirm("Import members from JSONPlaceholder?")) return;

    try {
      setSyncing(true);
      const { data } = await axios.post(
        `${API}/sync`,
        {},
        { headers: authHeaders }
      );

      const created = Array.isArray(data?.created) ? data.created : [];
      const createdCount = Number.isFinite(data?.createdCount)
        ? data.createdCount
        : created.length;

      setMembers((prev) => {
        const seen = new Set(prev.map((m) => (m.email || "").toLowerCase()));
        const additions = created.filter(
          (m) => !seen.has((m.email || "").toLowerCase())
        );
        return [...additions, ...prev];
      });

      const memberWord = createdCount === 1 ? "member" : "members";
      alert(`Synced ${createdCount} new ${memberWord}.`);

    } catch (e) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || "Sync failed.";
      if (status === 401 || status === 403) {
        alert("Session expired or unauthorized. Please log in again.");
        sessionStorage.removeItem("access_token");
        window.location.href = "/";
        return;
      }
      alert(msg);
    } finally {
      setSyncing(false);
    }
  };

  const searchMember = (query) => setSearch((query || "").trim().toLowerCase());

  if (!loggedIn) return null;

  return (
    <div className="container">
      <h1 className="title" style={{ color: "white" }}>
        Members
      </h1>

      {/* Admin-only: Sync from movies REST API */}
      {role === "admin" && (
        <div
          style={{
            margin: "8px 1 12px",
            gap: 8,
          }}
        >
          <button className="btn-login" onClick={openCreateMenu}>
            + Create Member
          </button>{" "}
          <button
            className="btn-login"
            type="button"
            onClick={handleSync}
            disabled={syncing}
            style={{
              background: syncing ? "#999" : "#0b5",
              opacity: syncing ? 0.7 : 1,
            }}
            title="Import members from JSONPlaceholder (admin only)"
          >
            {syncing ? "Syncing…" : "Sync from API"}
          </button>
        </div>
      )}

      <h3 className="sub-title">
        Search Member:{" "}
        <input type="text" onChange={(e) => searchMember(e.target.value)} />
      </h3>

      {role === "user" && (
        <p className="description" style={{ opacity: 0.8 }}>
          View-only access
        </p>
      )}
      {role === "admin" || role === "moderator" && (
        <p className="description">Click a member to Update/Delete</p>
      )}

      {loading && <p>Loading…</p>}
      {!loading && err && (
        <p style={{ color: "crimson", fontWeight: 600 }}>{err}</p>
      )}

      {!loading && !err && (
        <div
          className="member-container"
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {members
            .filter((m) => {
              const q = search;
              if (!q) return true;
              const name = (m.name || "").toLowerCase();
              const email = (m.email || "").toLowerCase();
              const city = (m.city || "").toLowerCase();
              return name.includes(q) || email.includes(q) || city.includes(q);
            })
            .map((m, idx) => {
              const realId = m._id || m.id || null;
              const editable = canManage && Boolean(realId);
              return (
                <div
                  key={realId ?? `idx-${idx}`}
                  onClick={editable ? manageMenu(realId) : undefined}
                  style={{
                    cursor: editable ? "pointer" : "default",
                    opacity: 1,
                  }}
                  title={editable ? "Manage" : undefined}
                >
                  <MemberCard member={m} />
                </div>
              );
            })}
        </div>
      )}

      {/* Modal (never opens for role 'user') */}
      <Modal
        open={canManage && openMenu}
        onClose={closeMenu}
        title={modalMode === "edit" ? "Edit Member" : "Create Member"}
      >
        <>
          {modalMode === "edit" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label
                  style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
                >
                  Name
                </label>
                <input
                  className="input"
                  value={editFields.name}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Member name"
                  autoFocus
                  disabled={!canUpdate}
                />
              </div>

              <div>
                <label
                  style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
                >
                  Email
                </label>
                <input
                  className="input"
                  value={editFields.email}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="member@example.com"
                  disabled={!canUpdate}
                />
              </div>

              <div>
                <label
                  style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
                >
                  City
                </label>
                <input
                  className="input"
                  value={editFields.city}
                  onChange={(e) =>
                    setEditFields((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="City"
                  disabled={!canUpdate}
                />
              </div>

              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  className="btn-login"
                  type="button"
                  onClick={closeMenu}
                  style={{ background: "#eee", color: "#333" }}
                >
                  Close
                </button>
                {canUpdate && (
                  <button
                    className="btn-login"
                    type="button"
                    onClick={handleUpdate}
                  >
                    Update
                  </button>
                )}
                {canDelete && (
                  <button
                    className="btn-login"
                    type="button"
                    onClick={handleDelete}
                    style={{ background: "#b00020" }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {modalMode === "create" && canCreate && (
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label
                  style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
                >
                  Name
                </label>
                <input
                  className="input"
                  value={createFields.name}
                  onChange={(e) =>
                    setCreateFields((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Member name"
                  autoFocus
                />
              </div>

              <div>
                <label
                  style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
                >
                  Email
                </label>
                <input
                  className="input"
                  value={createFields.email}
                  onChange={(e) =>
                    setCreateFields((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="member@example.com"
                />
              </div>

              <div>
                <label
                  style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
                >
                  City
                </label>
                <input
                  className="input"
                  value={createFields.city}
                  onChange={(e) =>
                    setCreateFields((f) => ({ ...f, city: e.target.value }))
                  }
                  placeholder="City"
                />
              </div>

              <div
                style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
              >
                <button
                  className="btn-login"
                  type="button"
                  onClick={closeMenu}
                  style={{ background: "#eee", color: "#333" }}
                >
                  Cancel
                </button>
                <button
                  className="btn-login"
                  type="button"
                  onClick={handleCreate}
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </>
      </Modal>
    </div>
  );
};

export default Members;

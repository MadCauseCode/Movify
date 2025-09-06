import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { isTokenValid, decodeJwt } from "../../utils/auth";
import MemberCard from "./MemberCard";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router";

const API_SUBS = "http://localhost:3000/subscriptions";
const API_MEMBERS = "http://localhost:3000/members";
const API_MOVIES = "http://localhost:3000/movies";

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

  if (!open) return null;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={S.modalBackdrop}
    >
      <div style={S.modalCard}>
        <div style={S.modalHeader}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={S.iconBtn} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Subscriptions = () => {
  const token = sessionStorage.getItem("access_token");
  const loggedIn = isTokenValid(token);

  const claims = useMemo(() => (token ? decodeJwt(token) : null), [token]);
  const role = (claims?.role || "user").toLowerCase();
  const perms = claims?.perms || [];
  const canView = perms.includes("viewSubscriptions");
  const canUpdate = perms.includes("createSubscriptions");
  const canCreate = canUpdate;


  const [members, setMembers] = useState([]);
  const [movies, setMovies] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [openMenu, setOpenMenu] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [movieId, setMovieId] = useState("");
  const [date, setDate] = useState(new Date());
  const [search, setSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null); 

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const navigate = useNavigate();

  useEffect(() => {
    if (!loggedIn) {
      alert("Please log in to access the Subscriptions page.");
      window.location.href = "/";
      return;
    }
    if (!canView) {
      alert("You do not have permissions for this page.");
      window.location.href = "/";
      return;
    }

    const controller = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setErr("");

        const [mem, mov, subsRes] = await Promise.all([
          axios.get(API_MEMBERS, {
            headers: authHeaders,
            signal: controller.signal,
          }),
          axios.get(API_MOVIES, {
            headers: authHeaders,
            signal: controller.signal,
          }),
          axios.get(API_SUBS, {
            headers: authHeaders,
            signal: controller.signal,
          }),
        ]);

        setMembers(Array.isArray(mem.data) ? mem.data : []);
        setMovies(Array.isArray(mov.data) ? mov.data : []);
        setSubs(Array.isArray(subsRes.data) ? subsRes.data : []);
      } catch (e) {
        if (axios.isCancel(e)) return;
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message || e?.message || "Failed to fetch data.";
        if (status === 401 || status === 403) {
          alert("Session expired or unauthorized. Please log in again.");
          sessionStorage.removeItem("access_token");
          window.location.href = "/";
          return;
        }
        console.error("Fetch error:", e);
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [loggedIn, authHeaders, canCreate]);

  const subsByMember = useMemo(() => {
    const map = new Map();
    subs.forEach((s) => {
      const id = s.memberId?._id || s.memberId;
      map.set(id, s);
    });
    return map;
  }, [subs]);

  const getMovieName = (movieRef) =>
    typeof movieRef === "string"
      ? movies.find((mv) => mv._id === movieRef)?.name || "Unknown"
      : movieRef?.name || "Unknown";
  const getMovieId = (movieRef) =>
    typeof movieRef === "string" ? movieRef : movieRef?._id;

  const openAddMovieModal = (member) => {
    if (!canCreate) return;
    setSelectedMember(member);
    setMovieId("");
    setDate(new Date());
    setOpenMenu(true);
  };

  const handleAddMovie = async () => {
    if (!selectedMember || !movieId) return;
    try {
      setSaving(true);
      const existing = subs.find(
        (s) => (s.memberId?._id || s.memberId) === selectedMember._id
      );
      if (existing) {
        const { data } = await axios.put(
          `${API_SUBS}/${existing._id}`,
          { movieId, date },
          { headers: authHeaders }
        );
        setSubs((prev) => prev.map((s) => (s._id === existing._id ? data : s)));
      } else {
        const { data } = await axios.post(
          API_SUBS,
          { memberId: selectedMember._id, movies: [{ movieId, date }] },
          { headers: authHeaders }
        );
        setSubs((prev) => [data, ...prev]);
      }
      setOpenMenu(false);
    } catch (e) {
      console.error("Error adding movie:", e);
      alert(e?.response?.data?.message || "Add movie failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMovie = async (subId, mvId) => {
    if (!canUpdate) {
      alert("You do not have permission to delete movies.");
      return;
    }
    if (!confirm("Remove this movie from subscription?")) return;
    try {
      setDeletingId(mvId);
      const { data } = await axios.put(
        `${API_SUBS}/remove-movie/${subId}`,
        { movieId: mvId },
        { headers: authHeaders }
      );
      setSubs((prev) => prev.map((s) => (s._id === subId ? data : s)));
    } catch (e) {
      console.error("Error deleting movie:", e);
      alert(e?.response?.data?.message || "Delete movie failed");
    } finally {
      setDeletingId(null);
    }
  };

  const goToMovie = (movieId) => {
    navigate(`/movies?movieId=${movieId}`);
  };

  const searchMember = (query) => setSearch((query || "").trim().toLowerCase());

  if (!loggedIn) return null;

  return (
    <div className="container">
      <h1 className="title">Subscriptions</h1>

      {loading && <p>Loading…</p>}
      {!loading && err && <p style={{ color: "crimson" }}>{err}</p>}

      {!loading && !err && (
        <>
          <div style={S.toolbar}>
            <div style={{ fontWeight: 600 }}>Members</div>
            <input
              type="text"
              onChange={(e) => searchMember(e.target.value)}
              placeholder="Search name, email, city"
              style={S.search}
              aria-label="Search members"
            />
          </div>

          <div style={S.grid}>
            {members
              .filter((m) => {
                const q = search;
                if (!q) return true;
                const name = (m.name || "").toLowerCase();
                const email = (m.email || "").toLowerCase();
                const city = (m.city || "").toLowerCase();
                return (
                  name.includes(q) || email.includes(q) || city.includes(q)
                );
              })
              .map((m) => {
                const sub = subsByMember.get(m._id);
                return (
                  <section key={m._id} style={S.card}>
                    <div style={S.cardHeader}>
                      <MemberCard member={m} />
                      {canCreate && (
                        <button
                          className="btn-login"
                          onClick={() => openAddMovieModal(m)}
                          disabled={saving}
                          style={S.primaryBtn}
                        >
                          + Add Movie
                        </button>
                      )}
                    </div>

                    {/* Compact table */}
                    <div
                      style={S.tableWrap}
                      role="table"
                      aria-label="Movies watched"
                    >
                      <div style={S.tableHead} role="row">
                        <div style={S.th} role="columnheader">
                          Movie
                        </div>
                        <div style={S.th} role="columnheader">
                          Watched
                        </div>
                        <div style={S.thRight} role="columnheader"></div>
                      </div>

                      <div role="rowgroup">
                        {(sub?.movies?.length ?? 0) > 0 ? (
                          sub.movies.map((movieEntry, idx) => {
                            const name = getMovieName(movieEntry.movieId);
                            const id = getMovieId(movieEntry.movieId);
                            const watched = new Date(
                              movieEntry.date
                            ).toLocaleDateString();

                            return (
                              <div key={idx} style={S.tr} role="row">
                                <div
                                  style={{
                                    ...S.td,
                                    cursor: "pointer",
                                    color: "#50a0ff",
                                  }}
                                  role="cell"
                                  title={`View ${name}`}
                                  onClick={() => goToMovie(id)}
                                >
                                  {name}
                                </div>

                                <div style={S.td} role="cell">
                                  {watched}
                                </div>
                                <div style={S.tdRight} role="cell">
                                  {canUpdate && (
                                    <button
                                      onClick={() =>
                                        handleDeleteMovie(sub._id, id)
                                      }
                                      disabled={deletingId === id}
                                      style={S.iconBtnGhost}
                                      aria-label={`Delete ${name}`}
                                      title="Delete"
                                    >
                                      {deletingId === id ? "…" : "🗑"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={S.emptyRow} role="row">
                            <div style={S.td} role="cell" colSpan={3}>
                              <em style={{ opacity: 0.75 }}>No movies yet.</em>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                );
              })}
          </div>
        </>
      )}

      <Modal
        open={openMenu}
        onClose={() => setOpenMenu(false)}
        title={
          selectedMember
            ? `Add Movie for ${selectedMember.name || selectedMember.email}`
            : "Add Movie"
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            <div style={S.label}>Movie</div>
            <select
              className="input"
              value={movieId}
              onChange={(e) => setMovieId(e.target.value)}
              disabled={saving}
              style={S.select}
            >
              <option value="">Select a movie</option>
              {movies.map((mv) => (
                <option key={mv._id} value={mv._id}>
                  {mv.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div style={S.label}>Date</div>
            <DatePicker
              selected={date}
              onChange={(d) => setDate(d)}
              showTimeSelect
              dateFormat="Pp"
              className="input"
              disabled={saving}
              wrapperClassName="datepicker-wrapper"
              popperPlacement="auto"
            />
          </label>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              className="btn-login"
              onClick={() => setOpenMenu(false)}
              style={S.secondaryBtn}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="btn-login"
              onClick={handleAddMovie}
              disabled={saving || !movieId}
              style={S.primaryBtn}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Subscriptions;

/* ===== in line styling ===== */
const S = {
  grid: {
    display: "grid",
    gap: 16,
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    margin: "0 0 12px",
  },
  search: {
    marginLeft: "auto",
    width: "min(340px, 60vw)",
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid rgba(140,140,160,0.3)",
    outline: "none",
  },
  card: {
    border: "1px solid rgba(140,140,160,0.25)",
    borderRadius: 12,
    background: "rgba(255,255,255,0.04)",
    padding: 12,
    display: "grid",
    gap: 10,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    justifyContent: "space-between",
  },
  tableWrap: {
    border: "1px solid rgba(140,140,160,0.25)",
    borderRadius: 10,
    overflow: "hidden",
  },
  tableHead: {
    display: "grid",
    gridTemplateColumns: "1fr auto 42px",
    background: "rgba(255,255,255,0.06)",
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.2,
  },
  th: { alignSelf: "center" },
  thRight: { textAlign: "right" },
  tr: {
    display: "grid",
    gridTemplateColumns: "1fr auto 42px",
    padding: "10px 10px",
    alignItems: "center",
    borderTop: "1px solid rgba(140,140,160,0.15)",
  },
  td: { fontSize: 14 },
  tdRight: { textAlign: "right" },
  emptyRow: {
    padding: "12px 10px",
  },
  label: { fontSize: 12, fontWeight: 600, marginBottom: 6, opacity: 0.8 },
  primaryBtn: {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid rgba(80,160,255,0.35)",
    background: "rgba(80,160,255,0.15)",
    color: "inherit",
    cursor: "pointer",
  },
  secondaryBtn: {
    padding: "6px 10px",
    borderRadius: 8,
    background: "#eee",
    color: "#333",
    border: "none",
    cursor: "pointer",
  },
  iconBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 20,
    lineHeight: 1,
    padding: 2,
  },
  iconBtnGhost: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "grid",
    placeItems: "center",
    zIndex: 1000,
    padding: 16,
  },
  modalCard: {
    width: "min(560px, 92vw)",
    background: "var(--surface, #fff)",
    color: "var(--text, #111)",
    borderRadius: 8,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  modalHeader: { display: "flex", alignItems: "center", marginBottom: 12 },
};

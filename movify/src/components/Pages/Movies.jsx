import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { isTokenValid, decodeJwt } from "../../utils/auth";
import MovieCard from "./MovieCard";
import { useLocation } from "react-router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API = "http://localhost:3000/movies";
const API_SUBS = "http://localhost:3000/subscriptions";

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
      className="modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Dialog"}
    >
      <div className="modal">
        <div className="modal-header">
          <h3 className="modal-title">{title || "Dialog"}</h3>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Movies = () => {
  const token = sessionStorage.getItem("access_token");
  const loggedIn = isTokenValid(token);

  const claims = useMemo(() => (token ? decodeJwt(token) : null), [token]);
  const role = (claims?.role || "user").toLowerCase();
  const perms = claims?.perms || [];

  const canView = perms.includes("viewMovies");
  const canUpdate = perms.includes("createMovies");
  const canCreate = perms.includes("createMovies");
  const canDelete = perms.includes("deleteMovies");

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const filterMovieId = params.get("movieId");

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [openMenu, setOpenMenu] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedId, setSelectedId] = useState(null);
  const [movieForm, setMovieForm] = useState({
    id: "",
    name: "",
    genres: "",
    image: "",
    premiered: null,
  });

  const [movieWatchers, setMovieWatchers] = useState([]);

  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    if (!loggedIn) {
      alert("Please log in to access the movies page.");
      window.location.href = "/";
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await axios.get(API, { headers: authHeaders });
        setMovies(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Error fetching movies:", e);
        setErr(
          e?.response?.data?.message || e?.message || "Failed to fetch movies."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [loggedIn, authHeaders]);

  useEffect(() => {
    if (filterMovieId) setSearch("");
  }, [filterMovieId]);

  const findSubscriptions = async (movieId) => {
    try {
      const { data: subs } = await axios.get(
        `${API_SUBS}/by-movie/${movieId}`,
        { headers: authHeaders }
      );

      const watchers = subs.flatMap((sub) =>
        sub.movies
          .filter((m) => String(m.movieId?._id || m.movieId) === String(movieId))
          .map((m) => ({
            memberName: sub.memberId?.name || "Unknown member",
            dateWatched: m.date ? new Date(m.date).toLocaleDateString() : "N/A",
          }))
      );

      setMovieWatchers(watchers);
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      setMovieWatchers([]);
    }
  };

  const manageMenu = (realId) => (e) => {
    if (!canUpdate && !canDelete) return;
    e.stopPropagation();
    const movie = movies.find((m) => (m._id || m.id) === realId);
    if (!movie) return;
    setModalMode("edit");
    setSelectedId(realId);
    setMovieForm({
      id: movie?._id || movie?.id || "",
      name: movie?.name || "",
      genres: (movie?.genres || []).join(", "),
      image: movie?.image || "",
      premiered: movie?.premiered ? new Date(movie.premiered) : null,
    });
    setMovieWatchers([]); 
    setOpenMenu(true);
    findSubscriptions(realId); 
  };

  const openCreateMenu = () => {
    if (!canCreate) return;
    setModalMode("create");
    setSelectedId(null);
    setMovieForm({ id: "", name: "", genres: "", image: "", premiered: null });
    setMovieWatchers([]);
    setOpenMenu(true);
  };

  const closeMenu = () => setOpenMenu(false);

  const handleDelete = async (id) => {
    if (!canDelete) return;
    try {
      await axios.delete(`${API}/${id}`, { headers: authHeaders });
      setMovies((prev) => prev.filter((m) => (m._id || m.id) !== id));
      closeMenu();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Delete failed");
    }
  };

  const handleUpdate = async () => {
    if (!canUpdate || !selectedId) return;
    try {
      const payload = {
        name: movieForm.name.trim(),
        genres: movieForm.genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        image: movieForm.image.trim(),
        premiered: movieForm.premiered
          ? movieForm.premiered.toISOString().split("T")[0]
          : null,
      };
      const { data } = await axios.put(`${API}/${selectedId}`, payload, {
        headers: authHeaders,
      });
      setMovies((prev) =>
        prev.map((m) =>
          String(m._id || m.id) === String(selectedId) ? { ...m, ...data } : m
        )
      );
      closeMenu();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Update failed");
    }
  };

  const createMovieHandler = async () => {
    if (!canCreate) return;
    try {
      const payload = {
        name: movieForm.name.trim(),
        genres: movieForm.genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        image: movieForm.image.trim(),
        premiered: movieForm.premiered
          ? movieForm.premiered.toISOString().split("T")[0]
          : null,
      };
      const { data } = await axios.post(API, payload, { headers: authHeaders });
      setMovies((prev) => [...prev, data]);
      closeMenu();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "Create failed");
    }
  };

  const [search, setSearch] = useState("");
  const searchMovie = (query) => setSearch((query || "").trim().toLowerCase());

  if (!loggedIn || !canView) return null;

  return (
    <div className="container">
      <h1 className="title" style={{ color: "white" }}>
        Movies
      </h1>

      {canCreate && (
        <div style={{ margin: "8px 0 12px" }}>
          <button className="btn-login" onClick={openCreateMenu}>
            + Create Movie
          </button>
        </div>
      )}

      {!filterMovieId && (
        <h3 className="subtitle" style={{ color: "white" }}>
          Search Movie:{" "}
          <input
            type="text"
            onChange={(e) => searchMovie(e.target.value)}
            placeholder="Type to filter..."
          />
        </h3>
      )}

      {filterMovieId && (
        <div style={{ margin: "8px 0" }}>
          <button
            className="btn-secondary"
            onClick={() => (window.location.href = "/movies")}
          >
            ← Back to All Movies
          </button>
        </div>
      )}

      {loading && <p>Loading…</p>}
      {!loading && err && (
        <p style={{ color: "crimson", fontWeight: 600 }}>{err}</p>
      )}

      {!loading && !err && (
        <div className="movie-grid">
          {movies
            .filter((m) => {
              if (filterMovieId) return (m._id || m.id) === filterMovieId;
              if (!search) return true;
              return (m.name || "").toLowerCase().includes(search);
            })
            .map((m, idx) => {
              const realId = m._id || m.id || null;
              const editable = (canUpdate || canDelete) && Boolean(realId);
              return (
                <div
                  key={realId ?? `idx-${idx}`}
                  onClick={editable ? manageMenu(realId) : undefined}
                  title={editable ? "Manage" : undefined}
                  style={{ cursor: editable ? "pointer" : "default" }}
                >
                  <MovieCard movie={m} />
                </div>
              );
            })}
        </div>
      )}

      <Modal
        open={openMenu}
        onClose={closeMenu}
        title={
          modalMode === "edit"
            ? `Edit "${movieForm.name || "Untitled"}"`
            : "Create Movie"
        }
      >
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            Name
            <input
              type="text"
              className="input"
              value={movieForm.name}
              onChange={(e) =>
                setMovieForm((f) => ({ ...f, name: e.target.value }))
              }
            />
          </label>
          <label>
            ID
            <input
              type="text"
              className="input"
              value={movieForm.id}
              readOnly
            />
          </label>
          <label>
            Genres (comma separated)
            <input
              type="text"
              className="input"
              value={movieForm.genres}
              onChange={(e) =>
                setMovieForm((f) => ({ ...f, genres: e.target.value }))
              }
            />
          </label>
          <label>
            Image URL
            <input
              type="text"
              className="input"
              value={movieForm.image}
              onChange={(e) =>
                setMovieForm((f) => ({ ...f, image: e.target.value }))
              }
            />
          </label>
          <label>
            Premiered
            <DatePicker
              selected={movieForm.premiered}
              onChange={(date) =>
                setMovieForm((f) => ({ ...f, premiered: date }))
              }
              dateFormat="yyyy-MM-dd"
              className="input"
              placeholderText="Select a date"
            />
          </label>

          <ul>
            <li>
              <strong>Subscriptions</strong>
            </li>
            <ul>
              {movieWatchers.length === 0 && <li>No subscriptions yet</li>}
              {movieWatchers.map((w, idx) => (
                <li key={idx}>
                  {w.memberName} – watched on {w.dateWatched}
                </li>
              ))}
            </ul>
          </ul>

          <div className="modal-actions">
            {modalMode === "edit" && canUpdate && (
              <button className="btn-login" onClick={handleUpdate}>
                Save
              </button>
            )}
            {modalMode === "create" && canCreate && (
              <button className="btn-login" onClick={createMovieHandler}>
                Create
              </button>
            )}
            {modalMode === "edit" && canDelete && (
              <button
                className="btn-danger"
                onClick={() => handleDelete(selectedId)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Movies;

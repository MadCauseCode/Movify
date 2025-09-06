const MovieCard = ({ movie }) => {
  const title = movie?.name?.trim() || "Untitled";
  const genres = Array.isArray(movie?.genres) ? movie.genres : [];
  const img = movie?.image || "";
  const premiered = movie?.premiered ? String(movie.premiered) : "Unknown";

  return (
    <div
      className="movie-item"
      style={{ padding: 12 }}
    >
      <h2 style={{ fontSize: "1.1rem", margin: "0 0 8px" }}>{title}</h2>
      <p style={{ margin: "0 0 8px", color: "#555" }}>
        Genres: {genres.length ? genres.join(", ") : "—"} <br />
        Premiered: {premiered}
      </p>

      {img ? (
        <img
          src={img}
          alt={title || "Movie Poster"}
          style={{
            width: "10rem",
            height: "15rem",
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: 300,
            background: "#f2f2f2",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
          }}
        >
          No image
        </div>
      )}
    </div>
  );
};

export default MovieCard;

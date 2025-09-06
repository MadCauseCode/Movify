import { findByMovieName, createMovie } from "../repositories/movieRepo.js";

export async function syncOne(movie) {
  if (!movie?.name) {
    const err = new Error("movie.name is required");
    err.status = 400;
    throw err;
  }

  const exists = await findByMovieName(movie.name).lean();
  if (exists) {
    const err = new Error("Movie already exists");
    err.status = 409;
    throw err;
  }

  return createMovie({
    name: movie.name.trim(),
    genres: Array.isArray(movie.genres) ? movie.genres : [],
    image: typeof movie.image === "string" ? movie.image.trim() : "",
    premiered: movie.premiered ? String(movie.premiered).trim() : "",
  });
}

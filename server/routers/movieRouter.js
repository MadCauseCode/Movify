import { Router } from "express";
import axios from "axios";
import {
  createMovie,
  findByMovieName,
  getMovieById,
  updateMovie,
  deleteMovie,
} from "../repositories/movieRepo.js";
import { requireAuth, requirePermission } from "../services/authService.js";

const TVMAZE = "https://api.tvmaze.com/shows";
const router = Router();


// helpers
const normalizeGenres = (g) => {
  if (Array.isArray(g)) return g.filter(Boolean);
  if (typeof g === "string" && g.trim()) return [g.trim()];
  return [];
};

const toMovieDTO = (doc) => ({
  _id: doc._id,
  name: doc.name,
  genres: Array.isArray(doc.genres) ? doc.genres : [],
  image: doc.image || "",
  premiered: doc.premiered || "",
});

router.get(
  "/",
  requireAuth,
  requirePermission("viewMovies"),
  async (req, res, next) => {
    try {
      const Movie = (await import("../models/movieModel.js")).default;
      const docs = await Movie.find({}, "name genres image premiered").lean();
      return res.json((docs || []).map(toMovieDTO));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("viewMovies"),
  async (req, res, next) => {
    try {
      const doc = await getMovieById(req.params.id);
      if (!doc) return res.status(404).json({ message: "Movie not found" });
      return res.json(toMovieDTO(doc));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  requireAuth,
  requirePermission("createMovies"),
  async (req, res, next) => {
    try {
      const name = (req.body?.name || "").trim();
      const genres = normalizeGenres(req.body?.genres);
      const image = req.body?.image || "";
      const premiered = req.body?.premiered || "";

      if (!name) {
        return res.status(400).json({ message: "Field 'name' is required" });
      }

      const created = await createMovie({ name, genres, image, premiered });
      return res.status(201).json(toMovieDTO(created));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("createMovies"), 
  async (req, res, next) => {
    try {
      const updates = {};
      if (typeof req.body?.name === "string") updates.name = req.body.name.trim();
      if (req.body?.genres !== undefined)
        updates.genres = normalizeGenres(req.body.genres);
      if (req.body?.image !== undefined) updates.image = req.body.image || "";
      if (req.body?.premiered !== undefined)
        updates.premiered = req.body.premiered || "";

      if (!Object.keys(updates).length) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updated = await updateMovie(req.params.id, updates);
      if (!updated) return res.status(404).json({ message: "Movie not found" });

      return res.json(toMovieDTO(updated));
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("deleteMovies"),
  async (req, res, next) => {
    try {
      const deleted = await deleteMovie(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Movie not found" });
      res.json({ message: "Movie deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// Sync from TVMaze REST API (only admin can sync)
router.post(
  "/sync",
  requireAuth,
  requirePermission("syncMembers"),
  async (req, res, next) => {
    try {
      const page = Number(req.query.page ?? 0);
      const { data } = await axios.get(TVMAZE, { params: { page } });
      const raw = Array.isArray(data) ? data : [];

      let createdCount = 0;
      const created = [];

      for (const s of raw) {
        const name = (s?.name || "").trim();
        if (!name) continue;

        const exists = await findByMovieName(name);
        if (exists) continue;

        const genres = Array.isArray(s?.genres) ? s.genres : [];
        const image = s?.image?.original || s?.image?.medium || "";
        const premiered = s?.premiered || "";

        const doc = await createMovie({ name, genres, image, premiered });
        createdCount += 1;
        created.push(toMovieDTO(doc));
      }

      return res.json({
        message: "Movies synchronized successfully",
        createdCount,
        created,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

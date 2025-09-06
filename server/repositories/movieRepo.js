import Movie from "../models/movieModel.js";

const findByMovieName = (name) => Movie.findOne({ name });
const getMovieById = (id) => Movie.findById(id);
const createMovie = (obj) => Movie.create(obj);
const updateMovie = (id, obj) =>
  Movie.findByIdAndUpdate(id, obj, { new: true, runValidators: true });
const deleteMovie = (id) => Movie.findByIdAndDelete(id);

export { findByMovieName, getMovieById, createMovie, updateMovie, deleteMovie };

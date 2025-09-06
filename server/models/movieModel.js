import mongoose from "mongoose";
import { subsConn } from "../configs/db.js";

const movieSchema = new mongoose.Schema(
    {
        id: { type: String},
        name: { type: String, required: true, trim: true },
        genres: { type: [String], default: [] },
        image: { type: String, default: "" }, 
        premiered: { type: String, default: "" },
      },
      {
        collection: "Movies", 
        timestamps: true,
      }
);

const Movie = subsConn.model("Movie", movieSchema);
export default Movie;

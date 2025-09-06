import mongoose from "mongoose";
import { subsConn } from "../configs/db.js";

const subscriptionSchema = new mongoose.Schema(
    {
        memberId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Member" },
        movies: [{ 
            movieId: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true},
            date: { type: Date, default: Date.now }
        }]
      }
      ,{
        collection: "Subscriptions", 
        timestamps: true,
      }
);

const Subscription = subsConn.model("Subscription", subscriptionSchema);
export default Subscription;

import mongoose from "mongoose";
import { subsConn } from "../configs/db.js";

const memberSchema = new mongoose.Schema(
    {
        id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        name: { type: String, required: true},
        email: { type: String, default: [] },
        city: { type: String, default: "" }, 
      }
      ,{
        collection: "Members", 
        timestamps: true,
      }
);

const Member = subsConn.model("Member", memberSchema);
export default Member;

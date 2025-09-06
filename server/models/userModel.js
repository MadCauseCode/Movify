import mongoose from "mongoose";
import { usersConn } from "../configs/db.js";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String, default: "", trim: true },
    role: {
      type: String,
      trim: true,
      lowercase: true,
      default: "user",
    },
    mustChangePassword: { type: Boolean, default: true },

    passwordVersion: { type: Number, default: 1 },
    passwordUpdatedAt: { type: Date },
    perms: { type: [String], default: [] },

    createdDate: { type: Date, default: Date.now },
    sessionTimeOut: { type: Number, default: 60 },
  },
  { collection: "users", timestamps: true }
);

const User = usersConn.model("User", userSchema);
export default User;

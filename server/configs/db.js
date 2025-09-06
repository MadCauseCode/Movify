import mongoose from "mongoose";

export const usersConn = mongoose.createConnection("mongodb://localhost:27017/UsersDB");
export const subsConn  = mongoose.createConnection("mongodb://localhost:27017/SubscriptionsDB");

export async function connectDB() {
  try {
    await Promise.all([usersConn.asPromise(), subsConn.asPromise()]);
    console.log("✅ Connected to UsersDB and SubscriptionsDB successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}
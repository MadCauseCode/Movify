import express from "express";
import cors from "cors";
import { connectDB } from "./configs/db.js";
import authRouter from "./routers/authRouter.js";
import movieRouter from "./routers/movieRouter.js";
import memberRouter from "./routers/memberRouter.js";
import userRouter from "./routers/userRouter.js";
import subscriptionRouter from "./routers/subscriptionRouter.js";
import dotenv from "dotenv";


dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

await connectDB(); 

app.use("/auth", authRouter);
app.use("/movies", movieRouter);
app.use("/members", memberRouter);
app.use("/users", userRouter);
app.use("/subscriptions", subscriptionRouter);

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, _next) => {
  console.error("ERR:", req.method, req.url, err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});


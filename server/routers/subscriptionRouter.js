import express from "express";
import Subscription from "../models/subscriptionModel.js";
import mongoose from "mongoose";

import {
  getAllSubscriptions,
  getAllMemberSubscriptions,
  addSubscription,
} from "../services/subscriptionService.js";


const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const subscriptions = await getAllSubscriptions();
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:memberId", async (req, res) => {
  try {
    const { memberId } = req.params;
    const subscriptions = await getAllMemberSubscriptions(memberId);
    res.status(200).json(subscriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/by-movie/:movieId", async (req, res) => {
  try {
    const { movieId } = req.params;

    const subs = await Subscription.find({ "movies.movieId": movieId })
      .populate("memberId", "name email city")
      .populate("movies.movieId", "name year");

    res.status(200).json(subs);
  } catch (error) {
    console.error("Error fetching subs by movieId:", error);
    res.status(500).json({ message: error.message });
  }
});


router.post("/", async (req, res) => {
  try {
    const newSubscription = await addSubscription(req.body);
    res.status(201).json(newSubscription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { movieId, date } = req.body;

    if (!movieId) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const updated = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          movies: {
            movieId,
            date: date || new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    )
      .populate("memberId", "name email city")
      .populate("movies.movieId", "name year");

    if (!updated) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/remove-movie/:id", async (req, res) => {
  try {
    const { movieId } = req.body;

    if (!movieId) {
      return res.status(400).json({ message: "movieId is required" });
    }

    const updated = await Subscription.findByIdAndUpdate(
      req.params.id,
      {
        $pull: { movies: { movieId: new mongoose.Types.ObjectId(movieId) } },
      },
      { new: true, runValidators: true }
    )
      .populate("memberId", "name email city")
      .populate("movies.movieId", "name year");

    if (!updated) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error removing movie:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:subId/movies/:movieId", async (req, res) => {
  try {
    console.log(req.body);
    const { subId, movieId } = req.params;

    const updated = await Subscription.findByIdAndUpdate(
      subId,
      { $pull: { movies: { movieId } } },
      { new: true, runValidators: true }
    )
      .populate("memberId", "name email city")
      .populate("movies.movieId", "name year");

    if (!updated) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error removing movie:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;

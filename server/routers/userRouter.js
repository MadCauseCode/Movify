import { Router } from "express";
import User from "../models/userModel.js";
import { requireAuth, requirePermission } from "../services/authService.js";
import { readFileSync } from "fs";

const router = Router();

// Load role to perms mapping 
const rolePermissions = JSON.parse(
  readFileSync(new URL("../data/permissions.json", import.meta.url))
);

router.get(
  "/",
  requireAuth,
  requirePermission("manageUsers"),
  async (req, res, next) => {
    try {
      const users = await User.find(
        {},
        "username fullName role mustChangePassword perms"
      ).lean();
      return res.json(users);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("manageUsers"),
  async (req, res, next) => {
    try {
      const user = await User.findById(
        req.params.id,
        "username fullName role mustChangePassword perms"
      ).lean();
      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("manageUsers"),
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      if (!userId)
        return res.status(400).json({ message: "User ID is required" });

      const user = await User.findByIdAndDelete(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      return res.json({ message: "User deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("manageUsers"),
  async (req, res, next) => {
    try {
      const nextRole = String(req.body?.role || "").toLowerCase();

      // Only allow demotion/promotion to user or mod
      if (!["user", "moderator"].includes(nextRole)) {
        return res
          .status(400)
          .json({ message: "Role must be 'user' or 'moderator'" });
      }

      const current = await User.findById(req.params.id)
        .select("role username fullName")
        .lean();
      if (!current) return res.status(404).json({ message: "User not found" });

      // Prevent downgrading admins
      if (String(current.role).toLowerCase() === "admin") {
        return res
          .status(403)
          .json({ message: "Admin role cannot be changed via this route" });
      }

      // resync perms from permissions.json
      const perms = rolePermissions.roles?.[nextRole] || [];

      const updated = await User.findByIdAndUpdate(
        req.params.id,
        { role: nextRole, perms },
        { new: true, runValidators: true }
      )
        .select("username fullName role mustChangePassword perms")
        .lean();

      return res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// cant change role here
router.put(
  "/edit/:id",
  requireAuth,
  requirePermission("manageUsers"),
  async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { username, fullName, mustChangePassword, perms } = req.body;

      const update = {};
      if (typeof username === "string") update.username = username;
      if (typeof fullName === "string") update.fullName = fullName;
      if (typeof mustChangePassword === "boolean")
        update.mustChangePassword = mustChangePassword;
      if (Array.isArray(perms))
        update.perms = perms.filter((p) => typeof p === "string");

      const updated = await User.findByIdAndUpdate(userId, update, {
        new: true,
        runValidators: true,
      })
        .select("username fullName role mustChangePassword perms")
        .lean();

      if (!updated) return res.status(404).json({ message: "User not found" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

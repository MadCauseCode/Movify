import { Router } from "express";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import { requireAuth, requirePermission, login, changePassword } from "../services/authService.js";
import { readFileSync } from "fs";

// Load role to perms mapping
const rolePermissions = JSON.parse(
  readFileSync(new URL("../data/permissions.json", import.meta.url))
);

const router = Router();

// system admin creates a user
router.post(
  "/register",
  requireAuth,
  requirePermission("manageUsers"),
  async (req, res, next) => {
    try {
      const {
        username,
        password,
        fullName,
        fullname,
        role: incomingRole = "user",
        mustChangePassword = true,
      } = req.body || {};

      const name = String(username || "").trim();
      const pw = String(password || "");
      const displayName = String(fullName ?? fullname ?? "").trim();
      const roleNorm = String(incomingRole || "user").toLowerCase();

      if (!name || !pw) {
        return res
          .status(400)
          .json({ message: "username and password are required" });
      }

      const exists = await User.findOne({ username: name }).lean();
      if (exists) {
        return res.status(409).json({ message: "Username already taken" });
      }

      const passwordHash = await bcrypt.hash(pw, 12);

      const perms = rolePermissions.roles?.[roleNorm] || [];

      const doc = await User.create({
        username: name,
        fullName: displayName,
        role: roleNorm,
        passwordHash,
        mustChangePassword: !!mustChangePassword,
        passwordVersion: 1,
        perms,
      });

      return res.status(201).json({
        id: String(doc._id),
        username: doc.username,
        fullName: doc.fullName || "",
        role: doc.role,
        mustChangePassword: doc.mustChangePassword,
        perms: doc.perms,
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({ message: "Username already taken" });
      }
      next(err);
    }
  }
);

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const result = await login({ username, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.put("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, oldPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const token = await changePassword({
      userId: req.user.id,
      currentPassword: currentPassword ?? oldPassword,
      newPassword,
    });

    return res.json({ token });
  } catch (err) {
    next(err);
  }
});

export default router;

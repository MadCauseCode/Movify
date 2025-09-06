// services/authService.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import usersFile from "../data/users.json" with { type: "json" };
import permsFile from "../data/permissions.json" with { type: "json" };

const TOKEN_TTL = "2h";

// load roles to permissions map
const { roles: RAW_ROLES = {} } = permsFile || {};
const ROLE_PERMS = Object.fromEntries(
  Object.entries(RAW_ROLES).map(([role, list]) => [
    role.toLowerCase(),
    new Set(list || []),
  ])
);

// helpers
function getPermissionsForRole(role) {
  return Array.from(ROLE_PERMS[role?.toLowerCase()] ?? []);
}

export function canRole(role, perm) {
  if (role?.toLowerCase() === "admin") return true;
  return ROLE_PERMS[role?.toLowerCase()]?.has(perm) === true;
}

function resolveRole(userDoc) {
  const byId = usersFile?.find?.((u) => String(u.id) === String(userDoc._id));
  const byName = usersFile?.find?.((u) => u.username === userDoc.username);
  return (userDoc.role || byId?.role || byName?.role || "user").toLowerCase();
}

export async function register({ username, password, fullName, role }) {
  const exists = await User.findOne({ username }).lean();
  if (exists) {
    const err = new Error("Username already taken");
    err.status = 409;
    throw err;
  }

  const allowedRoles = new Set(["user", "moderator", "admin"]);
  const incomingRole = (role || "").toLowerCase();
  const safeRole = allowedRoles.has(incomingRole) ? incomingRole : "user";

  const passwordHash = await bcrypt.hash(password, 12);
  const perms = getPermissionsForRole(safeRole);

  const doc = await User.create({
    username,
    passwordHash,
    fullName: fullName ?? "",
    mustChangePassword: true,
    role: safeRole,
    perms,
    passwordVersion: 1,
  });

  return {
    id: String(doc._id),
    username: doc.username,
    fullName: doc.fullName ?? "",
    role: doc.role,
    perms: doc.perms,
    mustChangePassword: doc.mustChangePassword,
  };
}

export async function login({ username, password }) {
  const user = await User.findOne({ username }).lean();
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash || "");
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const role = resolveRole(user);
  const perms =
    Array.isArray(user.perms) && user.perms.length > 0
      ? user.perms
      : getPermissionsForRole(role);

  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error("ACCESS_TOKEN_SECRET not set");
  }

  const payload = {
    sub: String(user._id),
    role,
    username: user.username,
    fullName: user.fullName ?? "",
    isAdmin: role === "admin",
    isModerator: role === "admin" || role === "moderator",
    mustChangePassword: user.mustChangePassword,
    pv: user.passwordVersion || 1,
    perms,
  };

  const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: TOKEN_TTL,
  });

  return {
    access_token: token,
    token_type: "Bearer",
    expiresIn: TOKEN_TTL,
    user: {
      id: String(user._id),
      username: user.username,
      fullName: user.fullName ?? "",
      role,
      perms,
      isAdmin: payload.isAdmin,
      isModerator: payload.isModerator,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

export async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await User.findById(userId).select(
    "passwordHash passwordVersion username role mustChangePassword perms"
  );
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }

  const ok = await bcrypt.compare(currentPassword || "", user.passwordHash || "");
  if (!ok) {
    const e = new Error("Current password is incorrect");
    e.status = 400;
    throw e;
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    const e = new Error("New password must be at least 8 characters");
    e.status = 400;
    throw e;
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.mustChangePassword = false;
  user.passwordVersion = (user.passwordVersion || 1) + 1;
  user.passwordUpdatedAt = new Date();
  await user.save();

  const role = user.role.toLowerCase();
  const perms =
    Array.isArray(user.perms) && user.perms.length > 0
      ? user.perms
      : getPermissionsForRole(role);

  const token = jwt.sign(
    {
      sub: String(user._id),
      role,
      username: user.username,
      fullName: user.fullName ?? "",
      mustChangePassword: user.mustChangePassword,
      pv: user.passwordVersion,
      perms,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: TOKEN_TTL }
  );

  return token;
}

export async function requireAuth(req, res, next) {
  try {
    const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (!token) return res.status(401).json({ message: "Missing token" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.sub)
      .select("username fullName role mustChangePassword passwordVersion perms")
      .lean();

    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const tokenPv = Number(decoded.pv || 0);
    const dbPv = Number(user.passwordVersion || 1);
    if (tokenPv !== dbPv) {
      return res.status(401).json({ message: "Token stale" });
    }

    req.user = {
      id: String(user._id),
      username: user.username,
      fullName: user.fullName || "",
      role: user.role.toLowerCase(),
      isAdmin: user.role === "admin",
      isModerator: user.role === "admin" || user.role === "moderator",
      mustChangePassword: !!user.mustChangePassword,
      perms:
        Array.isArray(user.perms) && user.perms.length > 0
          ? user.perms
          : getPermissionsForRole(user.role),
    };
    next();
  } catch {
    res.status(401).json({ message: "Unauthorized" });
  }
}

export function requirePermission(...perms) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ message: "Unauthorized" });

    const ok = perms.every((p) => canRole(role, p));
    if (!ok) {
      return res.status(403).json({
        message: "Forbidden",
        role,
        required: perms,
        granted: getPermissionsForRole(role),
      });
    }
    next();
  };
}

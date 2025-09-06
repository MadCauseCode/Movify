import { Router } from "express";
import axios from "axios";
import Member from "../models/memberModel.js";
import { requireAuth, requirePermission } from "../services/authService.js";

const JSONPH_USERS = "https://jsonplaceholder.typicode.com/users";
const router = Router();

// normalizers
const norm = (v) => (v == null ? "" : String(v)).trim();
const toMemberDTO = (doc) => ({
  _id: doc._id,
  name: doc.name,
  email: doc.email || "",
  city: doc.city || "",
});


router.get(
  "/",
  requireAuth,
  requirePermission("viewMembers"),
  async (req, res, next) => {
    try {
      const docs = await Member.find({}, "name email city").lean();
      res.json((docs || []).map(toMemberDTO));
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  requireAuth,
  requirePermission("handleMembers"),
  async (req, res, next) => {
    try {
      const doc = await Member.findById(req.params.id)
        .select("name email city")
        .lean();
      if (!doc) return res.status(404).json({ message: "Member not found" });
      res.json(toMemberDTO(doc));
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/",
  requireAuth,
  requirePermission("handleMembers"),
  async (req, res, next) => {
    try {
      const name = norm(req.body?.name);
      const email = norm(req.body?.email);
      const city = norm(req.body?.city);

      if (!name) {
        return res.status(400).json({ message: "Field 'name' is required" });
      }

      const created = await Member.create({ name, email, city });
      res.status(201).json(toMemberDTO(created));
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/:id",
  requireAuth,
  requirePermission("handleMembers"), 
  async (req, res, next) => {
    try {
      const updates = {};
      if ("name" in req.body) updates.name = norm(req.body.name);
      if ("email" in req.body) updates.email = norm(req.body.email);
      if ("city" in req.body) updates.city = norm(req.body.city);

      if (!Object.keys(updates).length) {
        return res.status(400).json({ message: "No valid fields to update" });
      }
      if ("name" in updates && updates.name === "") {
        return res.status(400).json({ message: "Field 'name' cannot be empty" });
      }

      const updated = await Member.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });
      if (!updated) return res.status(404).json({ message: "Member not found" });

      res.json(toMemberDTO(updated));
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  requirePermission("handleMembers"),
  async (req, res, next) => {
    try {
      const deleted = await Member.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Member not found" });
      res.json({ message: "Member deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

// Sync from placeholder RestAPI
router.post(
  "/sync",
  requireAuth,
  requirePermission("syncMembers"),
  async (req, res, next) => {
    try {
      const { data } = await axios.get(JSONPH_USERS);
      const raw = Array.isArray(data) ? data : [];

      const candidates = raw
        .map((u) => ({
          name: norm(u?.name),
          email: norm(u?.email),
          city: norm(u?.address?.city),
        }))
        .filter((m) => m.name && m.email && m.city); 

      const created = [];
      for (const m of candidates) {
        // use email to de-dupe
        const exists = await Member.findOne({ email: m.email }).lean();
        if (exists) continue;

        const doc = await Member.create(m);
        created.push(toMemberDTO(doc));
      }

      res.json({
        message: "Members synchronized successfully",
        createdCount: created.length,
        created,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

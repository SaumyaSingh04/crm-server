// server/routes/adminRoutes.js
import express from "express";
import {
  getUsers,
  getDashboardStats,
  createUser,
} from "../controllers/AdminController.js";

const router = express.Router();

router.get("/users", getUsers);
router.get("/dashboard-stats", getDashboardStats);
router.post("/users", createUser);

export default router;

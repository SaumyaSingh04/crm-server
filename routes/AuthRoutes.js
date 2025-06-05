// server/routes/authRoutes.js
import express from "express";
import { login, register } from "../controllers/AuthController.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);

// Debug route to check if user exists
router.get("/check-user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (user) {
      res.json({
        exists: true,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

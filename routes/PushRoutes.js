import express from "express";
import webpush from "web-push";
import dotenv from "dotenv";
import Subscription from "../models/Subscription.js";

dotenv.config();
const router = express.Router();

webpush.setVapidDetails(
  "mailto:you@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Save push subscription
router.post("/subscribe", async (req, res) => {
  console.log("🔥 Push subscription attempt from:", req.headers.origin);
  const sub = req.body;
  try {
    const exists = await Subscription.findOne({ endpoint: sub.endpoint });
    if (!exists) {
      await Subscription.create(sub);
    }
    res.status(201).json({ message: "Subscribed successfully" });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ error: "Subscription failed" });
  }
});

export default router;

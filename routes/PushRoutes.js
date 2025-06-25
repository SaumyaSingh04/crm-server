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
// In pushRoutes.js
router.get('/config', (req, res) => {
  res.json({
    vapidPublic: process.env.VAPID_PUBLIC_KEY,
    frontendUrl: process.env.FRONTEND_URL,
    nodeEnv: process.env.NODE_ENV,
    time: new Date().toString()
  });
});

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

// Send push notification manually for testing
router.post("/send", async (req, res) => {
  try {
    const subscriptions = await Subscription.find({});
    const payload = JSON.stringify({
      title: "🔥 CRM Notification",
      body: "This is a real push from backend!",
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(sub, payload)
      )
    );

    console.log("📨 Push sent to", results.length, "subscribers");
    res.status(200).json({ message: "Push notifications sent" });
  } catch (error) {
    console.error("❌ Push send error:", error);
    res.status(500).json({ error: "Failed to send push" });
  }
});


export default router;

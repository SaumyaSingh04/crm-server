// server/config/sendReminders.js
import cron from "node-cron";
import dotenv from "dotenv";
import webpush from "web-push";
import Lead from "../models/Lead.js";
import Subscription from "../models/Subscription.js";

dotenv.config();

// ✅ Set VAPID keys for push notifications
webpush.setVapidDetails(
  "mailto:you@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ✅ Helper: Check if two dates fall on the same calendar day
const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

// ✅ Run every minute for testing ("0 9 * * *" for production at 9:00 AM)
//cron.schedule("* * * * *", async () => {
cron.schedule("45 10 * * *", async () => {
  console.log("⏰ Cron running...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  try {
    // 🗂 Get leads whose meetingDate is today, tomorrow, or day after
    const leads = await Lead.find({
      meetingDate: {
        $gte: today,
        $lt: new Date(dayAfter.getTime() + 24 * 60 * 60 * 1000), // dayAfter + 1 day
      },
    });
    console.log("📁 Matched leads:", leads);

    const subs = await Subscription.find();
    console.log("📦 Subscribers found:", subs);

    // 🔁 Loop through leads and send relevant reminders
    for (const lead of leads) {
      const meetingDate = new Date(lead.meetingDate);
      let message = "";

      if (isSameDay(meetingDate, dayAfter)) {
        message = `You have a meeting with ${lead.name || "a client"} in 2 days.`;
      } else if (isSameDay(meetingDate, tomorrow)) {
        message = `You have a meeting with ${lead.name || "a client"} tomorrow.`;
      } else if (isSameDay(meetingDate, today)) {
        message = `You have a meeting with ${lead.name || "a client"} today.`;
      }

      if (message) {
        console.log("✅ Notification generated:", message);

        // In sendReminders.js
const payload = JSON.stringify({
    title: "CRM Reminder",
    body: message,
    // Add type identifier
    type: "meeting-reminder",
    meetingId: lead._id.toString()
  });         

        for (const sub of subs) {
          try {
            await webpush.sendNotification(sub, payload);
            console.log("📨 Sent push to:", sub.endpoint);
            console.log("📦 Payload:", payload);

          } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
              await Subscription.deleteOne({ _id: sub._id });
              console.warn("⚠️ Removed expired subscription");
            } else {
              console.error("❌ Push failed:", err.message);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Cron error:", error.message);
  }
});

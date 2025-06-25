import express from "express";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cors from "cors";
import "dotenv/config";
//import fileUpload from "express-fileupload";
import adminRoutes from "./routes/AdminRoutes.js";
import authRoutes from "./routes/AuthRoutes.js";
import projectRoutes from "./routes/ProjectRoutes.js";
import leadRoutes from "./routes/LeadRoutes.js";
import employeeRoutes from "./routes/EmployeeRoutes.js";
import pushRoutes from './routes/PushRoutes.js';
import "./config/sendReminders.js"

const app = express();
const port = process.env.PORT || 5000;

// Allowed Origins
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://crm-client-neon.vercel.app",
];

await connectDB();

// Middleware Configuration
app.use(express.json());
app.use(cors({ origin: allowedOrigins, credentials: true }));
// app.use(fileUpload({
//   useTempFiles: true,
//   tempFileDir: "/tmp/",
// }));

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/leads", leadRoutes);
app.use('/api/employees', employeeRoutes);
app.use("/api/push", pushRoutes);

app.get("/", (req, res) => {
  res.send("API is working..");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
